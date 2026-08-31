import type { Reservation } from "@/types/reservation";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatUtc } from "@/lib/format";
import { statusTone } from "./statusTone";
import styles from "./ReservationTable.module.css";

/**
 * Read-only listing — no cancel/approve/reject actions yet. Those mutate
 * state (PATCH /reservations/:id/cancel|approve|reject) and belong to a
 * dedicated Reservation feature phase, not this foundation.
 *
 * There is no backend endpoint to resolve a userId/equipmentId to a
 * human-readable name beyond what's already loaded on this page, so
 * `equipmentNameById` is best-effort (falls back to the raw id) and other
 * users are shown as "Another employee" rather than a fabricated name.
 */
export function ReservationTable({
  reservations,
  currentUserId,
  equipmentNameById,
  showOwner,
}: {
  reservations: Reservation[];
  currentUserId: string;
  equipmentNameById: Record<string, string>;
  showOwner: boolean;
}) {
  if (reservations.length === 0) {
    return (
      <EmptyState
        title="No reservations yet"
        description="Reservations you create will show up here."
      />
    );
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Equipment</th>
          {showOwner && <th>Booked by</th>}
          <th>Start</th>
          <th>End</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {reservations.map((reservation) => (
          <tr key={reservation.id}>
            <td>{equipmentNameById[reservation.equipmentId] ?? reservation.equipmentId}</td>
            {showOwner && (
              <td className={styles.muted}>
                {reservation.userId === currentUserId ? "You" : "Another employee"}
              </td>
            )}
            <td className={styles.muted}>{formatUtc(reservation.startTime)}</td>
            <td className={styles.muted}>{formatUtc(reservation.endTime)}</td>
            <td>
              <Badge tone={statusTone(reservation.status)}>{reservation.status}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
