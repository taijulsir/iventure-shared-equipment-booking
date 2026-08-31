import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../generated/prisma/enums.js';

export const ROLES_KEY = 'roles';

/**
 * Declares which roles may access a route, read by RolesGuard.
 *
 * Reuses the same `Role` enum Prisma generates from the schema (also used in
 * the JWT payload and everywhere else a role is checked), so there is one
 * source of truth for role strings rather than role literals scattered
 * across decorators, guards, and DTOs.
 *
 * A route with no `@Roles(...)` is left unrestricted by RolesGuard — it
 * still requires authentication if JwtAuthGuard is applied, it just isn't
 * limited to specific roles.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
