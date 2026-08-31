import type { Reservation } from "@/types/reservation";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconCalendar, IconEquipment, IconClock, IconUser } from "@/components/ui/Icons";
import { formatUtc } from "@/lib/format";
import { statusTone } from "./statusTone";
import styles from "./ReservationTable.module.css";

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
        icon={<IconCalendar size={28} />}
        title="No reservations on record"
        description="Bookings created for shared equipment will be listed here with start/end schedules and status tracking."
      />
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Equipment</th>
              {showOwner && <th>Booked By</th>}
              <th>Start Time (UTC)</th>
              <th>End Time (UTC)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => {
              const isCurrentUser = reservation.userId === currentUserId;
              const equipName = equipmentNameById[reservation.equipmentId] ?? reservation.equipmentId;

              return (
                <tr key={reservation.id}>
                  <td>
                    <div className={styles.equipmentCell}>
                      <div className={styles.equipmentIconBox}>
                        <IconEquipment size={16} />
                      </div>
                      <span className={styles.equipmentName}>{equipName}</span>
                    </div>
                  </td>

                  {showOwner && (
                    <td>
                      <div className={styles.userCell}>
                        <IconUser size={14} style={{ opacity: 0.7 }} />
                        <span>{isCurrentUser ? "You" : "Another employee"}</span>
                      </div>
                    </td>
                  )}

                  <td>
                    <div className={styles.timeCell}>
                      <IconClock size={14} className={styles.timeIcon} />
                      <span>{formatUtc(reservation.startTime)}</span>
                    </div>
                  </td>

                  <td>
                    <div className={styles.timeCell}>
                      <IconClock size={14} className={styles.timeIcon} />
                      <span>{formatUtc(reservation.endTime)}</span>
                    </div>
                  </td>

                  <td>
                    <Badge tone={statusTone(reservation.status)}>
                      {reservation.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className={styles.mobileCardList}>
        {reservations.map((reservation) => {
          const isCurrentUser = reservation.userId === currentUserId;
          const equipName = equipmentNameById[reservation.equipmentId] ?? reservation.equipmentId;

          return (
            <div key={reservation.id} className={styles.mobileCard}>
              <div className={styles.mobileCardHeader}>
                <div className={styles.equipmentCell}>
                  <div className={styles.equipmentIconBox}>
                    <IconEquipment size={16} />
                  </div>
                  <span className={styles.equipmentName}>{equipName}</span>
                </div>
                <Badge tone={statusTone(reservation.status)}>
                  {reservation.status}
                </Badge>
              </div>

              {showOwner && (
                <div className={styles.userCell} style={{ fontSize: "0.8125rem" }}>
                  <IconUser size={14} style={{ opacity: 0.7 }} />
                  <span>Booked by: <strong>{isCurrentUser ? "You" : "Another employee"}</strong></span>
                </div>
              )}

              <div className={styles.mobileCardTimes}>
                <div className={styles.timeRow}>
                  <span className={styles.timeLabel}>Start:</span>
                  <span className={styles.timeValue}>{formatUtc(reservation.startTime)}</span>
                </div>
                <div className={styles.timeRow}>
                  <span className={styles.timeLabel}>End:</span>
                  <span className={styles.timeValue}>{formatUtc(reservation.endTime)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
