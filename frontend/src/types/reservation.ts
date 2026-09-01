/**
 * Mirrors the backend's ReservationStatus enum and Reservation model
 * (backend/prisma/schema.prisma, backend/src/reservation/reservation.service.ts).
 * Timestamps are ISO 8601 strings over the wire, stored/compared in UTC by
 * the backend (docs/decisions.md) — this phase does not convert them to a
 * user-facing timezone yet, it just renders the raw value.
 */
export type ReservationStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";

export interface Reservation {
  id: string;
  userId: string;
  equipmentId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

/** POST /reservations body. No `status` field — the backend always derives
 * the initial status from the equipment's requiresApproval flag. */
export interface CreateReservationInput {
  equipmentId: string;
  startTime: string;
  endTime: string;
}
