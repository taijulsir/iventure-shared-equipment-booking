import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthorizationDemoModule } from './auth/testing/authorization-demo.module.js';
import { EquipmentModule } from './equipment/equipment.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    EquipmentModule,
    // TEST/SUPPORT INFRASTRUCTURE ONLY — see authorization-demo.module.ts.
    // Remove once real ownership-checked domain routes (Reservations) exist.
    AuthorizationDemoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
