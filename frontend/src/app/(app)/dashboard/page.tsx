"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card } from "@/components/ui/Card";
import styles from "./page.module.css";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Welcome back, {user.name}</h1>
        <p className={styles.subtitle}>
          {isAdmin
            ? "You're signed in as an administrator."
            : "You're signed in as an employee."}
        </p>
      </div>

      <div className={styles.grid}>
        <Link href="/equipment">
          <Card className={styles.linkCard}>
            <p className={styles.linkTitle}>Equipment</p>
            <p className={styles.linkDescription}>Browse the shared equipment catalogue.</p>
          </Card>
        </Link>

        <Link href="/reservations">
          <Card className={styles.linkCard}>
            <p className={styles.linkTitle}>{isAdmin ? "Reservations" : "My Reservations"}</p>
            <p className={styles.linkDescription}>
              {isAdmin ? "View reservations across every employee." : "View your equipment bookings."}
            </p>
          </Card>
        </Link>

        {isAdmin && (
          <Link href="/admin">
            <Card className={styles.linkCard}>
              <p className={styles.linkTitle}>Admin</p>
              <p className={styles.linkDescription}>Equipment and approval management.</p>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
