import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Trust exactly one hop — the VPS's own Nginx reverse proxy — so
  // `request.ip` (used by LoginThrottlerGuard) reflects the real client
  // address instead of a value an unauthenticated client could set via
  // X-Forwarded-For. Scoped to production only: outside it (local dev, CI,
  // e2e tests) there is no reverse proxy in front of the app, so trusting
  // the header there would let it be spoofed directly. See
  // docs/decisions.md, "Login Rate Limiting Reversal and Trusted Proxy
  // Configuration", and docs/deployment.md for the matching Nginx directive.
  if (configService.get<string>('NODE_ENV') === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionsFilter());

  // whitelist + forbidNonWhitelisted: unknown properties (e.g. a
  // client-supplied `role` on the registration payload) are rejected rather
  // than silently stripped, per docs/decisions.md's registration rule.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Explicit origin + credentials, never a wildcard with credentials
  // (docs/architecture.md, "Cross-Origin and Cookie Configuration").
  const frontendOrigin = configService.get<string>('FRONTEND_ORIGIN');
  app.enableCors({
    origin: frontendOrigin ?? false,
    credentials: true,
  });

  // Without this, Nest does not listen for SIGTERM/SIGINT at all, so
  // `docker compose stop`/`restart` (and any orchestrator sending SIGTERM)
  // kills the process before OnModuleDestroy hooks run — notably
  // PrismaService's, which closes the database connection pool. Required
  // for a clean shutdown in a containerized deployment.
  app.enableShutdownHooks();

  await app.listen(configService.get<string>('PORT') ?? 3000);
}
await bootstrap();
