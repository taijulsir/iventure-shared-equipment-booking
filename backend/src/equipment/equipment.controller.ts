import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role, type Equipment } from '../generated/prisma/client.js';
import { EquipmentService } from './equipment.service.js';
import { CreateEquipmentDto } from './dto/create-equipment.dto.js';
import { UpdateEquipmentDto } from './dto/update-equipment.dto.js';
import { ListEquipmentDto } from './dto/list-equipment.dto.js';
import type { PaginatedResult } from './types.js';

/**
 * Every route here requires authentication (JwtAuthGuard). RolesGuard is
 * also applied controller-wide, but only the write routes carry @Roles(...)
 * — the read routes (GET) have none, so RolesGuard imposes no extra
 * restriction on them beyond "authenticated", per the authorization matrix:
 * EMPLOYEE and ADMIN can both read; only ADMIN (and SUPERADMIN, per the
 * SUPERADMIN -> ADMIN -> EMPLOYEE role hierarchy) can create/update/delete.
 */
@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  findAll(@Query() query: ListEquipmentDto): Promise<PaginatedResult<Equipment>> {
    return this.equipmentService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Equipment> {
    return this.equipmentService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEquipmentDto): Promise<Equipment> {
    return this.equipmentService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentDto,
  ): Promise<Equipment> {
    return this.equipmentService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.equipmentService.remove(id);
  }
}
