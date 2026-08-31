"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import styles from "./Header.module.css";

function NavLink({ href, children }: { href: string; children: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}>
      {children}
    </Link>
  );
}

export function Header() {
  const { user, isAdmin, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/dashboard" className={styles.brand}>
          iVenture Equipment Booking
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/equipment">Equipment</NavLink>
          <NavLink href="/reservations">{isAdmin ? "Reservations" : "My Reservations"}</NavLink>
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
        </nav>

        <div className={styles.userArea}>
          <span className={styles.userName}>{user.name}</span>
          <Badge tone={isAdmin ? "info" : "neutral"}>{user.role}</Badge>
          <button type="button" className={styles.logoutButton} onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
