import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession, getRequestCookieHeader } from "@/lib/api/server-session";
import { getReservation } from "@/lib/api/reservations";
import { getEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Reservation } from "@/types/reservation";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconArrowRight, IconClock, IconUser } from "@/components/ui/Icons";
import { formatUtc } from "@/lib/format";
import { statusTone } from "@/features/reservations/statusTone";
import { ReservationDetailActions } from "@/features/reservations/ReservationDetailActions";
import styles from "./page.module.css";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getServerSession();
  if (!user) {
    redirect("/login");
  }

  const cookieHeader = await getRequestCookieHeader();
  const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";

  // Data-fetching happens entirely in this try/catch, only ever assigning
  // plain variables — no JSX is constructed inside it (react-hooks/error-
  // boundaries: JSX built inside a try/catch isn't actually protected by
  // it, since React renders asynchronously). The JSX below is built
  // unconditionally from the results afterward.
  let reservation: Reservation | null = null;
  let equipmentName: string | null = null;
  let errorMessage: string | null = null;

  try {
    reservation = await getReservation(id, cookieHeader);

    try {
      const equipment = await getEquipment(reservation.equipmentId, cookieHeader);
      equipmentName = equipment.name;
    } catch {
      // Non-fatal: the reservation itself loaded fine, so still show the
      // page — just fall back to the raw id rather than blanking the page.
      equipmentName = reservation.equipmentId;
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    errorMessage =
      error instanceof ApiError && error.status === 403
        ? "You don't have permission to view this reservation."
        : error instanceof ApiError
          ? error.message
          : "Something went wrong loading this reservation.";
  }

  if (errorMessage || !reservation) {
    return (
      <div className={styles.page}>
        <PageHeader title="Reservation" subtitle="Reservation details" />
        <Alert variant="error" title="Failed to load reservation">
          {errorMessage}
        </Alert>
        <Link href="/reservations" className={styles.backLink}>
          <IconArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
          <span>Back to reservations</span>
        </Link>
      </div>
    );
  }

  const isOwner = reservation.userId === user.id;

  return (
    <div className={styles.page}>
      <PageHeader
        title={equipmentName ?? reservation.equipmentId}
        subtitle="Reservation details"
        badge={<Badge tone={statusTone(reservation.status)}>{reservation.status}</Badge>}
      />

      <Card className={styles.detailCard}>
        <div className={styles.detailRow}>
          <IconClock size={16} className={styles.detailIcon} />
          <div>
            <span className={styles.detailLabel}>Start time</span>
            <span className={styles.detailValue}>{formatUtc(reservation.startTime)}</span>
          </div>
        </div>

        <div className={styles.detailRow}>
          <IconClock size={16} className={styles.detailIcon} />
          <div>
            <span className={styles.detailLabel}>End time</span>
            <span className={styles.detailValue}>{formatUtc(reservation.endTime)}</span>
          </div>
        </div>

        {isAdmin && (
          <div className={styles.detailRow}>
            <IconUser size={16} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Booked by</span>
              <span className={styles.detailValue}>{isOwner ? "You" : "Another employee"}</span>
            </div>
          </div>
        )}

        <div className={styles.detailRow}>
          <IconClock size={16} className={styles.detailIcon} />
          <div>
            <span className={styles.detailLabel}>Created</span>
            <span className={styles.detailValue}>{formatUtc(reservation.createdAt)}</span>
          </div>
        </div>

        <ReservationDetailActions reservation={reservation} isOwner={isOwner} isAdmin={isAdmin} />
      </Card>

      <Link href="/reservations" className={styles.backLink}>
        <IconArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
        <span>Back to reservations</span>
      </Link>
    </div>
  );
}
