// Moved to a shared location (backend/src/common/pagination.ts) now that
// Reservations also returns a paginated list and needs the same shape.
// Re-exported here so existing imports in this module keep working
// unchanged.
export type { PaginationMeta, PaginatedResult } from '../common/pagination.js';
