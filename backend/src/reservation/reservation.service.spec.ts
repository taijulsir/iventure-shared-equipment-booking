import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationService } from './reservation.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { OwnershipService } from '../auth/ownership.service.js';
import { Prisma, Role, ReservationStatus } from '../generated/prisma/client.js';
import type { JwtPayload } from '../auth/types.js';

const employee: JwtPayload = { sub: 'employee-1', role: Role.EMPLOYEE };
const otherEmployee: JwtPayload = { sub: 'employee-2', role: Role.EMPLOYEE };
const admin: JwtPayload = { sub: 'admin-1', role: Role.ADMIN };

const equipmentNoApproval = {
  id: 'equipment-1',
  name: 'Laptop',
  description: null,
  requiresApproval: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const equipmentRequiresApproval = { ...equipmentNoApproval, id: 'equipment-2', requiresApproval: true };

function sampleReservation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'reservation-1',
    userId: employee.sub,
    equipmentId: equipmentNoApproval.id,
    startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    status: ReservationStatus.CONFIRMED,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function exclusionViolationError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('conflicting key value violates exclusion constraint', {
    code: 'P2039',
    clientVersion: 'test',
    meta: { driverAdapterError: { cause: { code: '23P01' } } },
  });
}

function recordNotFoundError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('record not found', {
    code: 'P2025',
    clientVersion: 'test',
  });
}

describe('ReservationService', () => {
  let reservationService: ReservationService;
  let prisma: {
    equipment: { findUnique: ReturnType<typeof vi.fn> };
    reservation: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      equipment: { findUnique: vi.fn() },
      reservation: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        OwnershipService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    reservationService = module.get(ReservationService);
  });

  describe('create', () => {
    it('creates a CONFIRMED reservation when the equipment does not require approval', async () => {
      prisma.equipment.findUnique.mockResolvedValue(equipmentNoApproval);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockResolvedValue(sampleReservation());

      const result = await reservationService.create(employee, {
        equipmentId: equipmentNoApproval.id,
        startTime: '2027-01-01T10:00:00.000Z',
        endTime: '2027-01-01T12:00:00.000Z',
      });

      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: employee.sub,
          status: ReservationStatus.CONFIRMED,
        }),
      });
      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('creates a PENDING reservation when the equipment requires approval', async () => {
      prisma.equipment.findUnique.mockResolvedValue(equipmentRequiresApproval);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockResolvedValue(
        sampleReservation({ status: ReservationStatus.PENDING, equipmentId: equipmentRequiresApproval.id }),
      );

      const result = await reservationService.create(employee, {
        equipmentId: equipmentRequiresApproval.id,
        startTime: '2027-01-01T10:00:00.000Z',
        endTime: '2027-01-01T12:00:00.000Z',
      });

      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: ReservationStatus.PENDING }),
      });
      expect(result.status).toBe(ReservationStatus.PENDING);
    });

    it('always uses the authenticated user id, never a client-controlled one', async () => {
      prisma.equipment.findUnique.mockResolvedValue(equipmentNoApproval);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockResolvedValue(sampleReservation());

      await reservationService.create(employee, {
        equipmentId: equipmentNoApproval.id,
        startTime: '2027-01-01T10:00:00.000Z',
        endTime: '2027-01-01T12:00:00.000Z',
      });

      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: employee.sub }),
      });
    });

    it('throws NotFoundException when the equipment does not exist', async () => {
      prisma.equipment.findUnique.mockResolvedValue(null);

      await expect(
        reservationService.create(employee, {
          equipmentId: 'missing-equipment',
          startTime: '2027-01-01T10:00:00.000Z',
          endTime: '2027-01-01T12:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('rejects a start time that is not before the end time', async () => {
      prisma.equipment.findUnique.mockResolvedValue(equipmentNoApproval);

      await expect(
        reservationService.create(employee, {
          equipmentId: equipmentNoApproval.id,
          startTime: '2027-01-01T12:00:00.000Z',
          endTime: '2027-01-01T10:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.reservation.findFirst).not.toHaveBeenCalled();
      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('rejects equal start and end times', async () => {
      prisma.equipment.findUnique.mockResolvedValue(equipmentNoApproval);

      await expect(
        reservationService.create(employee, {
          equipmentId: equipmentNoApproval.id,
          startTime: '2027-01-01T10:00:00.000Z',
          endTime: '2027-01-01T10:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an overlapping reservation found by the application-level pre-check', async () => {
      prisma.equipment.findUnique.mockResolvedValue(equipmentNoApproval);
      prisma.reservation.findFirst.mockResolvedValue(sampleReservation());

      await expect(
        reservationService.create(employee, {
          equipmentId: equipmentNoApproval.id,
          startTime: '2027-01-01T11:00:00.000Z',
          endTime: '2027-01-01T13:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('translates a database EXCLUDE-constraint violation into a 409, not a raw DB error', async () => {
      prisma.equipment.findUnique.mockResolvedValue(equipmentNoApproval);
      prisma.reservation.findFirst.mockResolvedValue(null); // pre-check passes, race happens at insert time
      prisma.reservation.create.mockRejectedValue(exclusionViolationError());

      await expect(
        reservationService.create(employee, {
          equipmentId: equipmentNoApproval.id,
          startTime: '2027-01-01T11:00:00.000Z',
          endTime: '2027-01-01T13:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('re-throws an unrelated database error unchanged', async () => {
      prisma.equipment.findUnique.mockResolvedValue(equipmentNoApproval);
      prisma.reservation.findFirst.mockResolvedValue(null);
      const unrelated = new Error('totally unrelated failure');
      prisma.reservation.create.mockRejectedValue(unrelated);

      await expect(
        reservationService.create(employee, {
          equipmentId: equipmentNoApproval.id,
          startTime: '2027-01-01T11:00:00.000Z',
          endTime: '2027-01-01T13:00:00.000Z',
        }),
      ).rejects.toBe(unrelated);
    });

    it('checks conflicts only against PENDING/CONFIRMED reservations, so a REJECTED reservation never blocks the slot', async () => {
      prisma.equipment.findUnique.mockResolvedValue(equipmentNoApproval);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockResolvedValue(sampleReservation());

      await reservationService.create(employee, {
        equipmentId: equipmentNoApproval.id,
        startTime: '2027-01-01T10:00:00.000Z',
        endTime: '2027-01-01T12:00:00.000Z',
      });

      expect(prisma.reservation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
          }),
        }),
      );
    });
  });

  describe('findAllForUser', () => {
    it('scopes the query to the caller for an Employee', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);

      await reservationService.findAllForUser(employee);

      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: employee.sub } }),
      );
    });

    it('applies no ownership filter for an Administrator (views all reservations)', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);

      await reservationService.findAllForUser(admin);

      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('findOne', () => {
    it('allows an employee to access their own reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue(sampleReservation());

      const result = await reservationService.findOne(employee, 'reservation-1');

      expect(result.id).toBe('reservation-1');
    });

    it("rejects an employee accessing another employee's reservation with 403", async () => {
      prisma.reservation.findUnique.mockResolvedValue(sampleReservation({ userId: otherEmployee.sub }));

      await expect(reservationService.findOne(employee, 'reservation-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows an administrator to access any reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue(sampleReservation({ userId: otherEmployee.sub }));

      const result = await reservationService.findOne(admin, 'reservation-1');

      expect(result.id).toBe('reservation-1');
    });

    it('throws NotFoundException when the reservation does not exist', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(reservationService.findOne(employee, 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it("cancels the caller's own upcoming CONFIRMED reservation", async () => {
      const reservation = sampleReservation({ status: ReservationStatus.CONFIRMED });
      prisma.reservation.findUnique.mockResolvedValue(reservation);
      prisma.reservation.update.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.CANCELLED,
      });

      const result = await reservationService.cancel(employee, reservation.id);

      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: reservation.id },
        data: { status: ReservationStatus.CANCELLED },
      });
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it("cancels the caller's own upcoming PENDING reservation", async () => {
      const reservation = sampleReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(reservation);
      prisma.reservation.update.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.CANCELLED,
      });

      const result = await reservationService.cancel(employee, reservation.id);
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it("rejects cancelling another employee's reservation with 403", async () => {
      const reservation = sampleReservation({ userId: otherEmployee.sub });
      prisma.reservation.findUnique.mockResolvedValue(reservation);

      await expect(reservationService.cancel(employee, reservation.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.reservation.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the reservation does not exist', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(reservationService.cancel(employee, 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects cancelling an already-CANCELLED reservation', async () => {
      const reservation = sampleReservation({ status: ReservationStatus.CANCELLED });
      prisma.reservation.findUnique.mockResolvedValue(reservation);

      await expect(reservationService.cancel(employee, reservation.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.reservation.update).not.toHaveBeenCalled();
    });

    it('rejects cancelling a REJECTED reservation', async () => {
      const reservation = sampleReservation({ status: ReservationStatus.REJECTED });
      prisma.reservation.findUnique.mockResolvedValue(reservation);

      await expect(reservationService.cancel(employee, reservation.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects cancelling a reservation that has already started', async () => {
      const reservation = sampleReservation({
        status: ReservationStatus.CONFIRMED,
        startTime: new Date(Date.now() - 60 * 60 * 1000), // started 1 hour ago
        endTime: new Date(Date.now() + 60 * 60 * 1000),
      });
      prisma.reservation.findUnique.mockResolvedValue(reservation);

      await expect(reservationService.cancel(employee, reservation.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.reservation.update).not.toHaveBeenCalled();
    });

    it('surfaces a 404 if the reservation is deleted between the lookup and the update (P2025)', async () => {
      const reservation = sampleReservation({ status: ReservationStatus.CONFIRMED });
      prisma.reservation.findUnique.mockResolvedValue(reservation);
      prisma.reservation.update.mockRejectedValue(recordNotFoundError());

      await expect(reservationService.cancel(employee, reservation.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('approves a PENDING reservation, transitioning it to CONFIRMED', async () => {
      const reservation = sampleReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(reservation);
      prisma.reservation.update.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.CONFIRMED,
      });

      const result = await reservationService.approve(reservation.id);

      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: reservation.id },
        data: { status: ReservationStatus.CONFIRMED },
      });
      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('throws NotFoundException when the reservation does not exist', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(reservationService.approve('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.reservation.update).not.toHaveBeenCalled();
    });

    it.each([ReservationStatus.CONFIRMED, ReservationStatus.REJECTED, ReservationStatus.CANCELLED])(
      'rejects approving a reservation that is already %s',
      async (status) => {
        const reservation = sampleReservation({ status });
        prisma.reservation.findUnique.mockResolvedValue(reservation);

        await expect(reservationService.approve(reservation.id)).rejects.toBeInstanceOf(
          ConflictException,
        );
        expect(prisma.reservation.update).not.toHaveBeenCalled();
      },
    );

    it('translates a database EXCLUDE-constraint violation into a 409, not a raw DB error', async () => {
      const reservation = sampleReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(reservation);
      prisma.reservation.update.mockRejectedValue(exclusionViolationError());

      await expect(reservationService.approve(reservation.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('surfaces a 404 if the reservation is deleted between the lookup and the update (P2025)', async () => {
      const reservation = sampleReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(reservation);
      prisma.reservation.update.mockRejectedValue(recordNotFoundError());

      await expect(reservationService.approve(reservation.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('re-throws an unrelated database error unchanged', async () => {
      const reservation = sampleReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(reservation);
      const unrelated = new Error('totally unrelated failure');
      prisma.reservation.update.mockRejectedValue(unrelated);

      await expect(reservationService.approve(reservation.id)).rejects.toBe(unrelated);
    });
  });

  describe('reject', () => {
    it('rejects a PENDING reservation, transitioning it to REJECTED', async () => {
      const reservation = sampleReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(reservation);
      prisma.reservation.update.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.REJECTED,
      });

      const result = await reservationService.reject(reservation.id);

      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: reservation.id },
        data: { status: ReservationStatus.REJECTED },
      });
      expect(result.status).toBe(ReservationStatus.REJECTED);
    });

    it('throws NotFoundException when the reservation does not exist', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(reservationService.reject('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.reservation.update).not.toHaveBeenCalled();
    });

    it.each([ReservationStatus.CONFIRMED, ReservationStatus.REJECTED, ReservationStatus.CANCELLED])(
      'rejects rejecting a reservation that is already %s',
      async (status) => {
        const reservation = sampleReservation({ status });
        prisma.reservation.findUnique.mockResolvedValue(reservation);

        await expect(reservationService.reject(reservation.id)).rejects.toBeInstanceOf(
          ConflictException,
        );
        expect(prisma.reservation.update).not.toHaveBeenCalled();
      },
    );

    it('surfaces a 404 if the reservation is deleted between the lookup and the update (P2025)', async () => {
      const reservation = sampleReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(reservation);
      prisma.reservation.update.mockRejectedValue(recordNotFoundError());

      await expect(reservationService.reject(reservation.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('re-throws an unrelated database error unchanged', async () => {
      const reservation = sampleReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(reservation);
      const unrelated = new Error('totally unrelated failure');
      prisma.reservation.update.mockRejectedValue(unrelated);

      await expect(reservationService.reject(reservation.id)).rejects.toBe(unrelated);
    });
  });
});
