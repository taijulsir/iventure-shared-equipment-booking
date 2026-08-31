import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

/**
 * Query params for GET /equipment. Defaults (page 1, limit 20) are applied
 * in EquipmentService, not here, so the "what happens when a field is
 * absent" logic lives in one place rather than split between a class field
 * initializer and the service.
 */
export class ListEquipmentDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  search?: string;

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
