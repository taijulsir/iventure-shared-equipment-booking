import { API_BASE_URL } from "./config";
import type { ApiErrorBody } from "@/types/api";

/**
 * Thrown for every non-2xx response and for network failures, so callers
 * only ever have to catch one error type. `status` is 0 for a network
 * failure (fetch threw before a response existed) — real HTTP responses
 * never use status 0, so this is a safe way to distinguish "couldn't reach
 * the server" from "the server responded with an error".
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, fallbackMessage: string) {
    super(extractMessage(body) ?? fallbackMessage);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function extractMessage(body: ApiErrorBody | null): string | null {
  if (!body) return null;
  if (Array.isArray(body.message)) return body.message.join(", ");
  if (typeof body.message === "string") return body.message;
  return null;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /**
   * Only needed when calling from a Server Component: the incoming
   * request's `Cookie` header, forwarded verbatim so the backend sees the
   * same HttpOnly auth_token cookie the browser sent to the Next.js server.
   * Client components never need this — the browser attaches the cookie
   * itself via `credentials: 'include'` below.
   */
  cookieHeader?: string;
  signal?: AbortSignal;
}

/**
 * The single place every API call in this app goes through. Centralizes
 * the base URL, JSON encoding/decoding, credentials handling, and error
 * translation into `ApiError` so no page/component duplicates fetch
 * boilerplate or reimplements error parsing.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, cookieHeader, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Required for the browser to send/receive the HttpOnly auth_token
      // cookie cross-origin (docs/architecture.md, "Cross-Origin and Cookie
      // Configuration"). Harmless (a no-op) on the server, where cookie
      // forwarding instead happens explicitly via `cookieHeader` above.
      credentials: "include",
      // Session-dependent responses must never be cached — see the
      // Next.js 16 caching notes consulted for this phase (fetch is
      // uncached by default here since Cache Components isn't enabled,
      // but this is set explicitly so intent doesn't depend on that
      // default staying unchanged).
      cache: "no-store",
      signal,
    });
  } catch {
    throw new ApiError(
      0,
      null,
      "Unable to reach the server. Check your connection and try again.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const parsedBody = await parseJsonSafe(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      parsedBody as ApiErrorBody | null,
      "Something went wrong. Please try again.",
    );
  }

  return parsedBody as T;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
