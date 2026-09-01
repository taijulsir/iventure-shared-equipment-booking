import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

interface AttemptRecord {
  timestamps: number[];
}

/**
 * Minimal in-memory IP-based rate limiter specifically protecting POST /auth/login.
 *
 * Implements a sliding-window algorithm without introducing external infrastructure
 * like Redis. Discards timestamps older than the window duration to prevent memory leaks.
 */
@Injectable()
export class LoginThrottlerGuard implements CanActivate {
  private readonly attempts = new Map<string, AttemptRecord>();
  public windowMs = 60_000;
  public maxAttempts = 20;

  constructor() {}


  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(request);
    const now = Date.now();

    const record = this.attempts.get(clientIp) ?? { timestamps: [] };
    
    // Filter out attempts outside the current sliding window
    const recentAttempts = record.timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs,
    );

    if (recentAttempts.length >= this.maxAttempts) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many login attempts. Please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recentAttempts.push(now);
    this.attempts.set(clientIp, { timestamps: recentAttempts });

    // Periodic cleanup of stale entries if map gets large
    if (this.attempts.size > 10_000) {
      this.cleanupStaleRecords(now);
    }

    return true;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress || '127.0.0.1';
  }

  private cleanupStaleRecords(now: number): void {
    for (const [ip, record] of this.attempts.entries()) {
      const active = record.timestamps.filter((t) => now - t < this.windowMs);
      if (active.length === 0) {
        this.attempts.delete(ip);
      } else {
        this.attempts.set(ip, { timestamps: active });
      }
    }
  }

  /**
   * Helper for unit tests to reset the rate limiter state.
   */
  reset(): void {
    this.attempts.clear();
  }
}
