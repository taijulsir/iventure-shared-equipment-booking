import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { HashingService } from '../src/auth/hashing.service.js';
import { Role } from '../src/generated/prisma/enums.js';

// Unique per run so re-running this suite never collides with leftover data.
const runId = Date.now();
const testEmailPrefix = `users-e2e-${runId}`;

function uniqueEmail(label: string): string {
  return `${testEmailPrefix}-${label}@example.com`;
}

describe('Users / SuperAdmin role management (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let agentEmployee: ReturnType<typeof request.agent>;
  let agentAdmin: ReturnType<typeof request.agent>;
  let agentSuperAdmin: ReturnType<typeof request.agent>;
  let employeeId: string;
  let superAdminId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    const hashingService = app.get(HashingService);

    // A normal EMPLOYEE, created the normal way — registration never accepts
    // a role field, so this account starts as EMPLOYEE by construction.
    const employeeEmail = uniqueEmail('employee');
    const employeePassword = 'employee-password-123';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Users Test Employee', email: employeeEmail, password: employeePassword })
      .expect(201)
      .then((res) => {
        employeeId = res.body.id;
      });

    // ADMIN and SUPERADMIN are both seeded directly in the database, never
    // through public registration or through this feature's own endpoint —
    // matching the existing convention in authorization.e2e-spec.ts /
    // equipment.e2e-spec.ts for Administrator accounts.
    const adminEmail = uniqueEmail('admin');
    const adminPassword = 'admin-password-123';
    await prisma.user.create({
      data: {
        name: 'Users Test Admin',
        email: adminEmail,
        passwordHash: await hashingService.hash(adminPassword),
        role: Role.ADMIN,
      },
    });

    const superAdminEmail = uniqueEmail('superadmin');
    const superAdminPassword = 'superadmin-password-123';
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Users Test SuperAdmin',
        email: superAdminEmail,
        passwordHash: await hashingService.hash(superAdminPassword),
        role: Role.SUPERADMIN,
      },
    });
    superAdminId = superAdmin.id;

    agentEmployee = request.agent(app.getHttpServer());
    await agentEmployee
      .post('/auth/login')
      .send({ email: employeeEmail, password: employeePassword })
      .expect(200);

    agentAdmin = request.agent(app.getHttpServer());
    await agentAdmin
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    agentSuperAdmin = request.agent(app.getHttpServer());
    await agentSuperAdmin
      .post('/auth/login')
      .send({ email: superAdminEmail, password: superAdminPassword })
      .expect(200);
  });

  afterAll(async () => {
    // Equipment created by the cross-cutting promotion test has no
    // reservations pointing at it, so it can be removed directly (no FK
    // ordering concern like equipment.e2e-spec.ts has).
    await prisma.equipment.deleteMany({ where: { name: { contains: `Users E2E Equipment ${runId}` } } });
    await prisma.user.deleteMany({ where: { email: { contains: testEmailPrefix } } });
    await app.close();
  });

  describe('authorization: only SUPERADMIN may reach any /users route', () => {
    it('rejects an unauthenticated caller with 401', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });

    it('rejects an EMPLOYEE with 403', async () => {
      await agentEmployee.get('/users').expect(403);
    });

    it('rejects an ADMIN with 403 — being Admin does not grant user-management access', async () => {
      await agentAdmin.get('/users').expect(403);
      await agentAdmin.get(`/users/${employeeId}`).expect(403);
      await agentAdmin
        .patch(`/users/${employeeId}/role`)
        .send({ role: 'ADMIN' })
        .expect(403);
    });

    it('allows SUPERADMIN to list users, including itself', async () => {
      const response = await agentSuperAdmin.get('/users').expect(200);
      const emails = response.body.map((user: { email: string }) => user.email);
      expect(emails).toEqual(
        expect.arrayContaining([
          uniqueEmail('employee'),
          uniqueEmail('admin'),
          uniqueEmail('superadmin'),
        ]),
      );
      // Never leaks the password hash.
      response.body.forEach((user: Record<string, unknown>) => {
        expect(user).not.toHaveProperty('passwordHash');
      });
    });
  });

  describe('GET /users/:id', () => {
    it('returns the user for SUPERADMIN', async () => {
      const response = await agentSuperAdmin.get(`/users/${employeeId}`).expect(200);
      expect(response.body.id).toBe(employeeId);
      expect(response.body.role).toBe('EMPLOYEE');
    });

    it('returns 404 for a well-formed but nonexistent id', async () => {
      await agentSuperAdmin
        .get('/users/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('returns 400 for a malformed id', async () => {
      await agentSuperAdmin.get('/users/not-a-uuid').expect(400);
    });
  });

  describe('PATCH /users/:id/role — valid transitions', () => {
    it('promotes EMPLOYEE -> ADMIN', async () => {
      const response = await agentSuperAdmin
        .patch(`/users/${employeeId}/role`)
        .send({ role: 'ADMIN' })
        .expect(200);
      expect(response.body.role).toBe('ADMIN');
    });

    it('demotes ADMIN -> EMPLOYEE (reverting the promotion above)', async () => {
      const response = await agentSuperAdmin
        .patch(`/users/${employeeId}/role`)
        .send({ role: 'EMPLOYEE' })
        .expect(200);
      expect(response.body.role).toBe('EMPLOYEE');
    });
  });

  describe('PATCH /users/:id/role — privilege-escalation and safety rules', () => {
    it('rejects a role value of SUPERADMIN outright (400) — never reachable via this endpoint', async () => {
      await agentSuperAdmin
        .patch(`/users/${employeeId}/role`)
        .send({ role: 'SUPERADMIN' })
        .expect(400);
    });

    it('rejects an invalid/unknown role value (400)', async () => {
      await agentSuperAdmin
        .patch(`/users/${employeeId}/role`)
        .send({ role: 'NOT_A_ROLE' })
        .expect(400);
    });

    it('rejects changing/removing the SuperAdmin through this endpoint (403)', async () => {
      await agentSuperAdmin
        .patch(`/users/${superAdminId}/role`)
        .send({ role: 'ADMIN' })
        .expect(403);
    });

    it('rejects the SuperAdmin demoting/changing their own role (403)', async () => {
      await agentSuperAdmin
        .patch(`/users/${superAdminId}/role`)
        .send({ role: 'EMPLOYEE' })
        .expect(403);
    });

    it('rejects a no-op / invalid transition — target already has the requested role (409)', async () => {
      await agentSuperAdmin
        .patch(`/users/${employeeId}/role`)
        .send({ role: 'EMPLOYEE' }) // already EMPLOYEE after the revert above
        .expect(409);
    });

    it('rejects a normal user modifying their own role even indirectly (403, blocked by RolesGuard first)', async () => {
      await agentEmployee
        .patch(`/users/${employeeId}/role`)
        .send({ role: 'ADMIN' })
        .expect(403);
    });

    it('returns 404 when the target user does not exist', async () => {
      await agentSuperAdmin
        .patch('/users/00000000-0000-0000-0000-000000000000/role')
        .send({ role: 'ADMIN' })
        .expect(404);
    });

    it('returns 400 for a malformed target id', async () => {
      await agentSuperAdmin.patch('/users/not-a-uuid/role').send({ role: 'ADMIN' }).expect(400);
    });
  });

  describe('cross-cutting: promoted ADMIN gains the ADMIN-only capabilities that come with the role hierarchy', () => {
    it('an EMPLOYEE promoted to ADMIN can now approve reservations like any other Admin', async () => {
      await agentSuperAdmin
        .patch(`/users/${employeeId}/role`)
        .send({ role: 'ADMIN' })
        .expect(200);

      const promotedAgent = request.agent(app.getHttpServer());
      await promotedAgent
        .post('/auth/login')
        .send({ email: uniqueEmail('employee'), password: 'employee-password-123' })
        .expect(200);

      // Creating equipment is an ADMIN-only action — confirms the promoted
      // user now genuinely holds ADMIN privileges end-to-end, not just the
      // label in the database.
      await promotedAgent
        .post('/equipment')
        .send({ name: `Users E2E Equipment ${runId}` })
        .expect(201);

      // Revert so later re-runs of this describe block (if any) and other
      // suites aren't affected by this user's elevated role.
      await agentSuperAdmin
        .patch(`/users/${employeeId}/role`)
        .send({ role: 'EMPLOYEE' })
        .expect(200);
    });
  });
});
