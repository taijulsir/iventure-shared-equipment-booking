import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import { OwnershipService } from '../ownership.service.js';
import { Role } from '../../generated/prisma/enums.js';
import type { AuthenticatedRequest } from '../types.js';

/**
 * TEST/SUPPORT INFRASTRUCTURE ONLY — not part of the product's API surface.
 *
 * These routes exist solely to exercise RolesGuard, @Roles, and
 * OwnershipService against real HTTP requests before any real domain module
 * (Equipment, Reservation) exists for them to protect. `:ownerId` stands in
 * for "the user id that owns some resource" — there is no backing entity.
 *
 * Delete this controller (and its registration in
 * authorization-demo.module.ts / app.module.ts) once a real
 * ownership-checked route exists, e.g. GET /reservations/:id.
 */
@Controller('_authz-demo')
@UseGuards(JwtAuthGuard)
export class AuthorizationDemoController {
  constructor(private readonly ownershipService: OwnershipService) {}

  @Get('admin-only')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  adminOnly(): { ok: true; scope: string } {
    return { ok: true, scope: 'admin-only' };
  }

  @Get('employee-only')
  @UseGuards(RolesGuard)
  @Roles(Role.EMPLOYEE)
  employeeOnly(): { ok: true; scope: string } {
    return { ok: true, scope: 'employee-only' };
  }

  // No @Roles(...) here: any authenticated user may attempt this route —
  // the ownership check below is what actually gates access, matching the
  // documented rule that an Employee may only access their own resource
  // while an Administrator's explicitly granted scope exempts them.
  @Get('own-resource/:ownerId')
  ownResource(
    @Req() req: AuthenticatedRequest,
    @Param('ownerId') ownerId: string,
  ): { ok: true; ownerId: string } {
    this.ownershipService.assertOwnsOrExempt(req.user, ownerId, [Role.ADMIN]);
    return { ok: true, ownerId };
  }
}
