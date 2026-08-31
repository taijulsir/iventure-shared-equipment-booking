import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Unique per test run so re-running this suite never collides with leftover
// data from a previous run.
const runId = Date.now();
const testEmailPrefix = `auth-e2e-${runId}`;

function uniqueEmail(label: string): string {
  return `${testEmailPrefix}-${label}@example.com`;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirrors src/main.ts's bootstrap so the e2e app behaves like production.
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: testEmailPrefix } },
    });
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('creates an EMPLOYEE account and returns no sensitive fields', async () => {
      const email = uniqueEmail('register-ok');

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'New Employee', email, password: 'a-valid-password' })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'New Employee',
        email,
        role: 'EMPLOYEE',
      });
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');

      const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
      expect(stored.role).toBe('EMPLOYEE');
      expect(stored.passwordHash).not.toBe('a-valid-password');
      expect(stored.passwordHash.length).toBeGreaterThan(0);
    });

    it('rejects a client-supplied role field instead of silently ignoring it', async () => {
      const email = uniqueEmail('register-role-escalation');

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Would-be Admin',
          email,
          password: 'a-valid-password',
          role: 'ADMIN',
        })
        .expect(400);

      const stored = await prisma.user.findUnique({ where: { email } });
      expect(stored).toBeNull();
    });

    it('rejects a duplicate email', async () => {
      const email = uniqueEmail('register-duplicate');

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'First', email, password: 'a-valid-password' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Second', email, password: 'another-password' })
        .expect(409);
    });

    it('rejects invalid input (bad email, short password, missing name)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'X', email: 'not-an-email', password: 'a-valid-password' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'X', email: uniqueEmail('short-pw'), password: 'short' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: uniqueEmail('no-name'), password: 'a-valid-password' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    const email = uniqueEmail('login-flow');
    const password = 'correct-password-123';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Login Flow User', email, password })
        .expect(201);
    });

    it('succeeds with valid credentials, sets an HttpOnly cookie, and hides sensitive fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      expect(response.body).toMatchObject({ email, role: 'EMPLOYEE' });
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');

      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      expect(cookieHeader).toContain('auth_token=');
      expect(cookieHeader.toLowerCase()).toContain('httponly');
    });

    it('rejects a wrong password and an unknown email with the exact same generic message', async () => {
      // The point isn't that the message avoids the word "password" — it's
      // that a wrong password and a nonexistent account are indistinguishable
      // to the caller, so neither response confirms which one was the case.
      const wrongPassword = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'totally-wrong' })
        .expect(401);

      const unknownEmail = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail('does-not-exist'), password: 'whatever123' })
        .expect(401);

      expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
      expect(wrongPassword.body).not.toHaveProperty('passwordHash');
    });
  });

  describe('authenticated session (register -> login -> me -> logout)', () => {
    const email = uniqueEmail('session-flow');
    const password = 'session-password-123';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Session User', email, password })
        .expect(201);
    });

    it('rejects /auth/me with no cookie', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('rejects /auth/me with a garbage token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', 'auth_token=not-a-real-jwt')
        .expect(401);
    });

    it('allows /auth/me with a valid session, then logout clears it', async () => {
      const agent = request.agent(app.getHttpServer());

      const loginResponse = await agent
        .post('/auth/login')
        .send({ email, password })
        .expect(200);
      expect(loginResponse.body.email).toBe(email);

      const meResponse = await agent.get('/auth/me').expect(200);
      expect(meResponse.body).toMatchObject({ email, role: 'EMPLOYEE' });
      expect(meResponse.body).not.toHaveProperty('passwordHash');

      const logoutResponse = await agent.post('/auth/logout').expect(200);
      const setCookie = logoutResponse.headers['set-cookie'];
      const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      expect(cookieHeader).toContain('auth_token=;');

      // the agent's cookie jar now holds the cleared cookie, so this request
      // is sent without a usable token — the guard must reject it.
      await agent.get('/auth/me').expect(401);
    });
  });
});
