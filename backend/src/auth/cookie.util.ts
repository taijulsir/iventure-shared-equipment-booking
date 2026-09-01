import type { CookieOptions } from 'express';
import type { ConfigService } from '@nestjs/config';

export const AUTH_COOKIE_NAME = 'auth_token';

/**
 * Cookie configuration shared by login (set) and logout (clear) so the two
 * can never drift apart — a mismatched `path`/`sameSite` between setting and
 * clearing a cookie is a classic way for logout to silently fail.
 *
 * SameSite/CORS/CSRF posture (docs/decisions.md, "CSRF Mitigation"):
 * - `secure` is forced on in production (also required by browsers for
 *   `SameSite=None`) and left off in development so the cookie still works
 *   over plain http://localhost.
 * - `sameSite` defaults to `lax`, which is sufficient CSRF protection as
 *   long as the frontend and backend are deployed same-site (including two
 *   ports on localhost, which browsers treat as same-site). It is NOT
 *   sufficient on its own if the deployed frontend and backend end up on
 *   genuinely different sites (e.g. two different top-level domains) — that
 *   topology requires `COOKIE_SAME_SITE=none` plus an explicit CSRF token
 *   mechanism, which is intentionally not built in this phase (see the
 *   implementation report's "Known Issues" section).
 */
export function getAuthCookieOptions(configService: ConfigService): CookieOptions {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const sameSite = (configService.get<string>('COOKIE_SAME_SITE') ?? 'lax') as
    | 'lax'
    | 'strict'
    | 'none';

  return {
    httpOnly: true,
    secure: isProduction || sameSite === 'none',
    sameSite,
    path: '/',
  };
}
