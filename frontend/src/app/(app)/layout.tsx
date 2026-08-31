import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

/**
 * The actual authorization boundary for every authenticated page: resolves
 * the session against the real backend (GET /auth/me, cookie forwarded
 * server-side) and redirects to /login if it fails. This is enforced here
 * once for the whole (app) route group, not by hiding nav links — every
 * page under this layout, and every mutation those pages call, is also
 * independently checked by the backend regardless of what this does.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProvider user={user}>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
