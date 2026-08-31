import { redirect } from "next/navigation";
import { getServerSession, getRequestCookieHeader } from "@/lib/api/server-session";
import { listReservations } from "@/lib/api/reservations";
import { listEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Reservation } from "@/types/reservation";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReservationTable } from "@/features/reservations/ReservationTable";
import styles from "./page.module.css";

export default async function ReservationsPage() {
  const user = await getServerSession();
  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.role === "ADMIN";
  const cookieHeader = await getRequestCookieHeader();

  let reservations: Reservation[] | null = null;
  let equipmentNameById: Record<string, string> = {};
  let errorMessage: string | null = null;

  try {
    const [reservationList, equipmentPage] = await Promise.all([
      listReservations(cookieHeader),
      listEquipment({ limit: 100 }, cookieHeader),
    ]);
    reservations = reservationList;
    equipmentNameById = Object.fromEntries(equipmentPage.data.map((item) => [item.id, item.name]));
  } catch (error) {
    errorMessage =
      error instanceof ApiError ? error.message : "Something went wrong loading reservations.";
  }

  const count = reservations ? reservations.length : 0;

  return (
    <div className={styles.page}>
      <PageHeader
        title={isAdmin ? "All Company Reservations" : "My Reservations"}
        subtitle={
          isAdmin
            ? "Monitor active and upcoming reservations across every team member."
            : "Review your equipment schedules, approval progress, and active bookings."
        }
        badge={
          reservations && (
            <Badge tone="neutral" showDot={false}>
              {count} {count === 1 ? "Booking" : "Bookings"}
            </Badge>
          )
        }
      />

      {errorMessage ? (
        <Alert variant="error" title="Failed to load reservations">
          {errorMessage}
        </Alert>
      ) : (
        <div className={styles.tableCard}>
          <ReservationTable
            reservations={reservations ?? []}
            currentUserId={user.id}
            equipmentNameById={equipmentNameById}
            showOwner={isAdmin}
          />
        </div>
      )}
    </div>
  );
}
