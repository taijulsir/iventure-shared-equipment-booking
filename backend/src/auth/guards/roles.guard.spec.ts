import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { Role } from '../../generated/prisma/enums.js';

function contextWithUser(user: { sub: string; role: Role } | undefined): ExecutionContext {
  const request = { user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function makeReflector(requiredRoles: Role[] | undefined): Reflector {
  return {
    getAllAndOverride: vi.fn().mockReturnValue(requiredRoles),
  } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('allows an authenticated request when the route has no role metadata', () => {
    const guard = new RolesGuard(makeReflector(undefined));
    const context = contextWithUser({ sub: 'user-1', role: Role.EMPLOYEE });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows an authenticated request when the route has an empty roles array', () => {
    const guard = new RolesGuard(makeReflector([]));
    const context = contextWithUser({ sub: 'user-1', role: Role.EMPLOYEE });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows ADMIN to access an ADMIN-only route', () => {
    const guard = new RolesGuard(makeReflector([Role.ADMIN]));
    const context = contextWithUser({ sub: 'admin-1', role: Role.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects EMPLOYEE from an ADMIN-only route with 403, not 401', () => {
    const guard = new RolesGuard(makeReflector([Role.ADMIN]));
    const context = contextWithUser({ sub: 'user-1', role: Role.EMPLOYEE });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects ADMIN from a route explicitly limited to EMPLOYEE', () => {
    const guard = new RolesGuard(makeReflector([Role.EMPLOYEE]));
    const context = contextWithUser({ sub: 'admin-1', role: Role.ADMIN });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects with 401 when a role is required but no user is on the request', () => {
    const guard = new RolesGuard(makeReflector([Role.ADMIN]));
    const context = contextWithUser(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
