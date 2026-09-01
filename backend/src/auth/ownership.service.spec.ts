import { describe, it, expect } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { OwnershipService } from './ownership.service.js';
import { Role } from '../generated/prisma/enums.js';
import type { JwtPayload } from './types.js';

describe('OwnershipService', () => {
  const ownershipService = new OwnershipService();

  it('allows a user who owns the resource', () => {
    const user: JwtPayload = { sub: 'user-1', role: Role.EMPLOYEE };

    expect(() => ownershipService.assertOwnsOrExempt(user, 'user-1')).not.toThrow();
  });

  it('rejects a user who does not own the resource', () => {
    const user: JwtPayload = { sub: 'user-1', role: Role.EMPLOYEE };

    expect(() => ownershipService.assertOwnsOrExempt(user, 'user-2')).toThrow(
      ForbiddenException,
    );
  });

  it('does not let ownership be bypassed just by supplying a different resource id — the check re-runs per id, not once per request', () => {
    const user: JwtPayload = { sub: 'user-1', role: Role.EMPLOYEE };

    expect(() => ownershipService.assertOwnsOrExempt(user, 'user-1')).not.toThrow();
    expect(() => ownershipService.assertOwnsOrExempt(user, 'someone-elses-id')).toThrow(
      ForbiddenException,
    );
  });

  it('exempts a role with explicitly granted scope (e.g. ADMIN) from the ownership check', () => {
    const admin: JwtPayload = { sub: 'admin-1', role: Role.ADMIN };

    expect(() =>
      ownershipService.assertOwnsOrExempt(admin, 'someone-elses-id', [Role.ADMIN]),
    ).not.toThrow();
  });

  it('does not exempt a role that is not in the exempt list, even if it looks similar', () => {
    const employee: JwtPayload = { sub: 'user-1', role: Role.EMPLOYEE };

    expect(() =>
      ownershipService.assertOwnsOrExempt(employee, 'someone-elses-id', [Role.ADMIN]),
    ).toThrow(ForbiddenException);
  });
});
