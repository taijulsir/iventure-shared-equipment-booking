import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

/**
 * Every field is optional (a PATCH may touch just one of them), but whatever
 * is supplied is still fully validated — `@IsOptional()` only skips
 * validation when the property is absent entirely, not when it's present
 * but empty/invalid (e.g. an explicit blank `name` is still rejected).
 *
 * Deliberately hand-written rather than `PartialType(CreateEquipmentDto)`
 * from `@nestjs/mapped-types` — three fields don't justify a new dependency.
 *
 * No `id`/`createdAt`/`updatedAt` here either, for the same reason as
 * CreateEquipmentDto.
 */
export class UpdateEquipmentDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}
