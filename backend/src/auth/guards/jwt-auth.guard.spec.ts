import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AUTH_COOKIE_NAME } from '../cookie.util.js';

function contextWithCookies(cookies: Record<string, string>): ExecutionContext {
  const request = { cookies } as { cookies: Record<string, string> } & Record<
    string,
    unknown
  >;
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('rejects a request with no auth cookie', async () => {
    const jwtService = { verifyAsync: vi.fn() };
    const guard = new JwtAuthGuard(jwtService as never);

    await expect(guard.canActivate(contextWithCookies({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired token', async () => {
    const jwtService = { verifyAsync: vi.fn().mockRejectedValue(new Error('bad token')) };
    const guard = new JwtAuthGuard(jwtService as never);

    await expect(
      guard.canActivate(contextWithCookies({ [AUTH_COOKIE_NAME]: 'not-a-real-token' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the verified claims to the request on success', async () => {
    const payload = { sub: 'user-1', role: 'EMPLOYEE' };
    const jwtService = { verifyAsync: vi.fn().mockResolvedValue(payload) };
    const guard = new JwtAuthGuard(jwtService as never);
    const context = contextWithCookies({ [AUTH_COOKIE_NAME]: 'valid-token' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest<{ user: unknown }>();
    expect(request.user).toEqual(payload);
  });
});
