import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EquipmentController } from './equipment.controller.js';
import { EquipmentService } from './equipment.service.js';

// Imports AuthModule (not just the guards individually) because
// JwtAuthGuard's own dependency (JwtService) must be resolvable in this
// module's injector too — see AuthModule's re-export of its JwtModule.
@Module({
  imports: [AuthModule],
  controllers: [EquipmentController],
  providers: [EquipmentService],
})
export class EquipmentModule {}
