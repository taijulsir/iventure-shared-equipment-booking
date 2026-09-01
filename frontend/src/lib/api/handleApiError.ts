import { ApiError } from "./core";

/**
 * Shared client-side error handling for mutation calls. A 401 means the
 * session has expired or is otherwise invalid — every mutating form/action
 * in the app calls `onUnauthorized` in that case (callers pass
 * `() => router.push("/login")`) rather than showing a raw "Authentication
 * required" message the user has no way to act on. Every other error
 * (400/403/404/409/network) is returned as a message string for the
 * caller to display using this app's existing Alert-based error pattern.
 */
export function resolveApiErrorMessage(error: unknown, onUnauthorized: () => void): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      onUnauthorized();
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
