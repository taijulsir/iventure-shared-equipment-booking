/**
 * Shared pagination response envelope, used by every list endpoint that
 * paginates (Equipment, Reservations). Kept in one place so the frontend
 * can consume every paginated list the same way instead of each module
 * inventing its own shape.
 */
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

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

// Capped so a client can't request a pathologically large page in one call.
export const MAX_LIMIT = 100;

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
