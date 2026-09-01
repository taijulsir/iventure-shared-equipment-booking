import { redirect } from "next/navigation";
import { getServerSession, getRequestCookieHeader } from "@/lib/api/server-session";
import { listReservations } from "@/lib/api/reservations";
import { listEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Reservation, ReservationStatus } from "@/types/reservation";
import type { PaginationMeta } from "@/types/pagination";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ReservationTable } from "@/features/reservations/ReservationTable";
import { ReservationFilters } from "@/features/reservations/ReservationFilters";

const PAGE_LIMIT = 20;
const VALID_STATUSES: ReservationStatus[] = ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED"];

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: statusParam, page: pageParam } = await searchParams;
  const status = VALID_STATUSES.includes(statusParam as ReservationStatus)
    ? (statusParam as ReservationStatus)
    : undefined;
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;

  const user = await getServerSession();
  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";
  const isEmployee = user.role === "EMPLOYEE";
  const cookieHeader = await getRequestCookieHeader();

  let reservations: Reservation[] | null = null;
  let meta: PaginationMeta | null = null;
  let equipmentNameById: Record<string, string> = {};
  let errorMessage: string | null = null;

  try {
    const [reservationResult, equipmentPage] = await Promise.all([
      listReservations({ status, page, limit: PAGE_LIMIT }, cookieHeader),
      listEquipment({ limit: 100 }, cookieHeader),
    ]);
    reservations = reservationResult.data;
    meta = reservationResult.meta;
    equipmentNameById = Object.fromEntries(equipmentPage.data.map((item) => [item.id, item.name]));
  } catch (error) {
    errorMessage =
      error instanceof ApiError ? error.message : "Something went wrong loading reservations.";
  }

  function buildHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(targetPage));
    return `/reservations?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={isAdmin ? "All Company Reservations" : "My Reservations"}
        subtitle={
          isAdmin
            ? "Monitor active and upcoming reservations across every team member."
            : "Review your equipment schedules, approval progress, and active bookings."
        }
        badge={
          meta && (
            <Badge tone="neutral" showDot={false}>
              {meta.total} {meta.total === 1 ? "Booking" : "Bookings"}
            </Badge>
          )
        }
        action={
          isEmployee && (
            <Button href="/reservations/new" variant="primary" size="md">
              New Reservation
            </Button>
          )
        }
      />

      <ReservationFilters initialStatus={status ?? ""} />

      {errorMessage ? (
        <Alert variant="error" title="Failed to load reservations">
          {errorMessage}
        </Alert>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-[var(--radius-lg)] overflow-hidden shadow-xs">
            <ReservationTable
              reservations={reservations ?? []}
              currentUserId={user.id}
              equipmentNameById={equipmentNameById}
              showOwner={isAdmin}
              isAdmin={isAdmin}
            />
          </div>
          {meta && <Pagination meta={meta} buildHref={buildHref} />}
        </>
      )}
    </div>
  );
}
