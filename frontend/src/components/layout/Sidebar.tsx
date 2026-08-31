"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { roleTone } from "@/features/users/roleTone";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  IconDashboard,
  IconEquipment,
  IconCalendar,
  IconShield,
  IconUser,
  IconLogOut,
} from "@/components/ui/Icons";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  const isLinkActive = (href: string) => {
    // Exact-match only for routes that now have their own nested child
    // route (e.g. /admin/users under /admin) — otherwise the parent link
    // would also render as "active" while on the child page.
    if (href === "/dashboard" || href === "/admin") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={[styles.mobileBackdrop, isOpen ? styles.backdropVisible : ""].filter(Boolean).join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={[styles.sidebar, isOpen ? styles.sidebarOpen : ""].filter(Boolean).join(" ")}
        aria-label="Application Navigation"
      >
        {/* Brand identity */}
        <Link href="/dashboard" className={styles.brand} onClick={onClose}>
          <BrandLogo height={38} priority />
        </Link>




        {/* Navigation items */}
        <nav className={styles.navSection}>
          <span className={styles.navSectionLabel}>Overview</span>

          <Link
            href="/dashboard"
            className={[styles.navLink, isLinkActive("/dashboard") ? styles.navLinkActive : ""].filter(Boolean).join(" ")}
            onClick={onClose}
          >
            <span className={styles.navIcon}>
              <IconDashboard size={18} />
            </span>
            Dashboard
          </Link>

          <Link
            href="/equipment"
            className={[styles.navLink, isLinkActive("/equipment") ? styles.navLinkActive : ""].filter(Boolean).join(" ")}
            onClick={onClose}
          >
            <span className={styles.navIcon}>
              <IconEquipment size={18} />
            </span>
            Equipment Catalogue
          </Link>

          <Link
            href="/reservations"
            className={[styles.navLink, isLinkActive("/reservations") ? styles.navLinkActive : ""].filter(Boolean).join(" ")}
            onClick={onClose}
          >
            <span className={styles.navIcon}>
              <IconCalendar size={18} />
            </span>
            {isAdmin ? "All Reservations" : "My Reservations"}
          </Link>

          {isAdmin && (
            <>
              <span className={styles.navSectionLabel} style={{ marginTop: "12px" }}>
                Management
              </span>
              <Link
                href="/admin"
                className={[styles.navLink, isLinkActive("/admin") ? styles.navLinkActive : ""].filter(Boolean).join(" ")}
                onClick={onClose}
              >
                <span className={styles.navIcon}>
                  <IconShield size={18} />
                </span>
                Admin Console
              </Link>

              {isSuperAdmin && (
                <Link
                  href="/admin/users"
                  className={[styles.navLink, isLinkActive("/admin/users") ? styles.navLinkActive : ""].filter(Boolean).join(" ")}
                  onClick={onClose}
                >
                  <span className={styles.navIcon}>
                    <IconUser size={18} />
                  </span>
                  User Management
                </Link>
              )}
            </>
          )}
        </nav>

        {/* User Account & Controls Footer */}
        <div className={styles.userFooter}>
          <div className={styles.userCard}>
            <Avatar name={user.name} size="md" isAdmin={isAdmin} />
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.name}</span>
              <div className={styles.userMeta}>
                <Badge tone={roleTone(user.role)} showDot={false}>
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>

          <div className={styles.footerControls}>
            <button
              type="button"
              className={styles.signOutButton}
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Sign out of account"
            >
              <IconLogOut size={16} />
              <span>{isLoggingOut ? "Signing out…" : "Sign out"}</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
