import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
          <BrandLogo height={36} priority />
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
