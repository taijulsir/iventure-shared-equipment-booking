import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../generated/prisma/enums.js';
import { AssignableRole } from './dto/update-user-role.dto.js';

const employeeUser = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Employee One',
  email: 'employee@example.com',
  passwordHash: 'hashed',
  role: Role.EMPLOYEE,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const adminUser = {
  ...employeeUser,
  id: '22222222-2222-2222-2222-222222222222',
  email: 'admin@example.com',
  role: Role.ADMIN,
};

const superAdminUser = {
  ...employeeUser,
  id: '33333333-3333-3333-3333-333333333333',
  email: 'superadmin@example.com',
  role: Role.SUPERADMIN,
};

describe('UsersService', () => {
  let usersService: UsersService;
  let prisma: {
    user: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    usersService = module.get(UsersService);
  });

  describe('findAll', () => {
    it('returns every user mapped to the safe (no passwordHash) shape', async () => {
      prisma.user.findMany.mockResolvedValue([employeeUser, adminUser, superAdminUser]);

      const result = await usersService.findAll();

      expect(prisma.user.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
      expect(result).toEqual([
        {
          id: employeeUser.id,
          name: employeeUser.name,
          email: employeeUser.email,
          role: employeeUser.role,
          createdAt: employeeUser.createdAt,
        },
        {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          createdAt: adminUser.createdAt,
        },
        {
          id: superAdminUser.id,
          name: superAdminUser.name,
          email: superAdminUser.email,
          role: superAdminUser.role,
          createdAt: superAdminUser.createdAt,
        },
      ]);
      result.forEach((user) => expect(user).not.toHaveProperty('passwordHash'));
    });
  });

  describe('findOne', () => {
    it('returns the user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      const result = await usersService.findOne(employeeUser.id);

      expect(result.id).toBe(employeeUser.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('promotes EMPLOYEE -> ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.user.update.mockResolvedValue({ ...employeeUser, role: Role.ADMIN });

      const result = await usersService.updateRole(
        { sub: superAdminUser.id, role: Role.SUPERADMIN },
        employeeUser.id,
        { role: AssignableRole.ADMIN },
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: employeeUser.id },
        data: { role: AssignableRole.ADMIN },
      });
      expect(result.role).toBe(Role.ADMIN);
    });

    it('demotes ADMIN -> EMPLOYEE', async () => {
      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.user.update.mockResolvedValue({ ...adminUser, role: Role.EMPLOYEE });

      const result = await usersService.updateRole(
        { sub: superAdminUser.id, role: Role.SUPERADMIN },
        adminUser.id,
        { role: AssignableRole.EMPLOYEE },
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: adminUser.id },
        data: { role: AssignableRole.EMPLOYEE },
      });
      expect(result.role).toBe(Role.EMPLOYEE);
    });

    it('throws NotFoundException for a nonexistent target user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.updateRole(
          { sub: superAdminUser.id, role: Role.SUPERADMIN },
          'missing-id',
          { role: AssignableRole.ADMIN },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects a SuperAdmin changing their own role (self-demotion protection)', async () => {
      prisma.user.findUnique.mockResolvedValue(superAdminUser);

      await expect(
        usersService.updateRole(
          { sub: superAdminUser.id, role: Role.SUPERADMIN },
          superAdminUser.id,
          { role: AssignableRole.ADMIN },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects any attempt to change the SuperAdmin (cannot remove/change the final SuperAdmin)', async () => {
      prisma.user.findUnique.mockResolvedValue(superAdminUser);

      await expect(
        usersService.updateRole(
          { sub: 'some-other-superadmin-id', role: Role.SUPERADMIN },
          superAdminUser.id,
          { role: AssignableRole.ADMIN },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects a no-op transition (target already has the requested role)', async () => {
      prisma.user.findUnique.mockResolvedValue(employeeUser);

      await expect(
        usersService.updateRole(
          { sub: superAdminUser.id, role: Role.SUPERADMIN },
          employeeUser.id,
          { role: AssignableRole.EMPLOYEE },
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
