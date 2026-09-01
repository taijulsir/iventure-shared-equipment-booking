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

// Unique per run so re-running this suite never collides with leftover data,
// and so this suite's equipment doesn't interfere with another suite's.
const runId = Date.now();
const testEmailPrefix = `equipment-e2e-${runId}`;
const testEquipmentPrefix = `Equipment E2E ${runId}`;

function uniqueEmail(label: string): string {
  return `${testEmailPrefix}-${label}@example.com`;
}

describe('Equipment (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let agentEmployee: ReturnType<typeof request.agent>;
  let agentAdmin: ReturnType<typeof request.agent>;
  let agentSuperAdmin: ReturnType<typeof request.agent>;
  let employeeId: string;

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

    const employeeEmail = uniqueEmail('employee');
    const employeePassword = 'employee-password-123';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Equipment Test Employee', email: employeeEmail, password: employeePassword })
      .expect(201)
      .then((res) => {
        employeeId = res.body.id;
      });

    // Admin seeded directly, never through registration — same convention
    // used in authorization.e2e-spec.ts.
    const adminEmail = uniqueEmail('admin');
    const adminPassword = 'admin-password-123';
    await prisma.user.create({
      data: {
        name: 'Equipment Test Admin',
        email: adminEmail,
        passwordHash: await hashingService.hash(adminPassword),
        role: Role.ADMIN,
      },
    });

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

    const superAdminEmail = uniqueEmail('superadmin');
    const superAdminPassword = 'superadmin-password-123';
    await prisma.user.create({
      data: {
        name: 'Equipment Test SuperAdmin',
        email: superAdminEmail,
        passwordHash: await hashingService.hash(superAdminPassword),
        role: Role.SUPERADMIN,
      },
    });
    agentSuperAdmin = request.agent(app.getHttpServer());
    await agentSuperAdmin
      .post('/auth/login')
      .send({ email: superAdminEmail, password: superAdminPassword })
      .expect(200);
  });

  afterAll(async () => {
    // Reservations first (FK), then equipment, then users.
    await prisma.reservation.deleteMany({
      where: { equipment: { name: { startsWith: testEquipmentPrefix } } },
    });
    await prisma.equipment.deleteMany({ where: { name: { startsWith: testEquipmentPrefix } } });
    await prisma.user.deleteMany({ where: { email: { contains: testEmailPrefix } } });
    await app.close();
  });

  describe('read permissions', () => {
    it('allows an authenticated Employee to list equipment', async () => {
      const response = await agentEmployee.get('/equipment').expect(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });

    it('allows an authenticated Admin to list equipment', async () => {
      await agentAdmin.get('/equipment').expect(200);
    });

    it('rejects an unauthenticated request to list equipment', async () => {
      await request(app.getHttpServer()).get('/equipment').expect(401);
    });
  });

  describe('write permissions (RBAC)', () => {
    it('rejects Employee creating equipment with 403', async () => {
      await agentEmployee
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} Should Not Exist` })
        .expect(403);
    });

    it('allows Admin to create equipment', async () => {
      const response = await agentAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} Camera`, description: 'A camera', requiresApproval: true })
        .expect(201);

      expect(response.body).toMatchObject({
        name: `${testEquipmentPrefix} Camera`,
        description: 'A camera',
        requiresApproval: true,
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('rejects a client-supplied id/createdAt/updatedAt on create', async () => {
      await agentAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} Bad`, id: 'not-allowed' })
        .expect(400);
    });
  });

  describe('read a single equipment item, update, and delete', () => {
    let equipmentId: string;

    beforeAll(async () => {
      const response = await agentAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} Projector`, description: 'Conference projector' })
        .expect(201);
      equipmentId = response.body.id;
    });

    it('allows Employee and Admin to GET the single item', async () => {
      const asEmployee = await agentEmployee.get(`/equipment/${equipmentId}`).expect(200);
      expect(asEmployee.body.id).toBe(equipmentId);

      const asAdmin = await agentAdmin.get(`/equipment/${equipmentId}`).expect(200);
      expect(asAdmin.body.id).toBe(equipmentId);
    });

    it('returns 400 for a malformed UUID', async () => {
      await agentEmployee.get('/equipment/not-a-uuid').expect(400);
    });

    it('returns 404 for a well-formed but non-existent UUID', async () => {
      await agentEmployee
        .get('/equipment/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('rejects Employee updating equipment with 403', async () => {
      await agentEmployee
        .patch(`/equipment/${equipmentId}`)
        .send({ name: 'Hacked Name' })
        .expect(403);
    });

    it('allows Admin to partially update equipment', async () => {
      const response = await agentAdmin
        .patch(`/equipment/${equipmentId}`)
        .send({ requiresApproval: true })
        .expect(200);

      expect(response.body).toMatchObject({
        id: equipmentId,
        name: `${testEquipmentPrefix} Projector`,
        requiresApproval: true,
      });
    });

    it('rejects a blank name on update', async () => {
      await agentAdmin.patch(`/equipment/${equipmentId}`).send({ name: '' }).expect(400);
    });

    it('rejects a non-boolean requiresApproval on update', async () => {
      await agentAdmin
        .patch(`/equipment/${equipmentId}`)
        .send({ requiresApproval: 'yes' })
        .expect(400);
    });

    it('returns 404 when updating a non-existent equipment id', async () => {
      await agentAdmin
        .patch('/equipment/00000000-0000-0000-0000-000000000000')
        .send({ name: 'Does not matter' })
        .expect(404);
    });

    it('rejects Employee deleting equipment with 403', async () => {
      await agentEmployee.delete(`/equipment/${equipmentId}`).expect(403);
    });

    it('returns 404 when deleting a non-existent equipment id', async () => {
      await agentAdmin
        .delete('/equipment/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('allows Admin to delete equipment with no reservation history', async () => {
      await agentAdmin.delete(`/equipment/${equipmentId}`).expect(204);
      await agentAdmin.get(`/equipment/${equipmentId}`).expect(404);
    });
  });

  describe('deletion conflict when reservation history exists', () => {
    it('returns 409, not a raw database error, when the equipment has a reservation', async () => {
      const created = await agentAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} Referenced` })
        .expect(201);
      const referencedEquipmentId = created.body.id;

      // Created directly via Prisma — there is no Reservation API yet in
      // this phase, but the FK/constraint behavior this equipment's
      // deletion must respect is already live in the schema.
      await prisma.reservation.create({
        data: {
          userId: employeeId,
          equipmentId: referencedEquipmentId,
          startTime: new Date('2027-01-01T10:00:00.000Z'),
          endTime: new Date('2027-01-01T12:00:00.000Z'),
        },
      });

      const response = await agentAdmin.delete(`/equipment/${referencedEquipmentId}`).expect(409);
      expect(response.body.message).not.toMatch(/prisma|foreign key|constraint/i);

      // still exists, delete was correctly refused
      await agentAdmin.get(`/equipment/${referencedEquipmentId}`).expect(200);
    });
  });

  describe('search and pagination', () => {
    beforeAll(async () => {
      await prisma.equipment.createMany({
        data: [
          { name: `${testEquipmentPrefix} Search Alpha Camera`, description: 'DSLR' },
          { name: `${testEquipmentPrefix} Search Beta Laptop`, description: 'has a camera bag' },
          { name: `${testEquipmentPrefix} Search Gamma Chair` },
        ],
      });
    });

    it('finds matches by name', async () => {
      const response = await agentEmployee
        .get('/equipment')
        .query({ search: `${testEquipmentPrefix} Search Alpha` })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('Alpha Camera');
    });

    it('finds matches by description as well as name', async () => {
      const response = await agentEmployee
        .get('/equipment')
        .query({ search: 'camera' })
        .expect(200);

      const names: string[] = response.body.data.map((item: { name: string }) => item.name);
      expect(names).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Alpha Camera'),
          expect.stringContaining('Beta Laptop'),
        ]),
      );
    });

    it('returns predictable pagination metadata', async () => {
      const response = await agentEmployee
        .get('/equipment')
        .query({ search: `${testEquipmentPrefix} Search`, page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    });

    it('rejects an invalid page value', async () => {
      await agentEmployee.get('/equipment').query({ page: 0 }).expect(400);
    });

    it('rejects a limit above the maximum', async () => {
      await agentEmployee.get('/equipment').query({ limit: 1000 }).expect(400);
    });

    it('rejects a non-numeric page value', async () => {
      await agentEmployee.get('/equipment').query({ page: 'abc' }).expect(400);
    });
  });

  describe('ids filter', () => {
    let idA: string;
    let idB: string;

    beforeAll(async () => {
      const a = await agentAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} Ids Filter A` })
        .expect(201);
      idA = a.body.id;

      const b = await agentAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} Ids Filter B` })
        .expect(201);
      idB = b.body.id;

      // Never matched — proves the filter doesn't just return everything.
      await agentAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} Ids Filter Excluded` })
        .expect(201);
    });

    it('returns exactly the requested ids, defaulting the limit to the set size', async () => {
      const response = await agentEmployee
        .get('/equipment')
        .query(`ids=${idA}&ids=${idB}`)
        .expect(200);

      const returnedIds = response.body.data.map((item: { id: string }) => item.id);
      expect(returnedIds.sort()).toEqual([idA, idB].sort());
      expect(response.body.meta.limit).toBe(2);
    });

    it('returns an empty result for an unknown id, not an error', async () => {
      const response = await agentEmployee
        .get('/equipment')
        .query(`ids=00000000-0000-0000-0000-000000000000`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.meta.totalPages).toBe(0);
    });

    it('rejects a malformed id in the ids filter with 400', async () => {
      await agentEmployee.get('/equipment').query('ids=not-a-uuid').expect(400);
    });
  });

  // Proves the @Roles(Role.ADMIN, Role.SUPERADMIN) grant on these three
  // routes actually works for a real SUPERADMIN session, not just an
  // ADMIN one — the write-permissions describe block above only ever used
  // agentAdmin.
  describe('SuperAdmin write access (role hierarchy)', () => {
    it('allows SuperAdmin to create equipment', async () => {
      const response = await agentSuperAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} SuperAdmin Created` })
        .expect(201);

      expect(response.body).toMatchObject({ name: `${testEquipmentPrefix} SuperAdmin Created` });
    });

    it('allows SuperAdmin to update and delete equipment', async () => {
      const created = await agentSuperAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} SuperAdmin Managed` })
        .expect(201);
      const id = created.body.id;

      const updated = await agentSuperAdmin
        .patch(`/equipment/${id}`)
        .send({ requiresApproval: true })
        .expect(200);
      expect(updated.body.requiresApproval).toBe(true);

      await agentSuperAdmin.delete(`/equipment/${id}`).expect(204);
      await agentSuperAdmin.get(`/equipment/${id}`).expect(404);
    });
  });

  describe('availability window', () => {
    let bookedEquipmentId: string;
    const windowStart = '2027-05-01T10:00:00.000Z';
    const windowEnd = '2027-05-01T12:00:00.000Z';

    beforeAll(async () => {
      await agentAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} Availability Free` })
        .expect(201);

      const booked = await agentAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} Availability Booked` })
        .expect(201);
      bookedEquipmentId = booked.body.id;

      await agentEmployee
        .post('/reservations')
        .send({ equipmentId: bookedEquipmentId, startTime: windowStart, endTime: windowEnd })
        .expect(201);
    });

    it('omits availability (null) when no window is requested', async () => {
      const response = await agentEmployee
        .get('/equipment')
        .query({ search: `${testEquipmentPrefix} Availability` })
        .expect(200);

      for (const item of response.body.data) {
        expect(item.available).toBeNull();
      }
    });

    it('marks equipment with no overlapping reservation as available', async () => {
      const response = await agentEmployee
        .get('/equipment')
        .query({ search: `${testEquipmentPrefix} Availability Free`, startTime: windowStart, endTime: windowEnd })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].available).toBe(true);
    });

    it('marks equipment with an overlapping active reservation as unavailable', async () => {
      const response = await agentEmployee
        .get('/equipment')
        .query({ search: `${testEquipmentPrefix} Availability Booked`, startTime: windowStart, endTime: windowEnd })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].available).toBe(false);
    });

    it('marks the same equipment available again outside the booked window', async () => {
      const response = await agentEmployee
        .get('/equipment')
        .query({
          search: `${testEquipmentPrefix} Availability Booked`,
          startTime: '2027-05-01T13:00:00.000Z',
          endTime: '2027-05-01T14:00:00.000Z',
        })
        .expect(200);

      expect(response.body.data[0].available).toBe(true);
    });

    it('is unaffected by a REJECTED reservation (does not block the slot)', async () => {
      const requiresApproval = await agentAdmin
        .post('/equipment')
        .send({ name: `${testEquipmentPrefix} Availability Rejected`, requiresApproval: true })
        .expect(201);
      const equipmentId = requiresApproval.body.id;

      const reservation = await agentEmployee
        .post('/reservations')
        .send({ equipmentId, startTime: windowStart, endTime: windowEnd })
        .expect(201);
      expect(reservation.body.status).toBe('PENDING');

      await agentAdmin.patch(`/reservations/${reservation.body.id}/reject`).expect(200);

      const response = await agentEmployee
        .get('/equipment')
        .query({ search: `${testEquipmentPrefix} Availability Rejected`, startTime: windowStart, endTime: windowEnd })
        .expect(200);

      expect(response.body.data[0].available).toBe(true);
    });

    it('rejects startTime without endTime with 400', async () => {
      await agentEmployee.get('/equipment').query({ startTime: windowStart }).expect(400);
    });

    it('rejects endTime without startTime with 400', async () => {
      await agentEmployee.get('/equipment').query({ endTime: windowEnd }).expect(400);
    });

    it('rejects startTime that is not before endTime with 400', async () => {
      await agentEmployee
        .get('/equipment')
        .query({ startTime: windowEnd, endTime: windowStart })
        .expect(400);
    });

    it('rejects a malformed startTime with 400', async () => {
      await agentEmployee
        .get('/equipment')
        .query({ startTime: 'not-a-date', endTime: windowEnd })
        .expect(400);
    });
  });
});
