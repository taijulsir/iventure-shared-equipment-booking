import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_COOKIE_NAME } from '../cookie.util.js';
import type { AuthenticatedRequest, JwtPayload } from '../types.js';

/**
 * Minimal authentication guard: reads the JWT from the HTTP-only cookie,
 * verifies its signature and expiration, and attaches the resulting claims
 * to the request as `request.user`.
 *
 * There is deliberately no Passport.js strategy layer here — for a single
 * cookie-based JWT check, wiring passport + passport-jwt + @nestjs/passport
 * would add a dependency chain and an indirection layer without changing
 * the behavior, so the verification lives directly in this guard instead.
 *
 * This guard only establishes identity (authentication). Role-based
 * authorization (RBAC) is intentionally out of scope for this phase — see
 * the implementation report.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[AUTH_COOKIE_NAME];

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = { sub: payload.sub, role: payload.role };
      return true;
    } catch {
      // Covers both an invalid signature and an expired token — the client
      // doesn't need to distinguish the two, it just needs to log in again.
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
