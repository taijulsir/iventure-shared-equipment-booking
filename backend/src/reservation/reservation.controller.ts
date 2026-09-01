import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role, type Reservation } from '../generated/prisma/client.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import type { PaginatedResult } from '../common/pagination.js';
import { ReservationService } from './reservation.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { ListReservationsDto } from './dto/list-reservations.dto.js';

/**
 * Every route requires authentication (JwtAuthGuard). RolesGuard is applied
 * controller-wide too, but only creation/cancellation carry
 * @Roles(Role.EMPLOYEE) and approval/rejection carry @Roles(Role.ADMIN) —
 * per docs/requirements.md and docs/decisions.md, "create reservation" and
 * "cancel own reservation" are documented Employee capabilities, while
 * "manage reservations that require administrator approval" is a documented
 * Administrator capability. Approve/reject also accept SUPERADMIN, per the
 * SUPERADMIN -> ADMIN -> EMPLOYEE role hierarchy — this does not extend to
 * create/cancel, which remain EMPLOYEE-only exactly as before; SuperAdmin
 * (like Admin) is still not able to create or cancel reservations. GET
 * routes carry no @Roles(...): every role may read, and ReservationService
 * enforces the ownership boundary within them (see reservation.service.ts)
 * — RBAC and ownership are kept separate, as documented. Approve/reject have
 * no ownership check at all (see reservation.service.ts) since they are
 * administrator-management actions, not ownership-bounded ones.
 *
 * GET / is paginated and optionally filtered by status/equipmentId (see
 * ListReservationsDto) — an Employee's filters still only ever search
 * within their own reservations, since the ownership scope is applied
 * first and these filters narrow it further, never widen it.
 */
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @Roles(Role.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateReservationDto,
  ): Promise<Reservation> {
    return this.reservationService.create(req.user, dto);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListReservationsDto,
  ): Promise<PaginatedResult<Reservation>> {
    return this.reservationService.findAllForUser(req.user, query);
  }

  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Reservation> {
    return this.reservationService.findOne(req.user, id);
  }

  @Patch(':id/cancel')
  @Roles(Role.EMPLOYEE)
  cancel(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Reservation> {
    return this.reservationService.cancel(req.user, id);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  approve(@Param('id', ParseUUIDPipe) id: string): Promise<Reservation> {
    return this.reservationService.approve(id);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  reject(@Param('id', ParseUUIDPipe) id: string): Promise<Reservation> {
    return this.reservationService.reject(id);
  }
}
