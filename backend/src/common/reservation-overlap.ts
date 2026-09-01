import type { Prisma } from '../generated/prisma/client.js';
import { ReservationStatus } from '../generated/prisma/enums.js';

/**
 * Slot-blocking rule (docs/decisions.md, "Reservation Status Model"): only
 * PENDING/CONFIRMED reservations occupy a time slot; REJECTED/CANCELLED do
 * not. Mirrors the WHERE clause on the database's EXCLUDE constraint.
 *
 * Shared by ReservationService (rejecting a conflicting create) and
 * EquipmentService (computing availability for a requested window) so the
 * overlap rule is defined in exactly one place — see
 * `overlappingReservationWhere` below.
 */
export const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
];

/**
 * The overlap rule itself (docs/decisions.md, "Reservation Overlap
 * Protection"): newStart < existingEnd AND newEnd > existingStart.
 * Reservations that only touch at a boundary (e.g. 10:00-12:00 and
 * 12:00-14:00) do not overlap.
 *
 * `equipmentId` accepts either a single id (existence check for one
 * reservation create) or `{ in: [...] }` (batch check across a page of
 * equipment, e.g. EquipmentService.findAll's availability annotation) —
 * same WHERE shape either way, just plugged into `findFirst` vs.
 * `findMany` by the caller.
 */
export function overlappingReservationWhere(
  equipmentId: string | { in: string[] },
  startTime: Date,
  endTime: Date,
): Prisma.ReservationWhereInput {
  return {
    equipmentId,
    status: { in: ACTIVE_RESERVATION_STATUSES },
    startTime: { lt: endTime },
    endTime: { gt: startTime },
  };
}
