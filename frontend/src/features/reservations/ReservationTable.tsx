"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Reservation } from "@/types/reservation";
import { approveReservation, cancelReservation, rejectReservation } from "@/lib/api/reservations";
import { resolveApiErrorMessage } from "@/lib/api/handleApiError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconCalendar, IconEquipment, IconClock, IconUser, IconAlertCircle } from "@/components/ui/Icons";
import { formatUtc, isUpcomingReservation } from "@/lib/format";
import { statusTone } from "./statusTone";

type Action = "cancel" | "approve" | "reject";

interface PendingAction {
  reservation: Reservation;
  action: Action;
}

const ACTION_CONFIG: Record<
  Action,
  {
    title: string;
    description: (name: string) => string;
    confirmLabel: string;
    variant: "primary" | "danger";
  }
> = {
  cancel: {
    title: "Cancel Reservation?",
    description: (name) =>
      `Are you sure you want to cancel your reservation for ${name}? The reserved timeframe will be freed up for other team members.`,
    confirmLabel: "Cancel Reservation",
    variant: "danger",
  },
  approve: {
    title: "Approve Reservation?",
    description: (name) =>
      `Are you sure you want to approve this reservation request for ${name}? The employee will be confirmed for their reserved timeframe.`,
    confirmLabel: "Approve",
    variant: "primary",
  },
  reject: {
    title: "Reject Reservation?",
    description: (name) =>
      `Are you sure you want to reject this reservation request for ${name}? The employee will be notified and the reservation will be marked as Rejected.`,
    confirmLabel: "Reject",
    variant: "danger",
  },
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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  async function handleConfirmAction() {
    if (!pendingAction) return;
    const { reservation, action } = pendingAction;

    setIsSubmitting(true);
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[reservation.id];
      return next;
    });

    try {
      const updated = await ACTION_FN[action](reservation.id);
      setReservations((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setPendingAction(null);
      router.refresh();
    } catch (error) {
      const message = resolveApiErrorMessage(error, () => router.push("/login"));
      setRowErrors((prev) => ({ ...prev, [reservation.id]: message }));
      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (reservations.length === 0) {
    return (
      <EmptyState
        icon={<IconCalendar size={28} />}
        title="No reservations found"
        description="Bookings created for shared equipment will be listed here with start/end schedules and status tracking."
      />
    );
  }

  const rowProps = (reservation: Reservation) => ({
    reservation,
    isOwner: reservation.userId === currentUserId,
    isAdmin,
    errorMessage: rowErrors[reservation.id],
    onRequestAction: (action: Action) => setPendingAction({ reservation, action }),
  });

  const pendingConfig = pendingAction ? ACTION_CONFIG[pendingAction.action] : null;
  const pendingEquipName = pendingAction
    ? equipmentNameById[pendingAction.reservation.equipmentId] ?? pendingAction.reservation.equipmentId
    : "";

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden sm:block w-full">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                Equipment
              </th>
              {showOwner && (
                <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                  Booked By
                </th>
              )}
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                Start Time (UTC)
              </th>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                End Time (UTC)
              </th>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                Status
              </th>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
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
      <div className="sm:hidden flex flex-col gap-4 p-4">
        {reservations.map((reservation) => {
          const isCurrentUser = reservation.userId === currentUserId;
          const equipName = equipmentNameById[reservation.equipmentId] ?? reservation.equipmentId;

          return (
            <div key={reservation.id} className="bg-surface border border-border rounded-[var(--radius-md)] p-4 flex flex-col gap-3">
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

      {/* Confirmation Modal */}
      {pendingAction && pendingConfig && (
        <ConfirmationModal
          isOpen={Boolean(pendingAction)}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirmAction}
          isLoading={isSubmitting}
          confirmVariant={pendingConfig.variant}
          confirmLabel={pendingConfig.confirmLabel}
          title={pendingConfig.title}
          description={pendingConfig.description(pendingEquipName)}
        />
      )}
    </>
  );
}

function RowActions({
  reservation,
  isOwner,
  isAdmin,
  errorMessage,
  onRequestAction,
}: {
  reservation: Reservation;
  isOwner: boolean;
  isAdmin: boolean;
  errorMessage?: string;
  onRequestAction: (action: Action) => void;
}) {
  const isActive = reservation.status === "PENDING" || reservation.status === "CONFIRMED";
  const canCancel = isOwner && !isAdmin && isActive && isUpcomingReservation(reservation.startTime);
  const canModerate = isAdmin && reservation.status === "PENDING";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {canCancel && (
        <Button size="sm" variant="outline" onClick={() => onRequestAction("cancel")}>
          Cancel
        </Button>
      )}
      {canModerate && (
        <>
          <Button size="sm" variant="primary" onClick={() => onRequestAction("approve")}>
            Approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => onRequestAction("reject")}>
            Reject
          </Button>
        </>
      )}
      {!canCancel && !canModerate && (
        <span className="text-xs text-foreground-muted">No actions available</span>
      )}
      {errorMessage && (
        <div className="flex items-center gap-1.5 mt-2 text-danger text-[0.8125rem] w-full">
          <IconAlertCircle size={13} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
