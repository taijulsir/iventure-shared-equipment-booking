import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconBrandLogo } from "@/components/ui/Icons";
import styles from "./layout.module.css";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.topBar}>
        <Link href="/" className={styles.brandLink}>
          <IconBrandLogo size={24} />
          <span>iVenture</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className={styles.mainArea}>
        <div className={styles.authCardWrapper}>
          <div className={styles.authCard}>{children}</div>
        </div>
      </main>
    </div>
  );
}
