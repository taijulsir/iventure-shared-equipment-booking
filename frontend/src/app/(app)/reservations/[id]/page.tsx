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

  let reservation: Reservation | null = null;
  let equipmentName: string | null = null;
  let errorMessage: string | null = null;

  try {
    reservation = await getReservation(id, cookieHeader);

    try {
      const equipment = await getEquipment(reservation.equipmentId, cookieHeader);
      equipmentName = equipment.name;
    } catch {
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
      <div className="flex flex-col gap-6 max-w-[560px]">
        <PageHeader title="Reservation" subtitle="Reservation details" />
        <Alert variant="error" title="Failed to load reservation">
          {errorMessage}
        </Alert>
        <Link
          href="/reservations"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-primary transition-colors duration-150 w-fit"
        >
          <IconArrowRight size={14} className="rotate-180" />
          <span>Back to reservations</span>
        </Link>
      </div>
    );
  }

  const isOwner = reservation.userId === user.id;

  return (
    <div className="flex flex-col gap-6 max-w-[560px]">
      <PageHeader
        title={equipmentName ?? reservation.equipmentId}
        subtitle="Reservation details"
        badge={<Badge tone={statusTone(reservation.status)}>{reservation.status}</Badge>}
      />

      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-start gap-3">
          <IconClock size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <span className="block text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted">Start time</span>
            <span className="block text-[0.9375rem] font-medium text-foreground mt-0.5 tabular-nums">{formatUtc(reservation.startTime)}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <IconClock size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <span className="block text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted">End time</span>
            <span className="block text-[0.9375rem] font-medium text-foreground mt-0.5 tabular-nums">{formatUtc(reservation.endTime)}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-start gap-3">
            <IconUser size={16} className="text-primary mt-0.5 shrink-0" />
            <div>
              <span className="block text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted">Booked by</span>
              <span className="block text-[0.9375rem] font-medium text-foreground mt-0.5">{isOwner ? "You" : "Another employee"}</span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <IconClock size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <span className="block text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted">Created</span>
            <span className="block text-[0.9375rem] font-medium text-foreground mt-0.5 tabular-nums">{formatUtc(reservation.createdAt)}</span>
          </div>
        </div>

        <ReservationDetailActions reservation={reservation} isOwner={isOwner} isAdmin={isAdmin} />
      </Card>

      <Link
        href="/reservations"
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-primary transition-colors duration-150 w-fit"
      >
        <IconArrowRight size={14} className="rotate-180" />
        <span>Back to reservations</span>
      </Link>
    </div>
  );
}
