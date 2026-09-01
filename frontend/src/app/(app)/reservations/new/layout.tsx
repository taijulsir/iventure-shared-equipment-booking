import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";

/**
 * Independent guard for the reservation-creation route — mirrors the
 * pattern used by admin/layout.tsx and admin/users/layout.tsx: re-verifies
 * against the real backend session rather than trusting the parent (app)
 * layout's user object. Only EMPLOYEE can create a reservation
 * (docs/decisions.md) — Admin and SuperAdmin are redirected back to the
 * reservations list rather than being shown a form the backend would
 * reject with 403.
 */
export default async function NewReservationLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "EMPLOYEE") {
    redirect("/reservations");
  }

  return <>{children}</>;
}
