import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { AuthenticatedRequest } from '../types.js';
import type { Role } from '../../generated/prisma/enums.js';

/**
 * Pure authorization: decides whether an already-authenticated user's role
 * is allowed on this route. It does not verify tokens or establish identity
 * — that's JwtAuthGuard's job, applied before this guard in the pipeline
 * (Request -> JwtAuthGuard -> RolesGuard -> handler).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles(...) on this route -> RolesGuard imposes no restriction.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // RolesGuard expects JwtAuthGuard to have already populated req.user.
    // A missing user here means authentication didn't happen for this
    // route at all — that's an authentication problem (401), not a role
    // mismatch (403).
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
