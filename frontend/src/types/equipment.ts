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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
