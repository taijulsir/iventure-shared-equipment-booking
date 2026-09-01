import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, type Equipment } from '../generated/prisma/client.js';
import { overlappingReservationWhere } from '../common/reservation-overlap.js';
import type { CreateEquipmentDto } from './dto/create-equipment.dto.js';
import type { UpdateEquipmentDto } from './dto/update-equipment.dto.js';
import type { ListEquipmentDto } from './dto/list-equipment.dto.js';
import type { EquipmentWithAvailability, PaginatedResult } from './types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

// Prisma's known-request-error codes used below:
// https://www.prisma.io/docs/orm/reference/error-reference
const PRISMA_ERROR_RECORD_NOT_FOUND = 'P2025';
const PRISMA_ERROR_FOREIGN_KEY_CONSTRAINT = 'P2003';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEquipmentDto): Promise<Equipment> {
    return this.prisma.equipment.create({
      data: {
        name: dto.name,
        description: dto.description,
        requiresApproval: dto.requiresApproval ?? false,
      },
    });
  }

  /**
   * Lists equipment for the catalogue/search view: text search + pagination
   * over the Equipment table, unchanged from before. When `startTime`/
   * `endTime` are both supplied, each returned item is additionally
   * annotated with `available` — computed against active (PENDING/
   * CONFIRMED) reservations for that exact window, using the same overlap
   * rule reservation creation itself enforces (see
   * `common/reservation-overlap.ts`) rather than a second copy of it.
   * Availability is never a stored/static field on Equipment
   * (docs/requirements.md) — it's computed fresh on every request, for the
   * specific window asked about, which is why it's absent (`null`) unless
   * both times are given.
   */
  async findAll(query: ListEquipmentDto): Promise<PaginatedResult<EquipmentWithAvailability>> {
    const page = query.page ?? DEFAULT_PAGE;
    // `ids` means "give me exactly this known set" (e.g. resolving names for
    // a page of reservations) — defaulting `limit` to that set's size means
    // the caller doesn't also have to compute and pass a matching limit
    // just to avoid truncation; an explicit `limit` still overrides it.
    // Floored at 1 so an (unusual) empty `ids` array can't produce a
    // zero/negative `take` and a divide-by-zero in the totalPages below.
    const limit = query.limit ?? Math.max(query.ids?.length ?? DEFAULT_LIMIT, 1);

    const where: Prisma.EquipmentWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.ids) {
      where.id = { in: query.ids };
    }

    const [data, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.equipment.count({ where }),
    ]);

    const window = this.resolveAvailabilityWindow(query);
    const dataWithAvailability = await this.annotateAvailability(data, window);

    return {
      data: dataWithAvailability,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Validates the optional startTime/endTime pair the same way
   * ReservationService.create validates its own: format is already checked
   * by ListEquipmentDto's `@IsISO8601()`, so this only enforces the
   * cross-field rules a single-field DTO decorator can't — both-or-neither,
   * and start strictly before end.
   */
  private resolveAvailabilityWindow(
    query: ListEquipmentDto,
  ): { startTime: Date; endTime: Date } | null {
    if (!query.startTime && !query.endTime) {
      return null;
    }
    if (!query.startTime || !query.endTime) {
      throw new BadRequestException(
        'startTime and endTime must both be provided to check availability',
      );
    }

    const startTime = new Date(query.startTime);
    const endTime = new Date(query.endTime);

    if (startTime.getTime() >= endTime.getTime()) {
      throw new BadRequestException('startTime must be before endTime');
    }

    return { startTime, endTime };
  }

  private async annotateAvailability(
    equipment: Equipment[],
    window: { startTime: Date; endTime: Date } | null,
  ): Promise<EquipmentWithAvailability[]> {
    if (!window) {
      return equipment.map((item) => ({ ...item, available: null }));
    }
    if (equipment.length === 0) {
      return [];
    }

    const conflicting = await this.prisma.reservation.findMany({
      where: overlappingReservationWhere(
        { in: equipment.map((item) => item.id) },
        window.startTime,
        window.endTime,
      ),
      select: { equipmentId: true },
    });
    const conflictingIds = new Set(conflicting.map((reservation) => reservation.equipmentId));

    return equipment.map((item) => ({ ...item, available: !conflictingIds.has(item.id) }));
  }

  async findOne(id: string): Promise<Equipment> {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }
    return equipment;
  }

  async update(id: string, dto: UpdateEquipmentDto): Promise<Equipment> {
    try {
      return await this.prisma.equipment.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          requiresApproval: dto.requiresApproval,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_ERROR_RECORD_NOT_FOUND
      ) {
        throw new NotFoundException('Equipment not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.equipment.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PRISMA_ERROR_RECORD_NOT_FOUND) {
          throw new NotFoundException('Equipment not found');
        }
        if (error.code === PRISMA_ERROR_FOREIGN_KEY_CONSTRAINT) {
          // The reservations.equipment_id FK is ON DELETE RESTRICT
          // (docs/decisions.md) — this equipment has reservation history and
          // must not be silently orphaned or cascade-deleted.
          throw new ConflictException(
            'Equipment cannot be deleted because it has existing reservation history',
          );
        }
      }
      throw error;
    }
  }
}
