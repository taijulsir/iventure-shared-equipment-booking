import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";
import { Card } from "@/components/ui/Card";
import styles from "./layout.module.css";

/**
 * Shared shell for the public /login and /register pages. Redirects an
 * already-authenticated visitor straight to /dashboard in one place, rather
 * than duplicating that check in both pages.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <Card>{children}</Card>
      </div>
    </div>
  );
}
