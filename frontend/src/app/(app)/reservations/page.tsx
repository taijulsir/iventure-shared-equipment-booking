import { redirect } from "next/navigation";
import { getServerSession, getRequestCookieHeader } from "@/lib/api/server-session";
import { listReservations } from "@/lib/api/reservations";
import { listEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Reservation } from "@/types/reservation";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ReservationTable } from "@/features/reservations/ReservationTable";
import styles from "./page.module.css";

export default async function ReservationsPage() {
  // The (app) layout already redirects unauthenticated visitors; this
  // second check just gets us the user's id/role for this page's own
  // needs (see reservation.service.ts, findAllForUser — the backend
  // already scopes the list by role, this is only for display labeling).
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
      // A single page of equipment is enough to label the (currently
      // small) set of reservations created in this foundation phase; a
      // full lookup across a large catalogue is a later-phase concern.
      listEquipment({ limit: 100 }, cookieHeader),
    ]);
    reservations = reservationList;
    equipmentNameById = Object.fromEntries(equipmentPage.data.map((item) => [item.id, item.name]));
  } catch (error) {
    errorMessage =
      error instanceof ApiError ? error.message : "Something went wrong loading reservations.";
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{isAdmin ? "Reservations" : "My Reservations"}</h1>
      {errorMessage ? (
        <Alert variant="error">{errorMessage}</Alert>
      ) : (
        <Card>
          <ReservationTable
            reservations={reservations ?? []}
            currentUserId={user.id}
            equipmentNameById={equipmentNameById}
            showOwner={isAdmin}
          />
        </Card>
      )}
    </div>
  );
}
