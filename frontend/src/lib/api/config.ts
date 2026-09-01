/**
 * The backend's base URL. `NEXT_PUBLIC_` is required because this is read
 * both from the browser (client components call the backend directly, with
 * `credentials: 'include'`, for the HttpOnly auth cookie) and from the
 * Next.js server (Server Components forwarding the incoming request's
 * cookies — see server-session.ts). Not a secret either way: it ends up in
 * the client bundle regardless of where it's read from.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
