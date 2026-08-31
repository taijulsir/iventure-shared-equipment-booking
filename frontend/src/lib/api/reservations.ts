import { apiRequest } from "./core";
import type { Reservation } from "@/types/reservation";

/**
 * GET /reservations — the backend scopes this by role itself: an Employee
 * gets only their own reservations, an Administrator gets every user's
 * (backend/src/reservation/reservation.service.ts, findAllForUser). There
 * is no client-side filtering to replicate here.
 */
export function listReservations(cookieHeader?: string): Promise<Reservation[]> {
  return apiRequest<Reservation[]>("/reservations", { cookieHeader });
}
