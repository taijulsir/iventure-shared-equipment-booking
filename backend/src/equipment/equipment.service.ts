import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, type Equipment } from '../generated/prisma/client.js';
import type { CreateEquipmentDto } from './dto/create-equipment.dto.js';
import type { UpdateEquipmentDto } from './dto/update-equipment.dto.js';
import type { ListEquipmentDto } from './dto/list-equipment.dto.js';
import type { PaginatedResult } from './types.js';

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
   * Lists equipment for the catalogue/search view. This is deliberately
   * just a text search + pagination over the Equipment table — it does not
   * compute time-window availability against reservations, since the
   * Reservation domain doesn't exist yet (docs/requirements.md: availability
   * is a function of requested time window vs. existing reservations, never
   * a static field on Equipment).
   */
  async findAll(query: ListEquipmentDto): Promise<PaginatedResult<Equipment>> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const where: Prisma.EquipmentWhereInput | undefined = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const [data, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.equipment.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
