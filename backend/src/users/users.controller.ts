import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/client.js';
import type { AuthenticatedRequest, SafeUser } from '../auth/types.js';
import { UsersService } from './users.service.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';

/**
 * Every route on this controller is SUPERADMIN-only — applied once at the
 * class level (rather than per-method, as EquipmentController/
 * ReservationController do) because, unlike those controllers, there is no
 * read/write split here: even listing/viewing users is an administrative
 * capability, not something every authenticated user should reach. Backend
 * authorization is enforced here regardless of what the frontend shows or
 * hides — see the SuperAdmin implementation report.
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<SafeUser[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SafeUser> {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  updateRole(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<SafeUser> {
    return this.usersService.updateRole(req.user, id, dto);
  }
}
