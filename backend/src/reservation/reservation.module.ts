import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ReservationController } from './reservation.controller.js';
import { ReservationService } from './reservation.service.js';

// Imports AuthModule (not just individual providers) for the same reason as
// EquipmentModule: JwtAuthGuard's own dependency (JwtService) and
// OwnershipService both need to be resolvable in this module's injector —
// see AuthModule's re-export of its JwtModule.
@Module({
  imports: [AuthModule],
  controllers: [ReservationController],
  providers: [ReservationService],
})
export class ReservationModule {}
