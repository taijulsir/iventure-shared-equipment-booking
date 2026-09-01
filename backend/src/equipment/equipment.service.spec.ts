import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EquipmentService } from './equipment.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

const sampleEquipment = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Projector',
  description: 'A conference room projector',
  requiresApproval: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function prismaKnownError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('mock prisma error', {
    code,
    clientVersion: 'test',
  });
}

describe('EquipmentService', () => {
  let equipmentService: EquipmentService;
  let prisma: {
    equipment: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    reservation: {
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      equipment: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      reservation: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EquipmentService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    equipmentService = module.get(EquipmentService);
  });

  describe('create', () => {
    it('creates equipment, defaulting requiresApproval to false when omitted', async () => {
      prisma.equipment.create.mockResolvedValue(sampleEquipment);

      const result = await equipmentService.create({ name: 'Projector' });

      expect(prisma.equipment.create).toHaveBeenCalledWith({
        data: { name: 'Projector', description: undefined, requiresApproval: false },
      });
      expect(result).toEqual(sampleEquipment);
    });

    it('passes through an explicit requiresApproval value', async () => {
      prisma.equipment.create.mockResolvedValue({ ...sampleEquipment, requiresApproval: true });

      await equipmentService.create({ name: 'Camera', requiresApproval: true });

      expect(prisma.equipment.create).toHaveBeenCalledWith({
        data: { name: 'Camera', description: undefined, requiresApproval: true },
      });
    });
  });

  describe('findAll', () => {
    it('returns a paginated result with default page/limit', async () => {
      prisma.equipment.findMany.mockResolvedValue([sampleEquipment]);
      prisma.equipment.count.mockResolvedValue(1);

      const result = await equipmentService.findAll({});

      expect(prisma.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, skip: 0, take: 20 }),
      );
      expect(result).toEqual({
        data: [{ ...sampleEquipment, available: null }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    it('applies pagination offsets for page > 1', async () => {
      prisma.equipment.findMany.mockResolvedValue([]);
      prisma.equipment.count.mockResolvedValue(45);

      const result = await equipmentService.findAll({ page: 3, limit: 10 });

      expect(prisma.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.meta).toEqual({ page: 3, limit: 10, total: 45, totalPages: 5 });
    });

    it('searches name and description case-insensitively', async () => {
      prisma.equipment.findMany.mockResolvedValue([sampleEquipment]);
      prisma.equipment.count.mockResolvedValue(1);

      await equipmentService.findAll({ search: 'camera' });

      expect(prisma.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'camera', mode: 'insensitive' } },
              { description: { contains: 'camera', mode: 'insensitive' } },
            ],
          },
        }),
      );
      expect(prisma.equipment.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'camera', mode: 'insensitive' } },
            { description: { contains: 'camera', mode: 'insensitive' } },
          ],
        },
      });
    });

    describe('ids filter', () => {
      const otherEquipment = { ...sampleEquipment, id: '33333333-3333-3333-3333-333333333333' };

      it('filters by the given ids and defaults the limit to the set size', async () => {
        prisma.equipment.findMany.mockResolvedValue([sampleEquipment, otherEquipment]);
        prisma.equipment.count.mockResolvedValue(2);

        const ids = [sampleEquipment.id, otherEquipment.id];
        const result = await equipmentService.findAll({ ids });

        expect(prisma.equipment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: { in: ids } }, skip: 0, take: 2 }),
        );
        expect(result.meta).toEqual({ page: 1, limit: 2, total: 2, totalPages: 1 });
      });

      it('an explicit limit still overrides the ids-based default', async () => {
        prisma.equipment.findMany.mockResolvedValue([sampleEquipment]);
        prisma.equipment.count.mockResolvedValue(2);

        await equipmentService.findAll({ ids: [sampleEquipment.id, otherEquipment.id], limit: 1 });

        expect(prisma.equipment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ take: 1 }),
        );
      });

      it('does not divide by zero when given an empty ids array', async () => {
        prisma.equipment.findMany.mockResolvedValue([]);
        prisma.equipment.count.mockResolvedValue(0);

        const result = await equipmentService.findAll({ ids: [] });

        expect(result.data).toEqual([]);
        expect(result.meta.totalPages).toBe(0);
        expect(Number.isFinite(result.meta.totalPages)).toBe(true);
      });

      it('composes with search', async () => {
        prisma.equipment.findMany.mockResolvedValue([sampleEquipment]);
        prisma.equipment.count.mockResolvedValue(1);

        await equipmentService.findAll({ ids: [sampleEquipment.id], search: 'projector' });

        expect(prisma.equipment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              id: { in: [sampleEquipment.id] },
              OR: [
                { name: { contains: 'projector', mode: 'insensitive' } },
                { description: { contains: 'projector', mode: 'insensitive' } },
              ],
            },
          }),
        );
      });
    });

    describe('availability window', () => {
      const otherEquipment = { ...sampleEquipment, id: '22222222-2222-2222-2222-222222222222' };

      it('annotates available: true for equipment with no overlapping active reservation', async () => {
        prisma.equipment.findMany.mockResolvedValue([sampleEquipment]);
        prisma.equipment.count.mockResolvedValue(1);
        prisma.reservation.findMany.mockResolvedValue([]);

        const result = await equipmentService.findAll({
          startTime: '2027-01-01T10:00:00.000Z',
          endTime: '2027-01-01T12:00:00.000Z',
        });

        expect(prisma.reservation.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ equipmentId: { in: [sampleEquipment.id] } }),
          }),
        );
        expect(result.data[0].available).toBe(true);
      });

      it('annotates available: false for equipment with an overlapping active reservation', async () => {
        prisma.equipment.findMany.mockResolvedValue([sampleEquipment, otherEquipment]);
        prisma.equipment.count.mockResolvedValue(2);
        prisma.reservation.findMany.mockResolvedValue([{ equipmentId: sampleEquipment.id }]);

        const result = await equipmentService.findAll({
          startTime: '2027-01-01T10:00:00.000Z',
          endTime: '2027-01-01T12:00:00.000Z',
        });

        expect(result.data.find((item) => item.id === sampleEquipment.id)?.available).toBe(false);
        expect(result.data.find((item) => item.id === otherEquipment.id)?.available).toBe(true);
      });

      it('does not query reservations when the page has no equipment', async () => {
        prisma.equipment.findMany.mockResolvedValue([]);
        prisma.equipment.count.mockResolvedValue(0);

        const result = await equipmentService.findAll({
          startTime: '2027-01-01T10:00:00.000Z',
          endTime: '2027-01-01T12:00:00.000Z',
        });

        expect(prisma.reservation.findMany).not.toHaveBeenCalled();
        expect(result.data).toEqual([]);
      });

      it('rejects startTime without endTime with 400', async () => {
        prisma.equipment.findMany.mockResolvedValue([sampleEquipment]);
        prisma.equipment.count.mockResolvedValue(1);

        await expect(
          equipmentService.findAll({ startTime: '2027-01-01T10:00:00.000Z' }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.reservation.findMany).not.toHaveBeenCalled();
      });

      it('rejects endTime without startTime with 400', async () => {
        prisma.equipment.findMany.mockResolvedValue([sampleEquipment]);
        prisma.equipment.count.mockResolvedValue(1);

        await expect(
          equipmentService.findAll({ endTime: '2027-01-01T12:00:00.000Z' }),
        ).rejects.toBeInstanceOf(BadRequestException);
      });

      it('rejects a startTime that is not before endTime with 400', async () => {
        prisma.equipment.findMany.mockResolvedValue([sampleEquipment]);
        prisma.equipment.count.mockResolvedValue(1);

        await expect(
          equipmentService.findAll({
            startTime: '2027-01-01T12:00:00.000Z',
            endTime: '2027-01-01T10:00:00.000Z',
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.reservation.findMany).not.toHaveBeenCalled();
      });

      it('search and availability compose together', async () => {
        prisma.equipment.findMany.mockResolvedValue([sampleEquipment]);
        prisma.equipment.count.mockResolvedValue(1);
        prisma.reservation.findMany.mockResolvedValue([]);

        await equipmentService.findAll({
          search: 'projector',
          startTime: '2027-01-01T10:00:00.000Z',
          endTime: '2027-01-01T12:00:00.000Z',
        });

        expect(prisma.equipment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: [
                { name: { contains: 'projector', mode: 'insensitive' } },
                { description: { contains: 'projector', mode: 'insensitive' } },
              ],
            }),
          }),
        );
      });
    });
  });

  describe('findOne', () => {
    it('returns the equipment when found', async () => {
      prisma.equipment.findUnique.mockResolvedValue(sampleEquipment);

      const result = await equipmentService.findOne(sampleEquipment.id);

      expect(result).toEqual(sampleEquipment);
    });

    it('throws NotFoundException when the equipment does not exist', async () => {
      prisma.equipment.findUnique.mockResolvedValue(null);

      await expect(equipmentService.findOne('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates only the supplied fields', async () => {
      prisma.equipment.update.mockResolvedValue({ ...sampleEquipment, name: 'Updated' });

      const result = await equipmentService.update(sampleEquipment.id, { name: 'Updated' });

      expect(prisma.equipment.update).toHaveBeenCalledWith({
        where: { id: sampleEquipment.id },
        data: { name: 'Updated', description: undefined, requiresApproval: undefined },
      });
      expect(result.name).toBe('Updated');
    });

    it('throws NotFoundException when Prisma reports the record is missing (P2025)', async () => {
      prisma.equipment.update.mockRejectedValue(prismaKnownError('P2025'));

      await expect(
        equipmentService.update('missing-id', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('re-throws unrelated errors unchanged', async () => {
      const unrelated = new Error('unexpected failure');
      prisma.equipment.update.mockRejectedValue(unrelated);

      await expect(
        equipmentService.update(sampleEquipment.id, { name: 'X' }),
      ).rejects.toBe(unrelated);
    });
  });

  describe('remove', () => {
    it('deletes the equipment', async () => {
      prisma.equipment.delete.mockResolvedValue(sampleEquipment);

      await expect(equipmentService.remove(sampleEquipment.id)).resolves.toBeUndefined();
      expect(prisma.equipment.delete).toHaveBeenCalledWith({ where: { id: sampleEquipment.id } });
    });

    it('throws NotFoundException when the record does not exist (P2025)', async () => {
      prisma.equipment.delete.mockRejectedValue(prismaKnownError('P2025'));

      await expect(equipmentService.remove('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('translates a foreign-key conflict (P2003) into ConflictException, not a raw DB error', async () => {
      prisma.equipment.delete.mockRejectedValue(prismaKnownError('P2003'));

      await expect(equipmentService.remove(sampleEquipment.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
