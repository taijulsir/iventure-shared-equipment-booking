import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";

/**
 * A third, independent guard — stricter than the parent /admin layout, which
 * already lets ADMIN and SUPERADMIN through. User Management is
 * SUPERADMIN-only: an ADMIN who reaches /admin (a route they're legitimately
 * allowed into) must still be turned back here specifically. Re-verifies
 * against the real backend session for the same reason the other layout
 * guards in this app do (see admin/layout.tsx) — frontend visibility is UX
 * only, and GET/PATCH /users is independently enforced as SUPERADMIN-only on
 * the backend regardless of what this redirect does.
 */
export default async function AdminUsersLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "SUPERADMIN") {
    redirect("/admin");
  }

  return <>{children}</>;
}
