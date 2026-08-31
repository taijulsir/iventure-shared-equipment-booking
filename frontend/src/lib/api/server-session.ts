// Server Components only — imports `next/headers`, which is itself only
// usable in a server context, so this module cannot be pulled into a
// 'use client' bundle without Next.js already erroring at build time. Not
// adding the separate `server-only` package for this alone: it would be a
// redundant guard on top of a boundary Next.js already enforces natively.
import { cookies } from "next/headers";
import { getCurrentUser } from "./auth";
import type { SafeUser } from "@/types/user";

/**
 * Resolves the current user from the incoming request's cookies, for use in
 * Server Components (route layouts/pages) — never in client components.
 *
 * This is the actual authorization boundary for page access: it calls the
 * real backend's GET /auth/me with the forwarded Cookie header, so a page
 * is only ever considered "authenticated" here because the backend itself
 * verified the JWT. There is no separate/parallel auth mechanism — this is
 * a thin adapter around the same cookie-based session the backend already
 * implements (docs/decisions.md).
 *
 * Returns null for "not authenticated" rather than throwing, since that is
 * an expected, common outcome for every public/auth page render, not an
 * exceptional one.
 */
export async function getServerSession(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  if (!cookieHeader) {
    return null;
  }

  try {
    return await getCurrentUser(cookieHeader);
  } catch {
    return null;
  }
}

/** Same as above, but also returns the raw Cookie header for reuse in the
 * same request (e.g. a page that both confirms auth and lists reservations
 * shouldn't need to re-derive it). */
export async function getRequestCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.toString();
}
