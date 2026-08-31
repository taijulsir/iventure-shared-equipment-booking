import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

// Imports AuthModule (not just the guards individually) because
// JwtAuthGuard's own dependency (JwtService) must be resolvable in this
// module's injector too — see AuthModule's re-export of its JwtModule, and
// the identical pattern in EquipmentModule/ReservationModule.
@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
