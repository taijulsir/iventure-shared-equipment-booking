import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ReservationStatus } from '../../generated/prisma/enums.js';

/**
 * Query params for GET /reservations. Mirrors ListEquipmentDto's
 * conventions (page/limit defaults applied in the service, not here).
 *
 * `status` and `equipmentId` narrow the result set but never widen it
 * beyond what the caller's role already scopes them to — an Employee
 * filtering by another user's reservation is still only ever searching
 * within their own rows, since the ownership `where` clause is applied
 * first in ReservationService and these filters are ANDed on top of it.
 */
export class ListReservationsDto {
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  // Capped at 100 so a client can't request a pathologically large page.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
