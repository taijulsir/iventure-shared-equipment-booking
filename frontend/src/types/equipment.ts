/**
 * Mirrors backend/src/equipment/equipment.service.ts's Equipment shape and
 * PaginatedResult<T> (backend/src/equipment/types.ts). There is deliberately
 * no `available`/`isAvailable` field — availability is a function of the
 * requested time window against reservations, not a static property of
 * Equipment (see docs/requirements.md), and this phase does not implement
 * that calculation yet.
 */
export interface Equipment {
  id: string;
  name: string;
  description: string | null;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
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
