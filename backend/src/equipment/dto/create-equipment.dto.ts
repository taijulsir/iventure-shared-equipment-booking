import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

/**
 * No `id`, `createdAt`, or `updatedAt` field exists here on purpose — those
 * remain fully database-managed. Combined with the app's global
 * `forbidNonWhitelisted` ValidationPipe, a client that supplies any of them
 * anyway gets a 400, not a silently ignored field.
 */
export class CreateEquipmentDto {
  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  // Optional, defaulting to false in the service — matches the schema's own
  // `@default(false)` — but if supplied it must be an actual boolean.
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}
