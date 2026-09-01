import { redirect } from "next/navigation";
import { getServerSession, getRequestCookieHeader } from "@/lib/api/server-session";
import { listReservations } from "@/lib/api/reservations";
import { listEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Reservation, ReservationStatus } from "@/types/reservation";
import type { PaginationMeta } from "@/types/pagination";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { TableContainer } from "@/components/ui/TableContainer";
import { ReservationTable } from "@/features/reservations/ReservationTable";
import { ReservationFilters } from "@/features/reservations/ReservationFilters";
import { NewReservationButton } from "@/features/reservations/NewReservationButton";

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
    const reservationResult = await listReservations(
      { status, page, limit: PAGE_LIMIT },
      cookieHeader,
    );
    reservations = reservationResult.data;
    meta = reservationResult.meta;

    // Resolve names for exactly the equipment this page of reservations
    // references — not a fixed-size slice of the catalogue, so this never
    // silently falls back to a raw id once the catalogue grows past some
    // arbitrary cap (see docs/decisions.md, "Resolving Equipment Names...").
    const equipmentIds = [...new Set(reservations.map((reservation) => reservation.equipmentId))];
    if (equipmentIds.length > 0) {
      const equipmentPage = await listEquipment({ ids: equipmentIds }, cookieHeader);
      equipmentNameById = Object.fromEntries(equipmentPage.data.map((item) => [item.id, item.name]));
    }
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
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="shrink-0 flex flex-col gap-4">
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
          action={isEmployee ? <NewReservationButton /> : null}
        />

        <ReservationFilters initialStatus={status ?? ""} />
      </div>

      {errorMessage ? (
        <Alert variant="error" title="Failed to load reservations">
          {errorMessage}
        </Alert>
      ) : (
        <TableContainer
          pagination={meta && meta.totalPages > 1 ? <Pagination meta={meta} buildHref={buildHref} /> : null}
        >
          <ReservationTable
            reservations={reservations ?? []}
            currentUserId={user.id}
            equipmentNameById={equipmentNameById}
            showOwner={isAdmin}
            isAdmin={isAdmin}
          />
        </TableContainer>
      )}
    </div>
  );
}
