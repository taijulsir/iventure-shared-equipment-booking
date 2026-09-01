// Moved to a shared location (backend/src/common/pagination.ts) now that
// Reservations also returns a paginated list and needs the same shape.
// Re-exported here so existing imports in this module keep working
// unchanged.
export type { PaginationMeta, PaginatedResult } from '../common/pagination.js';

import type { Equipment } from '../generated/prisma/client.js';

/**
 * `available` is `null` when GET /equipment was called without a
 * startTime/endTime window (availability wasn't evaluated — not "unknown"
 * in some other sense), and `true`/`false` when a window was supplied,
 * computed against active (PENDING/CONFIRMED) reservations for that
 * specific window (docs/requirements.md: "availability is determined by
 * the requested time window against existing reservations, not a static
 * equipment flag" — so this is never a stored column on Equipment itself).
 */
export interface EquipmentWithAvailability extends Equipment {
  available: boolean | null;
}
