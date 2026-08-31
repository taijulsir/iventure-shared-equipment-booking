import { apiRequest } from "./core";
import type { SafeUser } from "@/types/user";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/** POST /auth/login — sets the auth_token HttpOnly cookie on success. */
export function login(input: LoginInput): Promise<SafeUser> {
  return apiRequest<SafeUser>("/auth/login", { method: "POST", body: input });
}

/**
 * POST /auth/register — creates an EMPLOYEE account. Does not authenticate
 * the caller (no cookie is set) — the backend deliberately does not
 * auto-login on registration (see backend/src/auth/auth.service.ts). The
 * caller must log in separately afterward.
 */
export function register(input: RegisterInput): Promise<SafeUser> {
  return apiRequest<SafeUser>("/auth/register", { method: "POST", body: input });
}

/** POST /auth/logout — clears the auth cookie client-side. */
export function logout(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/auth/logout", { method: "POST" });
}

/**
 * GET /auth/me — resolves with the current user, or throws ApiError(401) if
 * unauthenticated. Pass `cookieHeader` when calling from a Server Component
 * (see lib/api/server-session.ts); omit it from client components, where
 * the browser attaches the cookie automatically.
 */
export function getCurrentUser(cookieHeader?: string): Promise<SafeUser> {
  return apiRequest<SafeUser>("/auth/me", { cookieHeader });
}
