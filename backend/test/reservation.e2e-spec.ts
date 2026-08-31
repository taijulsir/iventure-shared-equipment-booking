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
const testEmailPrefix = `reservation-e2e-${runId}`;
const testEquipmentPrefix = `Reservation E2E ${runId}`;

function uniqueEmail(label: string): string {
  return `${testEmailPrefix}-${label}@example.com`;
}

describe('Reservation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let agentEmployeeA: ReturnType<typeof request.agent>;
  let agentEmployeeB: ReturnType<typeof request.agent>;
  let agentAdmin: ReturnType<typeof request.agent>;

  let equipmentNoApprovalId: string;
  let equipmentRequiresApprovalId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirrors src/main.ts's bootstrap, same as the other e2e suites.
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    const hashingService = app.get(HashingService);

    const employeeAEmail = uniqueEmail('employee-a');
    const employeeAPassword = 'employee-a-password';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Reservation Employee A', email: employeeAEmail, password: employeeAPassword })
      .expect(201);

    const employeeBEmail = uniqueEmail('employee-b');
    const employeeBPassword = 'employee-b-password';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Reservation Employee B', email: employeeBEmail, password: employeeBPassword })
      .expect(201);

    const adminEmail = uniqueEmail('admin');
    const adminPassword = 'admin-password';
    await prisma.user.create({
      data: {
        name: 'Reservation Test Admin',
        email: adminEmail,
        passwordHash: await hashingService.hash(adminPassword),
        role: Role.ADMIN,
      },
    });

    agentEmployeeA = request.agent(app.getHttpServer());
    await agentEmployeeA
      .post('/auth/login')
      .send({ email: employeeAEmail, password: employeeAPassword })
      .expect(200);

    agentEmployeeB = request.agent(app.getHttpServer());
    await agentEmployeeB
      .post('/auth/login')
      .send({ email: employeeBEmail, password: employeeBPassword })
      .expect(200);

    agentAdmin = request.agent(app.getHttpServer());
    await agentAdmin.post('/auth/login').send({ email: adminEmail, password: adminPassword }).expect(200);

    const noApprovalResponse = await agentAdmin
      .post('/equipment')
      .send({ name: `${testEquipmentPrefix} No Approval Camera`, requiresApproval: false })
      .expect(201);
    equipmentNoApprovalId = noApprovalResponse.body.id;

    const requiresApprovalResponse = await agentAdmin
      .post('/equipment')
      .send({ name: `${testEquipmentPrefix} Approval Drone`, requiresApproval: true })
      .expect(201);
    equipmentRequiresApprovalId = requiresApprovalResponse.body.id;
  });

  afterAll(async () => {
    await prisma.reservation.deleteMany({
      where: { equipment: { name: { startsWith: testEquipmentPrefix } } },
    });
    await prisma.equipment.deleteMany({ where: { name: { startsWith: testEquipmentPrefix } } });
    await prisma.user.deleteMany({ where: { email: { contains: testEmailPrefix } } });
    await app.close();
  });

  describe('authentication', () => {
    it('rejects unauthenticated create/list/detail/cancel with 401', async () => {
      await request(app.getHttpServer()).post('/reservations').send({}).expect(401);
      await request(app.getHttpServer()).get('/reservations').expect(401);
      await request(app.getHttpServer())
        .get('/reservations/00000000-0000-0000-0000-000000000000')
        .expect(401);
      await request(app.getHttpServer())
        .patch('/reservations/00000000-0000-0000-0000-000000000000/cancel')
        .expect(401);
    });
  });

  describe('create', () => {
    it('creates a CONFIRMED reservation for equipment that does not require approval', async () => {
      const response = await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-01T10:00:00.000Z',
          endTime: '2027-02-01T12:00:00.000Z',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        equipmentId: equipmentNoApprovalId,
        status: 'CONFIRMED',
      });
    });

    it('creates a PENDING reservation for equipment that requires approval', async () => {
      const response = await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentRequiresApprovalId,
          startTime: '2027-02-01T10:00:00.000Z',
          endTime: '2027-02-01T12:00:00.000Z',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        equipmentId: equipmentRequiresApprovalId,
        status: 'PENDING',
      });
    });

    it('uses the authenticated identity as the owner, ignoring any client-supplied user/status field', async () => {
      const response = await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-02T10:00:00.000Z',
          endTime: '2027-02-02T12:00:00.000Z',
        })
        .expect(201);

      const stored = await prisma.reservation.findUniqueOrThrow({
        where: { id: response.body.id },
      });
      const employeeA = await prisma.user.findUniqueOrThrow({
        where: { email: uniqueEmail('employee-a') },
      });
      expect(stored.userId).toBe(employeeA.id);
    });

    it('rejects a client-supplied userId or status field with 400', async () => {
      await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-03T10:00:00.000Z',
          endTime: '2027-02-03T12:00:00.000Z',
          status: 'CONFIRMED',
        })
        .expect(400);

      await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-03T10:00:00.000Z',
          endTime: '2027-02-03T12:00:00.000Z',
          userId: 'some-other-user-id',
        })
        .expect(400);
    });

    it('returns 404 for a non-existent equipment id', async () => {
      await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: '00000000-0000-0000-0000-000000000000',
          startTime: '2027-02-04T10:00:00.000Z',
          endTime: '2027-02-04T12:00:00.000Z',
        })
        .expect(404);
    });

    it('rejects a malformed equipment UUID with 400', async () => {
      await agentEmployeeA
        .post('/reservations')
        .send({ equipmentId: 'not-a-uuid', startTime: '2027-02-04T10:00:00.000Z', endTime: '2027-02-04T12:00:00.000Z' })
        .expect(400);
    });

    it('rejects a start time that is not before the end time', async () => {
      await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-05T12:00:00.000Z',
          endTime: '2027-02-05T10:00:00.000Z',
        })
        .expect(400);
    });

    it('rejects an overlapping reservation for the same equipment with 409', async () => {
      await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-06T10:00:00.000Z',
          endTime: '2027-02-06T12:00:00.000Z',
        })
        .expect(201);

      const response = await agentEmployeeB
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-06T11:00:00.000Z',
          endTime: '2027-02-06T13:00:00.000Z',
        })
        .expect(409);

      expect(response.body.message).not.toMatch(/prisma|exclusion|sql/i);
    });

    it('allows a boundary-touching reservation immediately after an existing one', async () => {
      await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-07T10:00:00.000Z',
          endTime: '2027-02-07T12:00:00.000Z',
        })
        .expect(201);

      await agentEmployeeB
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-07T12:00:00.000Z',
          endTime: '2027-02-07T14:00:00.000Z',
        })
        .expect(201);
    });

    it('rejects Administrator creating a reservation with 403 (not a documented Administrator capability)', async () => {
      await agentAdmin
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-08T10:00:00.000Z',
          endTime: '2027-02-08T12:00:00.000Z',
        })
        .expect(403);
    });
  });

  describe('listing and detail (ownership)', () => {
    it("an Employee's list contains only their own reservations", async () => {
      const response = await agentEmployeeA.get('/reservations').expect(200);
      const employeeA = await prisma.user.findUniqueOrThrow({
        where: { email: uniqueEmail('employee-a') },
      });

      expect(response.body.length).toBeGreaterThan(0);
      for (const reservation of response.body) {
        expect(reservation.userId).toBe(employeeA.id);
      }
    });

    it("an Administrator's list includes reservations from multiple employees", async () => {
      const response = await agentAdmin.get('/reservations').expect(200);
      const userIds = new Set(response.body.map((r: { userId: string }) => r.userId));
      expect(userIds.size).toBeGreaterThanOrEqual(2);
    });

    it('allows an employee to fetch their own reservation by id', async () => {
      const created = await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-09T10:00:00.000Z',
          endTime: '2027-02-09T12:00:00.000Z',
        })
        .expect(201);

      const response = await agentEmployeeA.get(`/reservations/${created.body.id}`).expect(200);
      expect(response.body.id).toBe(created.body.id);
    });

    it("rejects an employee fetching another employee's reservation with 403", async () => {
      const created = await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-10T10:00:00.000Z',
          endTime: '2027-02-10T12:00:00.000Z',
        })
        .expect(201);

      await agentEmployeeB.get(`/reservations/${created.body.id}`).expect(403);
    });

    it('allows an Administrator to fetch any reservation by id', async () => {
      const created = await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-11T10:00:00.000Z',
          endTime: '2027-02-11T12:00:00.000Z',
        })
        .expect(201);

      const response = await agentAdmin.get(`/reservations/${created.body.id}`).expect(200);
      expect(response.body.id).toBe(created.body.id);
    });

    it('returns 404 for a non-existent reservation id', async () => {
      await agentEmployeeA
        .get('/reservations/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('rejects a malformed reservation id with 400', async () => {
      await agentEmployeeA.get('/reservations/not-a-uuid').expect(400);
    });
  });

  describe('cancellation', () => {
    it('allows an employee to cancel their own upcoming reservation', async () => {
      const created = await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-12T10:00:00.000Z',
          endTime: '2027-02-12T12:00:00.000Z',
        })
        .expect(201);

      const response = await agentEmployeeA
        .patch(`/reservations/${created.body.id}/cancel`)
        .expect(200);
      expect(response.body.status).toBe('CANCELLED');
    });

    it("rejects an employee cancelling another employee's reservation with 403", async () => {
      const created = await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-13T10:00:00.000Z',
          endTime: '2027-02-13T12:00:00.000Z',
        })
        .expect(201);

      await agentEmployeeB.patch(`/reservations/${created.body.id}/cancel`).expect(403);
    });

    it('rejects cancelling an already-cancelled reservation with 409', async () => {
      const created = await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-14T10:00:00.000Z',
          endTime: '2027-02-14T12:00:00.000Z',
        })
        .expect(201);

      await agentEmployeeA.patch(`/reservations/${created.body.id}/cancel`).expect(200);
      await agentEmployeeA.patch(`/reservations/${created.body.id}/cancel`).expect(409);
    });

    it('a cancelled reservation frees the time slot for a new reservation', async () => {
      const created = await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-15T10:00:00.000Z',
          endTime: '2027-02-15T12:00:00.000Z',
        })
        .expect(201);

      await agentEmployeeA.patch(`/reservations/${created.body.id}/cancel`).expect(200);

      await agentEmployeeB
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-15T10:00:00.000Z',
          endTime: '2027-02-15T12:00:00.000Z',
        })
        .expect(201);
    });

    it('rejects Administrator cancelling a reservation with 403 (not a documented Administrator capability)', async () => {
      const created = await agentEmployeeA
        .post('/reservations')
        .send({
          equipmentId: equipmentNoApprovalId,
          startTime: '2027-02-16T10:00:00.000Z',
          endTime: '2027-02-16T12:00:00.000Z',
        })
        .expect(201);

      await agentAdmin.patch(`/reservations/${created.body.id}/cancel`).expect(403);
    });

    it('returns 404 when cancelling a non-existent reservation', async () => {
      await agentEmployeeA
        .patch('/reservations/00000000-0000-0000-0000-000000000000/cancel')
        .expect(404);
    });
  });
});
