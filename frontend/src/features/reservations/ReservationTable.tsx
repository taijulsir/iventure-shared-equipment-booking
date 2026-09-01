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
      <div className="hidden sm:block w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border rounded-tl-[var(--radius-md)] whitespace-nowrap">
                Equipment
              </th>
              {showOwner && (
                <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap">
                  Booked By
                </th>
              )}
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap">
                Start Time (UTC)
              </th>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap">
                End Time (UTC)
              </th>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap">
                Status
              </th>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border rounded-tr-[var(--radius-md)] whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => {
              const isCurrentUser = reservation.userId === currentUserId;
              const equipName = equipmentNameById[reservation.equipmentId] ?? reservation.equipmentId;

              return (
                <tr key={reservation.id} className="group hover:bg-surface-subtle transition-colors duration-150">
                  <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
                    <Link href={`/reservations/${reservation.id}`} className="flex items-center gap-3 w-fit group/link">
                      <div className="w-8 h-8 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
                        <IconEquipment size={16} />
                      </div>
                      <span className="font-semibold text-foreground group-hover/link:text-primary transition-colors duration-150">
                        {equipName}
                      </span>
                    </Link>
                  </td>

                  {showOwner && (
                    <td className="p-4 border-b border-border text-foreground-secondary align-middle group-last:border-b-0">
                      <div className="flex items-center gap-2">
                        <IconUser size={14} style={{ opacity: 0.7 }} />
                        <span>{isCurrentUser ? "You" : "Another employee"}</span>
                      </div>
                    </td>
                  )}

                  <td className="p-4 border-b border-border text-foreground-secondary align-middle group-last:border-b-0">
                    <div className="flex items-center gap-1.5 tabular-nums whitespace-nowrap">
                      <IconClock size={14} className="text-foreground-muted" />
                      <span>{formatUtc(reservation.startTime)}</span>
                    </div>
                  </td>

                  <td className="p-4 border-b border-border text-foreground-secondary align-middle group-last:border-b-0">
                    <div className="flex items-center gap-1.5 tabular-nums whitespace-nowrap">
                      <IconClock size={14} className="text-foreground-muted" />
                      <span>{formatUtc(reservation.endTime)}</span>
                    </div>
                  </td>

                  <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
                    <Badge tone={statusTone(reservation.status)}>
                      {reservation.status}
                    </Badge>
                  </td>

                  <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
                    <RowActions {...rowProps(reservation)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="sm:hidden flex flex-col gap-4">
        {reservations.map((reservation) => {
          const isCurrentUser = reservation.userId === currentUserId;
          const equipName = equipmentNameById[reservation.equipmentId] ?? reservation.equipmentId;

          return (
            <div key={reservation.id} className="bg-surface border border-border rounded-[var(--radius-md)] p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/reservations/${reservation.id}`} className="flex items-center gap-3 w-fit group/link">
                  <div className="w-8 h-8 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
                    <IconEquipment size={16} />
                  </div>
                  <span className="font-semibold text-foreground group-hover/link:text-primary transition-colors duration-150">
                    {equipName}
                  </span>
                </Link>
                <Badge tone={statusTone(reservation.status)}>
                  {reservation.status}
                </Badge>
              </div>

              {showOwner && (
                <div className="flex items-center gap-2 text-foreground-secondary text-[0.8125rem]">
                  <IconUser size={14} style={{ opacity: 0.7 }} />
                  <span>Booked by: <strong>{isCurrentUser ? "You" : "Another employee"}</strong></span>
                </div>
              )}

              <div className="flex flex-col gap-1.5 p-3 bg-surface-muted rounded-[var(--radius-sm)]">
                <div className="flex items-center justify-between text-[0.8125rem]">
                  <span className="text-foreground-muted font-medium">Start:</span>
                  <span className="text-foreground font-medium tabular-nums">{formatUtc(reservation.startTime)}</span>
                </div>
                <div className="flex items-center justify-between text-[0.8125rem]">
                  <span className="text-foreground-muted font-medium">End:</span>
                  <span className="text-foreground font-medium tabular-nums">{formatUtc(reservation.endTime)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
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
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[0.8125rem] font-medium text-foreground-secondary">{CONFIRM_LABEL[state.action]}</span>
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
    <div className="flex items-center gap-2 flex-wrap">
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
      {!canCancel && !canModerate && <span className="text-foreground-muted">—</span>}
      {state.mode === "error" && (
        <div className="flex items-center gap-1.5 mt-2 text-danger text-[0.8125rem] w-full">
          <IconAlertCircle size={13} />
          <span>{state.message}</span>
        </div>
      )}
    </div>
  );
}
