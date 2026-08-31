import { IsISO8601, IsUUID } from 'class-validator';

/**
 * No `userId` and no `status` field here on purpose:
 * - The owning user always comes from the authenticated JWT identity
 *   (see ReservationController/ReservationService), never from the body —
 *   a client must not be able to create a reservation "on behalf of"
 *   another user.
 * - The initial status is derived server-side from the equipment's
 *   `requiresApproval` flag (docs/architecture.md, "Reservation Workflow"),
 *   never client-supplied.
 * Combined with the app's global `forbidNonWhitelisted` ValidationPipe, a
 * client that supplies either field anyway gets a 400, not a silently
 * ignored field.
 *
 * `startTime`/`endTime` are kept as ISO 8601 strings here (not `Date`, to
 * avoid the ValidationPipe's `transform: true` converting the value to a
 * `Date` before `@IsISO8601()` can validate the original string) and parsed
 * in the service.
 */
export class CreateReservationDto {
  @IsUUID()
  equipmentId!: string;

  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  endTime!: string;
}
