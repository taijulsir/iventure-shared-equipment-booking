import type { Request } from 'express';
import type { Role } from '../generated/prisma/enums.js';

/** Minimal claims carried by the JWT — identity + role, nothing sensitive. */
export interface JwtPayload {
  sub: string;
  role: Role;
}

/** User shape safe to return from the API — never includes passwordHash. */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

/** Express request as seen after JwtAuthGuard has attached the caller. */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
