import { apiRequest } from "./core";
import type { AssignableRole, SafeUser } from "@/types/user";

/**
 * All three routes below are SUPERADMIN-only on the backend
 * (backend/src/users/users.controller.ts) — this client makes no attempt to
 * duplicate that check. It exists purely so the User Management UI has
 * something to call; if a non-SuperAdmin ever reaches this code path, the
 * backend still rejects it with 403.
 */

/** GET /users */
export function listUsers(cookieHeader?: string): Promise<SafeUser[]> {
  return apiRequest<SafeUser[]>("/users", { cookieHeader });
}

/** GET /users/:id */
export function getUser(id: string, cookieHeader?: string): Promise<SafeUser> {
  return apiRequest<SafeUser>(`/users/${id}`, { cookieHeader });
}

/**
 * PATCH /users/:id/role — the only two valid transitions are
 * EMPLOYEE -> ADMIN and ADMIN -> EMPLOYEE; everything else (including any
 * attempt to target/assign SUPERADMIN) is rejected by the backend. This
 * function does not pre-validate that here — it surfaces whatever the
 * backend decides via the thrown ApiError, so validation logic lives in
 * exactly one place.
 */
export function updateUserRole(id: string, role: AssignableRole): Promise<SafeUser> {
  return apiRequest<SafeUser>(`/users/${id}/role`, { method: "PATCH", body: { role } });
}
