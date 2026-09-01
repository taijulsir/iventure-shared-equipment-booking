import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../generated/prisma/enums.js';
import { HashingService } from './hashing.service.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { JwtPayload, SafeUser } from './types.js';

// A precomputed bcrypt hash of an unguessable, unused value. Used to keep the
// login timing profile similar whether or not the email exists, so the
// response time itself doesn't confirm account existence.
const DUMMY_PASSWORD_HASH =
  '$2b$10$CwTycUXWue0Thq9StjUM0uJ8Q5S3nUqL6C0Zz8YQ3Ke.QhV7Bftm2';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
  ) {}

  /** Lowercases + trims so "A@B.com" and "a@b.com " can't register twice. */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toSafeUser(user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * Creates an Employee account. Every public registration is forced to
   * EMPLOYEE — RegisterDto has no `role` field, so there is nothing for a
   * caller to escalate even before this explicit assignment.
   *
   * Registration does not automatically log the user in (see the
   * implementation report, "Registration does not auto-login" for why) — it
   * returns the created account and the caller makes a separate POST
   * /auth/login call.
   */
  async register(dto: RegisterDto): Promise<SafeUser> {
    const email = this.normalizeEmail(dto.email);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      this.logger.warn(`Registration rejected: email ${email} is already registered`);
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.hashingService.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        passwordHash,
        role: Role.EMPLOYEE,
      },
    });

    this.logger.log(`Employee registered successfully: ${user.email} (${user.id})`);
    return this.toSafeUser(user);
  }

  /**
   * Verifies credentials and issues a JWT. Every failure path — unknown
   * email or wrong password — throws the same generic error so a caller
   * can't use the response to enumerate which accounts exist.
   */
  async login(dto: LoginDto): Promise<{ user: SafeUser; token: string }> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    const passwordMatches = await this.hashingService.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      this.logger.warn(`Failed login attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // secret + expiresIn come from JwtModule's own configuration (see
    // AuthModule), so signing and verifying always agree on both.
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    this.logger.log(`User logged in: ${user.email} (${user.id}, role: ${user.role})`);
    return { user: this.toSafeUser(user), token };
  }

  /** Backs GET /auth/me — re-reads the user so a stale-but-valid JWT still
   * reflects the current name/role rather than only what was true at login. */
  async getSafeUserById(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    return this.toSafeUser(user);
  }
}
