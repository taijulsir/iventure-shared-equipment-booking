import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../generated/prisma/enums.js';
import type { JwtPayload, SafeUser } from '../auth/types.js';
import { AssignableRole, type UpdateUserRoleDto } from './dto/update-user-role.dto.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  /** Backs GET /users (SUPERADMIN only). Every user in the system, newest
   * first — mirrors EquipmentService's default ordering. No pagination: this
   * is an internal administrative listing, not a public catalogue, and the
   * task doesn't call for it. */
  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map((user) => this.toSafeUser(user));
  }

  /** Backs GET /users/:id (SUPERADMIN only). */
  async findOne(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toSafeUser(user);
  }

  /**
   * Backs PATCH /users/:id/role (SUPERADMIN only). Enforces every rule from
   * the role-hierarchy spec beyond what UpdateUserRoleDto's own enum already
   * rules out (a SUPERADMIN target value can never even reach this method):
   *
   *  - A SuperAdmin cannot modify their own role (self-demotion/self-lockout
   *    protection), regardless of what the request body asks for.
   *  - The target user's CURRENT role may never be SUPERADMIN — there is
   *    exactly one SuperAdmin system-wide, and this endpoint can never
   *    change or remove it. (Combined with the DTO restriction, this also
   *    means SUPERADMIN never appears as either side of a change made
   *    through this endpoint.)
   *  - The only valid transitions are EMPLOYEE -> ADMIN and ADMIN ->
   *    EMPLOYEE. Requesting the role the user already has is rejected as a
   *    no-op rather than silently "succeeding" — it is not a transition.
   */
  async updateRole(
    actingUser: JwtPayload,
    targetUserId: string,
    dto: UpdateUserRoleDto,
  ): Promise<SafeUser> {
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.id === actingUser.sub) {
      this.logger.warn(`SuperAdmin ${actingUser.sub} attempted self-demotion/role modification`);
      throw new ForbiddenException('You cannot change your own role');
    }

    if (targetUser.role === Role.SUPERADMIN) {
      this.logger.warn(
        `Attempted role modification on SuperAdmin account (${targetUser.email}) by ${actingUser.sub}`,
      );
      throw new ForbiddenException("The SuperAdmin's role cannot be changed through this endpoint");
    }

    const isValidTransition =
      (targetUser.role === Role.EMPLOYEE && dto.role === AssignableRole.ADMIN) ||
      (targetUser.role === Role.ADMIN && dto.role === AssignableRole.EMPLOYEE);

    if (!isValidTransition) {
      throw new ConflictException(
        `User already has the role "${targetUser.role}"; the only supported role changes are ` +
          'EMPLOYEE -> ADMIN and ADMIN -> EMPLOYEE',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
    });

    this.logger.log(
      `Role updated: user ${targetUser.email} (${targetUserId}) changed from ${targetUser.role} to ${dto.role} by SuperAdmin (${actingUser.sub})`,
    );

    return this.toSafeUser(updated);
  }
}
