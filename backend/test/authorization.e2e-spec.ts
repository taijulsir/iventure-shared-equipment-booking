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
const testEmailPrefix = `authz-e2e-${runId}`;

function uniqueEmail(label: string): string {
  return `${testEmailPrefix}-${label}@example.com`;
}

describe('Authorization (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let employeeAId: string;
  let employeeBId: string;
  let agentEmployeeA: ReturnType<typeof request.agent>;
  let agentEmployeeB: ReturnType<typeof request.agent>;
  let agentAdmin: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirrors src/main.ts's bootstrap, same as the auth e2e suite.
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    const hashingService = app.get(HashingService);

    // Two EMPLOYEE accounts, created the normal way (registration always
    // forces EMPLOYEE — nothing special is happening here).
    const employeeAEmail = uniqueEmail('employee-a');
    const employeeAPassword = 'employee-a-password';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Employee A', email: employeeAEmail, password: employeeAPassword })
      .expect(201);

    const employeeBEmail = uniqueEmail('employee-b');
    const employeeBPassword = 'employee-b-password';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Employee B', email: employeeBEmail, password: employeeBPassword })
      .expect(201);

    // One ADMIN account, seeded directly in the database — matching
    // docs/decisions.md's "Administrator Account Provisioning" rule that
    // admin accounts are never created through public registration.
    const adminEmail = uniqueEmail('admin');
    const adminPassword = 'admin-password';
    const adminPasswordHash = await hashingService.hash(adminPassword);
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
      },
    });

    agentEmployeeA = request.agent(app.getHttpServer());
    await agentEmployeeA
      .post('/auth/login')
      .send({ email: employeeAEmail, password: employeeAPassword })
      .expect(200)
      .then((res) => {
        employeeAId = res.body.id;
      });

    agentEmployeeB = request.agent(app.getHttpServer());
    await agentEmployeeB
      .post('/auth/login')
      .send({ email: employeeBEmail, password: employeeBPassword })
      .expect(200)
      .then((res) => {
        employeeBId = res.body.id;
      });

    agentAdmin = request.agent(app.getHttpServer());
    await agentAdmin
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: testEmailPrefix } } });
    await app.close();
  });

  describe('authentication precedes authorization', () => {
    it('rejects with 401 when there is no auth cookie at all', async () => {
      await request(app.getHttpServer()).get('/_authz-demo/admin-only').expect(401);
    });

    it('rejects with 401 for an invalid token, before any role check runs', async () => {
      await request(app.getHttpServer())
        .get('/_authz-demo/admin-only')
        .set('Cookie', 'auth_token=not-a-real-jwt')
        .expect(401);
    });
  });

  describe('RolesGuard', () => {
    it('allows ADMIN to access an ADMIN-only route', async () => {
      const response = await agentAdmin.get('/_authz-demo/admin-only').expect(200);
      expect(response.body).toEqual({ ok: true, scope: 'admin-only' });
    });

    it('rejects an authenticated EMPLOYEE from an ADMIN-only route with 403', async () => {
      await agentEmployeeA.get('/_authz-demo/admin-only').expect(403);
    });

    it('allows EMPLOYEE to access an EMPLOYEE-only route', async () => {
      const response = await agentEmployeeA.get('/_authz-demo/employee-only').expect(200);
      expect(response.body).toEqual({ ok: true, scope: 'employee-only' });
    });

    it('rejects ADMIN from a route explicitly limited to EMPLOYEE', async () => {
      await agentAdmin.get('/_authz-demo/employee-only').expect(403);
    });
  });

  describe('resource ownership', () => {
    it('allows an employee to access their own resource', async () => {
      const response = await agentEmployeeA
        .get(`/_authz-demo/own-resource/${employeeAId}`)
        .expect(200);
      expect(response.body).toEqual({ ok: true, ownerId: employeeAId });
    });

    it("rejects an employee accessing another employee's resource, even knowing the exact id", async () => {
      await agentEmployeeB.get(`/_authz-demo/own-resource/${employeeAId}`).expect(403);
    });

    it('still requires authentication on the ownership route (no @Roles does not mean no guard at all)', async () => {
      await request(app.getHttpServer())
        .get(`/_authz-demo/own-resource/${employeeAId}`)
        .expect(401);
    });

    it("allows an administrator to access any employee's resource under the documented admin scope", async () => {
      const response = await agentAdmin
        .get(`/_authz-demo/own-resource/${employeeBId}`)
        .expect(200);
      expect(response.body).toEqual({ ok: true, ownerId: employeeBId });
    });
  });
});
