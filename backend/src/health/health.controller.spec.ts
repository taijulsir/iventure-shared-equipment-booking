import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRawUnsafe: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a successful status payload when database is healthy', async () => {
    vi.mocked(prismaService.$queryRawUnsafe).mockResolvedValueOnce([{ '?column?': 1 }]);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(typeof result.timestamp).toBe('string');
    expect(typeof result.uptime).toBe('number');
  });

  it('should throw ServiceUnavailableException when database is unreachable', async () => {
    vi.mocked(prismaService.$queryRawUnsafe).mockRejectedValueOnce(new Error('DB connection refused'));

    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
  });
});

