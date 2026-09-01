/**
 * Mirrors the backend's Role enum (backend/prisma/schema.prisma) and the
 * "safe user" shape returned by every /auth/* endpoint
 * (backend/src/auth/types.ts, SafeUser) — id, name, email, role, createdAt,
 * and never a password/passwordHash field.
 */
export type Role = "EMPLOYEE" | "ADMIN" | "SUPERADMIN";

/**
 * Roles assignable through PATCH /users/:id/role (backend's
 * UpdateUserRoleDto / AssignableRole). SUPERADMIN is deliberately excluded —
 * there is exactly one SuperAdmin system-wide and it is never assignable
 * through the user-management role-change flow.
 */
export type AssignableRole = "EMPLOYEE" | "ADMIN";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}
