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
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role, type Reservation } from '../generated/prisma/client.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { ReservationService } from './reservation.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';

/**
 * Every route requires authentication (JwtAuthGuard). RolesGuard is applied
 * controller-wide too, but only creation and cancellation carry
 * @Roles(Role.EMPLOYEE) — per docs/requirements.md and docs/decisions.md,
 * "create reservation" and "cancel own reservation" are documented Employee
 * capabilities, and Administrator's documented scope (view all
 * reservations, manage approval-required reservations) does not include
 * either. GET routes carry no @Roles(...): both roles may read, and
 * ReservationService enforces the ownership boundary within them
 * (see reservation.service.ts) — RBAC and ownership are kept separate, as
 * documented.
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
  findAll(@Req() req: AuthenticatedRequest): Promise<Reservation[]> {
    return this.reservationService.findAllForUser(req.user);
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
}
