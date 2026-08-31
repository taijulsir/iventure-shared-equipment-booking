import { Module } from '@nestjs/common';
import { AuthModule } from '../auth.module.js';
import { AuthorizationDemoController } from './authorization-demo.controller.js';

/**
 * TEST/SUPPORT INFRASTRUCTURE ONLY.
 *
 * Wires up AuthorizationDemoController so the RBAC + ownership mechanisms
 * can be verified against real HTTP requests in this phase. Remove this
 * module (and its import in app.module.ts) once real ownership-checked
 * domain routes exist.
 */
@Module({
  imports: [AuthModule],
  controllers: [AuthorizationDemoController],
})
export class AuthorizationDemoModule {}
