import { apiRequest } from "./core";
import type { CreateReservationInput, Reservation, ReservationStatus } from "@/types/reservation";
import type { PaginatedResult } from "@/types/pagination";

export interface ListReservationsParams {
  status?: ReservationStatus;
  equipmentId?: string;
  page?: number;
  limit?: number;
}

/**
 * GET /reservations — the backend scopes this by role itself: an Employee
 * gets only their own reservations, an Administrator/SuperAdmin gets every
 * user's (backend/src/reservation/reservation.service.ts, findAllForUser).
 * `status`/`equipmentId` narrow that scope further; they never widen it, so
 * there is no client-side re-filtering to layer on top of this.
 */
export function listReservations(
  params?: ListReservationsParams,
  cookieHeader?: string,
): Promise<PaginatedResult<Reservation>> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.equipmentId) query.set("equipmentId", params.equipmentId);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const queryString = query.toString();

  return apiRequest<PaginatedResult<Reservation>>(
    `/reservations${queryString ? `?${queryString}` : ""}`,
    { cookieHeader },
  );
}

/** GET /reservations/:id — 403s if the caller doesn't own it and isn't an Admin/SuperAdmin. */
export function getReservation(id: string, cookieHeader?: string): Promise<Reservation> {
  return apiRequest<Reservation>(`/reservations/${id}`, { cookieHeader });
}

/** POST /reservations — Employee only; always creates on behalf of the authenticated caller. */
export function createReservation(input: CreateReservationInput): Promise<Reservation> {
  return apiRequest<Reservation>("/reservations", { method: "POST", body: input });
}

/** PATCH /reservations/:id/cancel — Employee only, and only their own upcoming reservation. */
export function cancelReservation(id: string): Promise<Reservation> {
  return apiRequest<Reservation>(`/reservations/${id}/cancel`, { method: "PATCH" });
}

/** PATCH /reservations/:id/approve — Admin/SuperAdmin only; PENDING -> CONFIRMED. */
export function approveReservation(id: string): Promise<Reservation> {
  return apiRequest<Reservation>(`/reservations/${id}/approve`, { method: "PATCH" });
}

/** PATCH /reservations/:id/reject — Admin/SuperAdmin only; PENDING -> REJECTED. */
export function rejectReservation(id: string): Promise<Reservation> {
  return apiRequest<Reservation>(`/reservations/${id}/reject`, { method: "PATCH" });
}
