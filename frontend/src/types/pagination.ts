/**
 * Shared shape for every paginated list response
 * (backend/src/common/pagination.ts) — Equipment and Reservations both
 * return this envelope, so the frontend has one type/rendering pattern for
 * "a page of X" instead of one per list.
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
