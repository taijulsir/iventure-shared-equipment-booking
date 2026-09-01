"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Reservation } from "@/types/reservation";
import { approveReservation, cancelReservation, rejectReservation } from "@/lib/api/reservations";
import { resolveApiErrorMessage } from "@/lib/api/handleApiError";
import { isUpcomingReservation } from "@/lib/format";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import styles from "./ReservationDetailActions.module.css";

type Action = "cancel" | "approve" | "reject";

const ACTION_FN: Record<Action, (id: string) => Promise<Reservation>> = {
  cancel: cancelReservation,
  approve: approveReservation,
  reject: rejectReservation,
};

const CONFIRM_LABEL: Record<Action, string> = {
  cancel: "Cancel this reservation?",
  approve: "Approve this reservation?",
  reject: "Reject this reservation?",
};

/** Single-reservation equivalent of ReservationTable's row actions — kept
 * as its own component since the detail page has no "row" to attach state
 * to. Re-checks the same visibility rules (backend still enforces them
 * independently on every request). */
export function ReservationDetailActions({
  reservation,
  isOwner,
  isAdmin,
}: {
  reservation: Reservation;
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = reservation.status === "PENDING" || reservation.status === "CONFIRMED";
  const canCancel = isOwner && !isAdmin && isActive && isUpcomingReservation(reservation.startTime);
  const canModerate = isAdmin && reservation.status === "PENDING";

  if (!canCancel && !canModerate) {
    return null;
  }

  async function confirm(action: Action) {
    setIsSubmitting(true);
    setError(null);
    try {
      await ACTION_FN[action](reservation.id);
      router.refresh();
      setPendingAction(null);
    } catch (caught) {
      setError(resolveApiErrorMessage(caught, () => router.push("/login")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.actions}>
      {error && <Alert variant="error">{error}</Alert>}

      {pendingAction ? (
        <div className={styles.confirmGroup}>
          <span className={styles.confirmLabel}>{CONFIRM_LABEL[pendingAction]}</span>
          <Button
            size="sm"
            variant={pendingAction === "reject" ? "danger" : "primary"}
            isLoading={isSubmitting}
            onClick={() => confirm(pendingAction)}
          >
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPendingAction(null)} disabled={isSubmitting}>
            Dismiss
          </Button>
        </div>
      ) : (
        <div className={styles.buttonGroup}>
          {canCancel && (
            <Button size="sm" variant="outline" onClick={() => setPendingAction("cancel")}>
              Cancel reservation
            </Button>
          )}
          {canModerate && (
            <>
              <Button size="sm" variant="primary" onClick={() => setPendingAction("approve")}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => setPendingAction("reject")}>
                Reject
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
