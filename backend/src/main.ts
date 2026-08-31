import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());

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

  await app.listen(configService.get<string>('PORT') ?? 3000);
}
await bootstrap();
