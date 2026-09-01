/**
 * Mirrors backend/src/equipment/equipment.service.ts's Equipment shape and
 * PaginatedResult<T> (backend/src/equipment/types.ts). No `available`/
 * `isAvailable` field here — availability is a function of a *requested
 * time window* against reservations, never a static property of Equipment
 * itself (see docs/requirements.md), so it can't be a plain field on this
 * type. See `EquipmentWithAvailability` below for the shape GET /equipment
 * actually returns.
 */
export interface Equipment {
  id: string;
  name: string;
  description: string | null;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * What GET /equipment's list items actually are: `available` is `null`
 * unless the request included a startTime/endTime window, in which case
 * it's computed fresh for that exact window (never cached/stored) —
 * mirrors backend/src/equipment/types.ts's EquipmentWithAvailability.
 * GET /equipment/:id and the create/update mutations return plain
 * `Equipment`, not this type — availability is only ever computed in bulk,
 * for the list view.
 */
export interface EquipmentWithAvailability extends Equipment {
  available: boolean | null;
}

/** POST /equipment body (Admin/SuperAdmin only). */
export interface CreateEquipmentInput {
  name: string;
  description?: string;
  requiresApproval?: boolean;
}

/** PATCH /equipment/:id body — every field optional, same as the backend's UpdateEquipmentDto. */
export interface UpdateEquipmentInput {
  name?: string;
  description?: string;
  requiresApproval?: boolean;
}

// Moved to a shared location (types/pagination.ts) now that Reservations
// also returns a paginated list. Re-exported here so existing imports in
// this codebase keep working unchanged.
export type { PaginationMeta, PaginatedResult } from "./pagination";
