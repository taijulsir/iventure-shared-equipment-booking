import { IsEnum } from 'class-validator';

/**
 * Deliberately NOT the full `Role` enum: SUPERADMIN is not a value a caller
 * can ever request here. This DTO makes SUPERADMIN unreachable at the
 * validation layer itself — a request body of `{ "role": "SUPERADMIN" }`
 * fails with 400 before UsersService's own transition checks ever run,
 * rather than relying on the service alone to catch it. See
 * UsersService.updateRole for the additional transition rules (which target
 * roles are reachable FROM which current roles, self-modification, and the
 * SuperAdmin-is-never-a-target rule).
 */
export enum AssignableRole {
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN',
}

export class UpdateUserRoleDto {
  @IsEnum(AssignableRole, { message: 'role must be either EMPLOYEE or ADMIN' })
  role!: AssignableRole;
}
