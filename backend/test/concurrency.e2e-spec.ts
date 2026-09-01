import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Concurrency & PostgreSQL EXCLUDE Constraint (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const runId = Date.now();
  const testEmailPrefix = `concurrency-e2e-${runId}`;
  const testEquipmentName = `Concurrency Test Rig ${runId}`;

  let agentEmployeeA: ReturnType<typeof request.agent>;
  let agentEmployeeB: ReturnType<typeof request.agent>;
  let equipmentId: string;

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

    // 1. Register Employee A & Employee B
    const emailA = `${testEmailPrefix}-a@example.com`;
    const passwordA = 'password-a-123';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Employee A', email: emailA, password: passwordA })
      .expect(201);

    const emailB = `${testEmailPrefix}-b@example.com`;
    const passwordB = 'password-b-123';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Employee B', email: emailB, password: passwordB })
      .expect(201);

    agentEmployeeA = request.agent(app.getHttpServer());
    await agentEmployeeA.post('/auth/login').send({ email: emailA, password: passwordA }).expect(200);

    agentEmployeeB = request.agent(app.getHttpServer());
    await agentEmployeeB.post('/auth/login').send({ email: emailB, password: passwordB }).expect(200);

    // 2. Create Equipment
    const equipment = await prisma.equipment.create({
      data: {
        name: testEquipmentName,
        description: 'Testing PostgreSQL EXCLUDE constraint under concurrent race conditions',
        requiresApproval: false,
      },
    });
    equipmentId = equipment.id;
  });

  it('guarantees mutual exclusion when two requests attempt overlapping bookings concurrently', async () => {
    // Both requests target the exact same equipment and time slot simultaneously
    const startTime = '2028-10-10T10:00:00.000Z';
    const endTime = '2028-10-10T12:00:00.000Z';

    const reqA = agentEmployeeA
      .post('/reservations')
      .send({ equipmentId, startTime, endTime });

    const reqB = agentEmployeeB
      .post('/reservations')
      .send({ equipmentId, startTime, endTime });

    // Execute concurrently
    const [resA, resB] = await Promise.all([reqA, reqB]);

    const statuses = [resA.status, resB.status].sort();

    // Invariant: exactly one request must succeed (201) and one must receive a 409 Conflict
    expect(statuses).toEqual([201, 409]);

    const successRes = resA.status === 201 ? resA : resB;
    const conflictRes = resA.status === 409 ? resA : resB;

    expect(successRes.body.id).toBeDefined();
    expect(successRes.body.equipmentId).toBe(equipmentId);
    expect(conflictRes.body.statusCode).toBe(409);
    expect(conflictRes.body.message).toContain('already reserved');

    // Invariant: exactly one active reservation exists in the database
    const dbReservations = await prisma.reservation.findMany({
      where: { equipmentId },
    });
    expect(dbReservations).toHaveLength(1);
    expect(dbReservations[0].id).toBe(successRes.body.id);
  });

  afterAll(async () => {
    // Clean up created resources
    await prisma.reservation.deleteMany({
      where: { equipmentId },
    });
    await prisma.equipment.deleteMany({
      where: { id: equipmentId },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: testEmailPrefix } },
    });
    await app.close();
  });
});
