import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { HashingService } from './hashing.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../generated/prisma/enums.js';

const existingUser = {
  id: 'user-1',
  name: 'Existing User',
  email: 'existing@example.com',
  passwordHash: 'stored-hash',
  role: Role.EMPLOYEE,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: { user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> } };
  let hashingService: { hash: ReturnType<typeof vi.fn>; compare: ReturnType<typeof vi.fn> };
  let jwtService: { signAsync: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prisma = { user: { findUnique: vi.fn(), create: vi.fn() } };
    hashingService = { hash: vi.fn(), compare: vi.fn() };
    jwtService = { signAsync: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: HashingService, useValue: hashingService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('creates an EMPLOYEE account and never returns the password hash', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      hashingService.hash.mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        id: 'user-2',
        name: 'New User',
        email: 'new@example.com',
        passwordHash: 'hashed-password',
        role: Role.EMPLOYEE,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      const result = await authService.register({
        name: 'New User',
        email: 'New@Example.com',
        password: 'plaintext-password',
      });

      // role is forced server-side regardless of what the DTO could contain
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: Role.EMPLOYEE }),
      });
      // email is normalized before hitting the database
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ email: 'new@example.com' }),
      });
      // the plaintext password is never persisted directly
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ passwordHash: 'hashed-password' }),
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.role).toBe(Role.EMPLOYEE);
    });

    it('rejects a duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        authService.register({
          name: 'Someone',
          email: existingUser.email,
          password: 'plaintext-password',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('normalizes email casing so duplicates are caught regardless of case', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        authService.register({
          name: 'Someone',
          email: 'EXISTING@EXAMPLE.COM',
          password: 'plaintext-password',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'existing@example.com' },
      });
    });
  });

  describe('login', () => {
    it('returns a safe user and a token for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);
      hashingService.compare.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('signed.jwt.token');

      const result = await authService.login({
        email: existingUser.email,
        password: 'correct-password',
      });

      expect(result.token).toBe('signed.jwt.token');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: existingUser.id,
        role: existingUser.role,
      });
    });

    it('rejects an unknown email with a generic error', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      hashingService.compare.mockResolvedValue(false);

      await expect(
        authService.login({ email: 'nobody@example.com', password: 'whatever' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      // still performs a hash comparison against a dummy hash, so the
      // response timing doesn't reveal whether the account exists
      expect(hashingService.compare).toHaveBeenCalled();
    });

    it('rejects a wrong password with the same generic error', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);
      hashingService.compare.mockResolvedValue(false);

      await expect(
        authService.login({ email: existingUser.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('getSafeUserById', () => {
    it('returns a safe user without the password hash', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);

      const result = await authService.getSafeUserById(existingUser.id);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(existingUser.id);
    });

    it('throws when the user no longer exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getSafeUserById('missing-id')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
