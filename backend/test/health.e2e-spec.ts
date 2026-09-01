import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  it('/health (GET) returns 200 when database is healthy', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        if (res.body.status !== 'ok') {
          throw new Error('Expected health status to be "ok"');
        }
      });
  });

  it('/health (GET) returns 503 when database is unavailable', async () => {
    vi.spyOn(prisma, '$queryRawUnsafe').mockRejectedValueOnce(new Error('Connection lost'));

    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(503);

    expect(response.body.statusCode).toBe(503);
    expect(response.body.message).toBe('Database service unavailable');
  });

  afterEach(async () => {
    await app.close();
  });
});

