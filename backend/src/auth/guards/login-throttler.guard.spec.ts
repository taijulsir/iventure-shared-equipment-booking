import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { LoginThrottlerGuard } from './login-throttler.guard.js';

describe('LoginThrottlerGuard', () => {
  let guard: LoginThrottlerGuard;

  /**
   * `ip` models `request.ip` as Express would have already resolved it
   * (trusted-proxy-aware — see cookie.util.ts's counterpart in main.ts).
   * `forwardedFor`, when passed, models an attacker-supplied
   * `X-Forwarded-For` header value that the guard must NOT use to derive
   * identity — it's attached to `req.headers` only to prove the guard
   * never reads it.
   */
  const createMockContext = (ip = '127.0.0.1', forwardedFor?: string): ExecutionContext => {
    const req = {
      ip,
      socket: { remoteAddress: ip },
      headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    // Window: 1000ms, maxAttempts: 3 for fast, deterministic unit testing
    guard = new LoginThrottlerGuard();
    guard.windowMs = 1000;
    guard.maxAttempts = 3;
  });

  it('preserves the documented 20 attempts / 60 second defaults', () => {
    const defaultGuard = new LoginThrottlerGuard();
    expect(defaultGuard.maxAttempts).toBe(20);
    expect(defaultGuard.windowMs).toBe(60_000);
  });

  it('should allow requests within limit', () => {
    const ctx = createMockContext();

    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reject requests exceeding limit with 429 Too Many Requests', () => {
    const ctx = createMockContext();

    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);

    try {
      guard.canActivate(ctx);
      expect.unreachable('Should have thrown 429 HttpException');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      const httpErr = err as HttpException;
      expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(httpErr.getResponse()).toEqual({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many login attempts. Please try again later.',
      });
    }
  });

  it('triggers on the (maxAttempts + 1)th attempt — attempt 21 at the real 20/60s defaults', () => {
    const defaultGuard = new LoginThrottlerGuard();
    const ctx = createMockContext('198.51.100.7');

    for (let i = 0; i < 20; i++) {
      expect(defaultGuard.canActivate(ctx)).toBe(true);
    }

    expect(() => defaultGuard.canActivate(ctx)).toThrow(HttpException);
  });

  it('should rate limit independently per client IP', () => {
    const ctx1 = createMockContext('10.0.0.1');
    const ctx2 = createMockContext('10.0.0.2');

    expect(guard.canActivate(ctx1)).toBe(true);
    expect(guard.canActivate(ctx1)).toBe(true);
    expect(guard.canActivate(ctx1)).toBe(true);

    expect(() => guard.canActivate(ctx1)).toThrow(HttpException);

    // ctx2 is a different IP and should still be allowed
    expect(guard.canActivate(ctx2)).toBe(true);
  });

  it('should extract client IP from request.ip, not any header', () => {
    const ctx = createMockContext('127.0.0.1', '203.0.113.195, 70.41.3.18');

    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);

    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
  });

  it('cannot be bypassed by an attacker sending an arbitrary X-Forwarded-For header', () => {
    // Same real request.ip on every call (as it would be for one real
    // client), but a different attacker-supplied X-Forwarded-For value each
    // time. If the guard read the header, each call would land in a fresh
    // bucket and never trip the limit; because it only reads request.ip,
    // they all share one bucket and the limit still trips on attempt 4.
    const sameRealIp = '203.0.113.50';
    const ctxA = createMockContext(sameRealIp, '1.1.1.1');
    const ctxB = createMockContext(sameRealIp, '2.2.2.2');
    const ctxC = createMockContext(sameRealIp, '3.3.3.3');
    const ctxD = createMockContext(sameRealIp, '4.4.4.4');

    expect(guard.canActivate(ctxA)).toBe(true);
    expect(guard.canActivate(ctxB)).toBe(true);
    expect(guard.canActivate(ctxC)).toBe(true);

    expect(() => guard.canActivate(ctxD)).toThrow(HttpException);
  });
});
