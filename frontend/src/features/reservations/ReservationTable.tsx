"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Reservation } from "@/types/reservation";
import { approveReservation, cancelReservation, rejectReservation } from "@/lib/api/reservations";
import { resolveApiErrorMessage } from "@/lib/api/handleApiError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconCalendar, IconEquipment, IconClock, IconUser, IconAlertCircle } from "@/components/ui/Icons";
import { formatUtc, isUpcomingReservation } from "@/lib/format";
import { statusTone } from "./statusTone";
import styles from "./ReservationTable.module.css";

type Action = "cancel" | "approve" | "reject";

type RowState =
  | { mode: "idle" }
  | { mode: "confirming"; action: Action }
  | { mode: "submitting" }
  | { mode: "error"; message: string };

const CONFIRM_LABEL: Record<Action, string> = {
  cancel: "Cancel this reservation?",
  approve: "Approve this reservation?",
  reject: "Reject this reservation?",
};

const ACTION_FN: Record<Action, (id: string) => Promise<Reservation>> = {
  cancel: cancelReservation,
  approve: approveReservation,
  reject: rejectReservation,
};

/**
 * `currentUserId`/`isAdmin` determine which actions render per row — but the
 * backend independently re-checks ownership/role/status on every mutation
 * regardless of what this component shows (RBAC + ownership are enforced
 * server-side, per docs/decisions.md). Hiding an action here is purely UX:
 * it keeps the table from offering a button the API would reject anyway.
 */
export function ReservationTable({
  reservations: initialReservations,
  currentUserId,
  equipmentNameById,
  showOwner,
  isAdmin,
}: {
  reservations: Reservation[];
  currentUserId: string;
  equipmentNameById: Record<string, string>;
  showOwner: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [reservations, setReservations] = useState(initialReservations);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  const rowState = (id: string): RowState => rowStates[id] ?? { mode: "idle" };
  const setRowState = (id: string, state: RowState) =>
    setRowStates((prev) => ({ ...prev, [id]: state }));

  async function confirmAction(reservation: Reservation, action: Action) {
    setRowState(reservation.id, { mode: "submitting" });
    try {
      const updated = await ACTION_FN[action](reservation.id);
      setReservations((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setRowState(reservation.id, { mode: "idle" });
    } catch (error) {
      const message = resolveApiErrorMessage(error, () => router.push("/login"));
      setRowState(reservation.id, { mode: "error", message });
    }
  }

  if (reservations.length === 0) {
    return (
      <EmptyState
        icon={<IconCalendar size={28} />}
        title="No reservations on record"
        description="Bookings created for shared equipment will be listed here with start/end schedules and status tracking."
      />
    );
  }

  const rowProps = (reservation: Reservation) => ({
    reservation,
    isOwner: reservation.userId === currentUserId,
    isAdmin,
    state: rowState(reservation.id),
    onRequestAction: (action: Action) => setRowState(reservation.id, { mode: "confirming", action }),
    onDismiss: () => setRowState(reservation.id, { mode: "idle" }),
    onConfirm: (action: Action) => confirmAction(reservation, action),
  });

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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => {
              const isCurrentUser = reservation.userId === currentUserId;
              const equipName = equipmentNameById[reservation.equipmentId] ?? reservation.equipmentId;

              return (
                <tr key={reservation.id}>
                  <td>
                    <Link href={`/reservations/${reservation.id}`} className={styles.equipmentCell}>
                      <div className={styles.equipmentIconBox}>
                        <IconEquipment size={16} />
                      </div>
                      <span className={styles.equipmentName}>{equipName}</span>
                    </Link>
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

                  <td>
                    <RowActions {...rowProps(reservation)} />
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
                <Link href={`/reservations/${reservation.id}`} className={styles.equipmentCell}>
                  <div className={styles.equipmentIconBox}>
                    <IconEquipment size={16} />
                  </div>
                  <span className={styles.equipmentName}>{equipName}</span>
                </Link>
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

              <div className={styles.mobileCardFooter}>
                <RowActions {...rowProps(reservation)} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function RowActions({
  reservation,
  isOwner,
  isAdmin,
  state,
  onRequestAction,
  onDismiss,
  onConfirm,
}: {
  reservation: Reservation;
  isOwner: boolean;
  isAdmin: boolean;
  state: RowState;
  onRequestAction: (action: Action) => void;
  onDismiss: () => void;
  onConfirm: (action: Action) => void;
}) {
  const isActive = reservation.status === "PENDING" || reservation.status === "CONFIRMED";
  const canCancel = isOwner && !isAdmin && isActive && isUpcomingReservation(reservation.startTime);
  const canModerate = isAdmin && reservation.status === "PENDING";

  if (state.mode === "confirming") {
    return (
      <div className={styles.confirmGroup}>
        <span className={styles.confirmLabel}>{CONFIRM_LABEL[state.action]}</span>
        <Button
          size="sm"
          variant={state.action === "reject" ? "danger" : "primary"}
          onClick={() => onConfirm(state.action)}
        >
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    );
  }

  const isSubmitting = state.mode === "submitting";

  return (
    <div className={styles.actionGroup}>
      {canCancel && (
        <Button size="sm" variant="outline" isLoading={isSubmitting} onClick={() => onRequestAction("cancel")}>
          Cancel
        </Button>
      )}
      {canModerate && (
        <>
          <Button size="sm" variant="primary" isLoading={isSubmitting} onClick={() => onRequestAction("approve")}>
            Approve
          </Button>
          <Button size="sm" variant="danger" isLoading={isSubmitting} onClick={() => onRequestAction("reject")}>
            Reject
          </Button>
        </>
      )}
      {!canCancel && !canModerate && <span className={styles.noAction}>—</span>}
      {state.mode === "error" && (
        <div className={styles.rowError}>
          <IconAlertCircle size={13} />
          <span>{state.message}</span>
        </div>
      )}
    </div>
  );
}
