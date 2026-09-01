import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

/**
 * Proves the fix for the audited "rate limiter IP-spoofing bypass" finding:
 * LoginThrottlerGuard must key off Express's own trusted-proxy-aware
 * `request.ip`, never a raw client-supplied `X-Forwarded-For` header. This
 * is only observable end-to-end (real Express request handling, real
 * `app.set('trust proxy', ...)` resolution) — the guard's own unit spec
 * (login-throttler.guard.spec.ts) covers the guard's internal logic in
 * isolation, using a mocked `request.ip`.
 *
 * Two app instances model the two environments this project actually runs
 * in (docs/decisions.md, "Login Rate Limiting Reversal and Trusted Proxy
 * Configuration"):
 *   - `untrustedApp`: no `trust proxy` configured — local dev, CI, and this
 *     project's e2e suite in general (main.ts only sets it when
 *     NODE_ENV=production). There is no reverse proxy in front, so
 *     X-Forwarded-For must be ignored entirely.
 *   - `trustedApp`: `trust proxy` set to `1`, mirroring main.ts's
 *     production configuration for the VPS's single Nginx hop. Nginx is
 *     documented (docs/deployment.md) to overwrite X-Forwarded-For with the
 *     real client address, so a single trustworthy value is exactly what
 *     this app would see in production — supertest requests below set that
 *     header directly to model Nginx having already done so.
 *
 * All requests below hit the login endpoint with a well-formed but invalid
 * credential pair. The guard runs before any credential check, so every
 * allowed request returns 401 (wrong credentials) and every throttled one
 * returns 429 — no test users need to be registered for this suite.
 */
describe('Login rate limiting — trusted client IP (e2e)', () => {
  let untrustedApp: INestApplication<App>;
  let trustedApp: INestApplication<App>;

  const loginBody = { email: 'nobody@example.com', password: 'wrong-password' };

  async function buildApp(configureTrustProxy: boolean): Promise<INestApplication<App>> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    if (configureTrustProxy) {
      app.set('trust proxy', 1);
    }
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    return app;
  }

  beforeAll(async () => {
    untrustedApp = await buildApp(false);
    trustedApp = await buildApp(true);
  });

  afterAll(async () => {
    await untrustedApp.close();
    await trustedApp.close();
  });

  it('without a trusted proxy hop configured, a spoofed X-Forwarded-For cannot reset the bucket or bypass the limit', async () => {
    // 20 allowed attempts, each with a different attacker-supplied
    // X-Forwarded-For value — if the header were honored, each would land
    // in its own fresh bucket and never trip the limit.
    for (let i = 0; i < 20; i++) {
      const res = await request(untrustedApp.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', `10.0.0.${i}`)
        .send(loginBody);
      expect(res.status).toBe(401);
    }

    // The 21st attempt — yet another new spoofed header value — is still
    // throttled, because all 20 prior attempts and this one share the same
    // real request.ip (the test client's loopback address).
    const res = await request(untrustedApp.getHttpServer())
      .post('/auth/login')
      .set('X-Forwarded-For', '10.0.0.99')
      .send(loginBody);
    expect(res.status).toBe(429);
    expect(res.body.message).toContain('Too many login attempts');
  });

  it('with the production trust-proxy hop configured, distinct real client IPs (via a single trusted X-Forwarded-For) stay isolated', async () => {
    const clientA = '203.0.113.10';
    const clientB = '203.0.113.20';

    // Client A: 20 allowed attempts, then throttled on the 21st.
    for (let i = 0; i < 20; i++) {
      const res = await request(trustedApp.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', clientA)
        .send(loginBody);
      expect(res.status).toBe(401);
    }
    const throttled = await request(trustedApp.getHttpServer())
      .post('/auth/login')
      .set('X-Forwarded-For', clientA)
      .send(loginBody);
    expect(throttled.status).toBe(429);

    // Client B is a genuinely different address and must be unaffected by
    // Client A's exhausted bucket.
    const clientBRes = await request(trustedApp.getHttpServer())
      .post('/auth/login')
      .set('X-Forwarded-For', clientB)
      .send(loginBody);
    expect(clientBRes.status).toBe(401);
  });
});
