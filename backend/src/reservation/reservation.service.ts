import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OwnershipService } from '../auth/ownership.service.js';
import {
  Prisma,
  Role,
  ReservationStatus,
  type Reservation,
} from '../generated/prisma/client.js';
import type { JwtPayload } from '../auth/types.js';
import type { CreateReservationDto } from './dto/create-reservation.dto.js';

// Prisma's known-request-error code used below (equipment lookups reuse the
// same pattern already established in EquipmentService):
// https://www.prisma.io/docs/orm/reference/error-reference
const PRISMA_ERROR_RECORD_NOT_FOUND = 'P2025';

// The actual PostgreSQL SQLSTATE for an EXCLUDE constraint violation.
// Empirically confirmed against this project's Prisma/driver-adapter
// version: Prisma does not have a dedicated P-code for this (unlike, say,
// P2002 for a unique-constraint violation) — it surfaces as a generic
// PrismaClientKnownRequestError with the raw driver error nested in `meta`.
const POSTGRES_EXCLUSION_VIOLATION = '23P01';

// Slot-blocking rule (docs/decisions.md, "Reservation Status Model"): only
// PENDING/CONFIRMED reservations occupy a time slot; REJECTED/CANCELLED do
// not. Mirrors the WHERE clause on the database's EXCLUDE constraint.
const ACTIVE_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
];

// Roles exempt from reservation ownership checks (docs/decisions.md,
// "Role-Based Access vs Resource Ownership"): Administrators may view any
// reservation as part of their explicitly documented "view all
// reservations" permission. There is no documented Administrator
// cancellation capability, so this exemption is used for reads only —
// see `cancel()` below.
const VIEW_OWNERSHIP_EXEMPT_ROLES: Role[] = [Role.ADMIN];

@Injectable()
export class ReservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownershipService: OwnershipService,
  ) {}

  /**
   * Creates a reservation for the authenticated user. Follows the workflow
   * documented in docs/architecture.md, "Reservation Workflow":
   * validate input -> verify equipment -> validate time range -> check
   * conflicts -> determine initial status -> persist.
   */
  async create(user: JwtPayload, dto: CreateReservationDto): Promise<Reservation> {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipmentId },
    });
    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime.getTime() >= endTime.getTime()) {
      throw new BadRequestException('startTime must be before endTime');
    }

    // Layer 1 (docs/decisions.md, "Reservation Overlap Protection"):
    // application-level pre-check for a clear, user-facing conflict error.
    await this.assertNoConflict(dto.equipmentId, startTime, endTime);

    const status = equipment.requiresApproval
      ? ReservationStatus.PENDING
      : ReservationStatus.CONFIRMED;

    try {
      return await this.prisma.reservation.create({
        data: {
          userId: user.sub,
          equipmentId: dto.equipmentId,
          startTime,
          endTime,
          status,
        },
      });
    } catch (error) {
      // Layer 2: the database's EXCLUDE constraint is the authoritative
      // guarantee — this only fires in the rare race where two requests
      // pass the layer-1 pre-check at the same time. Translated into the
      // same 409 response as the layer-1 conflict, per docs/architecture.md
      // ("Error Handling").
      if (this.isExclusionViolation(error)) {
        throw new ConflictException(
          'This equipment is already reserved for an overlapping time range',
        );
      }
      throw error;
    }
  }

  private async assertNoConflict(
    equipmentId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    // Overlap rule (docs/decisions.md): newStart < existingEnd AND
    // newEnd > existingStart. Reservations that only touch at a boundary
    // (e.g. 10:00-12:00 and 12:00-14:00) do not overlap.
    const conflict = await this.prisma.reservation.findFirst({
      where: {
        equipmentId,
        status: { in: ACTIVE_STATUSES },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflict) {
      throw new ConflictException(
        'This equipment is already reserved for an overlapping time range',
      );
    }
  }

  private isExclusionViolation(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }
    const meta = error.meta as
      | { driverAdapterError?: { cause?: { code?: string } } }
      | undefined;
    return meta?.driverAdapterError?.cause?.code === POSTGRES_EXCLUSION_VIOLATION;
  }

  /**
   * Employees see only their own reservations; Administrators see all of
   * them (docs/requirements.md: "Administrators can... view all
   * reservations"). This is ownership enforced by scoping the query itself
   * — there is no client-supplied filter that could widen it, so there is
   * nothing for an Employee to manipulate to see another user's data.
   */
  async findAllForUser(user: JwtPayload): Promise<Reservation[]> {
    const where = user.role === Role.ADMIN ? {} : { userId: user.sub };
    return this.prisma.reservation.findMany({
      where,
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Single-reservation lookup. Unlike `findAllForUser`, the id here is
   * client-supplied, so ownership must be checked per-record after loading
   * it — a valid Employee session alone must not be enough to read another
   * employee's reservation by id (docs/decisions.md).
   */
  async findOne(user: JwtPayload, id: string): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    this.ownershipService.assertOwnsOrExempt(
      user,
      reservation.userId,
      VIEW_OWNERSHIP_EXEMPT_ROLES,
    );

    return reservation;
  }

  /**
   * Cancels the caller's own reservation. Route-level RBAC (@Roles(EMPLOYEE)
   * on the controller) already keeps Administrators out of this action —
   * there is no documented Administrator cancellation capability to exempt
   * here, unlike the read path above, so no roles are passed as exempt.
   */
  async cancel(user: JwtPayload, id: string): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    this.ownershipService.assertOwnsOrExempt(user, reservation.userId, []);

    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new ConflictException(
        `A reservation with status ${reservation.status} cannot be cancelled`,
      );
    }

    // "Upcoming" (docs/decisions.md, "Definition of Upcoming Reservation"):
    // startTime > currentTime. A reservation that has already started (or
    // is exactly now) is no longer upcoming and cannot be cancelled.
    if (reservation.startTime.getTime() <= Date.now()) {
      throw new ConflictException(
        'A reservation that has already started cannot be cancelled',
      );
    }

    try {
      return await this.prisma.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CANCELLED },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_ERROR_RECORD_NOT_FOUND
      ) {
        throw new NotFoundException('Reservation not found');
      }
      throw error;
    }
  }

  /**
   * Approves a PENDING reservation (docs/decisions.md, "Reservation Status
   * Model": PENDING -> CONFIRMED). Administrator-only at the route level
   * (@Roles(Role.ADMIN)) — this is a management action over *any*
   * approval-required reservation, not an ownership-bounded one, so unlike
   * `findOne`/`cancel` there is no OwnershipService call here: an
   * Administrator is not "exempt from ownership," ownership simply doesn't
   * apply to this action (mirrors how EquipmentController's admin-only
   * write routes have no ownership concept either).
   */
  async approve(id: string): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new ConflictException(
        `A reservation with status ${reservation.status} cannot be approved`,
      );
    }

    try {
      return await this.prisma.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CONFIRMED },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PRISMA_ERROR_RECORD_NOT_FOUND) {
          throw new NotFoundException('Reservation not found');
        }
        // Defense in depth (docs/decisions.md, "Approval must not bypass
        // database-level overlap protection"): PENDING reservations already
        // participate in the EXCLUDE constraint's WHERE clause alongside
        // CONFIRMED ones, so a PENDING row already holds its slot exclusively
        // from creation — moving it to CONFIRMED does not change its
        // membership in that constraint and cannot newly conflict with
        // another active reservation under the current schema. This catch
        // exists so that guarantee is enforced by the database, not merely
        // assumed by this reasoning, and so the API never surfaces a raw
        // constraint error if that assumption is ever invalidated.
        if (this.isExclusionViolation(error)) {
          throw new ConflictException(
            'This reservation conflicts with another active reservation for the same equipment',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Rejects a PENDING reservation (docs/decisions.md, "Reservation Status
   * Model": PENDING -> REJECTED). Administrator-only, same reasoning as
   * `approve()` above regarding the absence of an ownership check.
   *
   * No EXCLUDE-violation handling is needed here: REJECTED is excluded from
   * the constraint's WHERE clause, so this transition only ever removes the
   * reservation from the set of active (slot-blocking) reservations — it
   * can free up a conflict, never create one.
   */
  async reject(id: string): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new ConflictException(
        `A reservation with status ${reservation.status} cannot be rejected`,
      );
    }

    try {
      return await this.prisma.reservation.update({
        where: { id },
        data: { status: ReservationStatus.REJECTED },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_ERROR_RECORD_NOT_FOUND
      ) {
        throw new NotFoundException('Reservation not found');
      }
      throw error;
    }
  }
}
