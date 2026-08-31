import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Role } from '../generated/prisma/enums.js';
import type { JwtPayload } from './types.js';

/**
 * RBAC (RolesGuard) answers "can this role perform this kind of action at
 * all?" — it has no notion of which specific record is being accessed. Some
 * rules in docs/decisions.md ("Role-Based Access vs Resource Ownership")
 * additionally require the caller to own the specific resource, e.g. an
 * Employee may view/cancel only their own reservations.
 *
 * This is intentionally a plain, domain-agnostic service rather than a
 * guard: a real ownership check needs the resource's actual owner id, which
 * usually means loading the record first (e.g. a Reservation) — something a
 * generic guard can't do without coupling itself to a specific entity. The
 * calling service/controller loads the resource, then calls this to enforce
 * the boundary, and can also short-circuit ownership for roles with an
 * explicitly documented administrative scope (e.g. ADMIN).
 */
@Injectable()
export class OwnershipService {
  assertOwnsOrExempt(
    user: JwtPayload,
    resourceOwnerId: string,
    exemptRoles: Role[] = [],
  ): void {
    if (exemptRoles.includes(user.role)) {
      return;
    }

    if (user.sub !== resourceOwnerId) {
      throw new ForbiddenException('You do not have access to this resource');
    }
  }
}
