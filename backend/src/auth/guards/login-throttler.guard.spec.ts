import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { LoginThrottlerGuard } from './login-throttler.guard.js';

describe('LoginThrottlerGuard', () => {
  let guard: LoginThrottlerGuard;

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

  it('should extract client IP correctly from x-forwarded-for header', () => {
    const ctx = createMockContext('127.0.0.1', '203.0.113.195, 70.41.3.18');

    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);

    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
  });
});
