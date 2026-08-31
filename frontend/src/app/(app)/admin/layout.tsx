import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";

/**
 * A second, independent guard specifically for the Admin role — deliberately
 * not relying on the parent (app) layout's user object (Server Components
 * don't share React context with further nested Server Components the way
 * client components do) or on the client-side nav simply hiding the "Admin"
 * link. Re-verifies against the real backend session so this route stays
 * protected even if the layout tree above it is ever restructured.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
