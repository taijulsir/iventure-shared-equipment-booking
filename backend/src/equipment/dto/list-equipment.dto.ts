import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

/**
 * Query params for GET /equipment. Defaults (page 1, limit 20) are applied
 * in EquipmentService, not here, so the "what happens when a field is
 * absent" logic lives in one place rather than split between a class field
 * initializer and the service.
 *
 * `startTime`/`endTime` are optional and, like CreateReservationDto, kept as
 * ISO 8601 strings here rather than `Date` (the ValidationPipe's
 * `transform: true` would otherwise convert the value before `@IsISO8601()`
 * can validate the original string) and parsed in the service. Providing
 * only one of the pair, or an invalid range, is a service-level 400 (see
 * EquipmentService.findAll) — mirroring how CreateReservationDto validates
 * format here and ReservationService.create validates the range.
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

  @IsOptional()
  @IsISO8601()
  startTime?: string;

  @IsOptional()
  @IsISO8601()
  endTime?: string;

  /**
   * Fetches exactly this set of equipment by id, bypassing search/pagination
   * entirely (see EquipmentService.findAll) — for a caller that already
   * knows which specific items it needs (e.g. resolving equipment names for
   * a page of reservations) rather than browsing the catalogue. Capped at
   * 100 for the same reason `limit` is. Sent as repeated `ids=` query
   * params (`?ids=a&ids=b`); the Transform normalizes the single-value case
   * (a lone `?ids=a` otherwise arrives as a bare string, not an array).
   */
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  ids?: string[];
}
