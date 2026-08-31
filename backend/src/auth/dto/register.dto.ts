import { IsEmail, IsString, Length } from 'class-validator';

/**
 * Registration only accepts the fields a public sign-up should ever provide.
 * There is deliberately no `role` field: every public registration creates an
 * EMPLOYEE account (see AuthService.register and docs/decisions.md,
 * "Administrator Account Provisioning"). Combined with the global
 * ValidationPipe's `forbidNonWhitelisted`, a client-supplied `role` field is
 * rejected outright rather than silently ignored.
 */
export class RegisterDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsEmail()
  @Length(1, 254)
  email!: string;

  // 8 char minimum is a reasonable baseline for this assessment's scope.
  // 72 char cap matches bcrypt's own input limit (it silently ignores bytes
  // beyond 72), so we reject rather than silently truncate.
  @IsString()
  @Length(8, 72)
  password!: string;
}
