import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { HashingService } from './hashing.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { OwnershipService } from './ownership.service.js';

// Kept as a named reference so it can be re-exported below, not just
// imported — JwtAuthGuard depends on JwtService, and any module that wants
// to `@UseGuards(JwtAuthGuard)` (e.g. EquipmentModule, ReservationModule,
// UsersModule) needs JwtService resolvable in its own injector, not just
// JwtAuthGuard itself.
const jwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): JwtModuleOptions => {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_SECRET is not set. Configure it in the environment before starting the application.',
      );
    }
    // Cast: JWT_EXPIRES_IN is a free-form env string (e.g. "1h"), while
    // `expiresIn` is typed against `ms`'s template-literal duration union.
    const expiresIn = (configService.get<string>('JWT_EXPIRES_IN') ?? '1h') as StringValue;

    return {
      secret,
      signOptions: { expiresIn },
    };
  },
});

@Module({
  imports: [jwtModule],
  controllers: [AuthController],
  providers: [AuthService, HashingService, JwtAuthGuard, RolesGuard, OwnershipService],
  exports: [jwtModule, JwtAuthGuard, RolesGuard, OwnershipService],
})
export class AuthModule {}
