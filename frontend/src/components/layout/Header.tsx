"use client";

import { usePathname } from "next/navigation";
import { IconMenu, IconChevronRight } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import styles from "./Header.module.css";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();

  const getRouteLabel = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.startsWith("/equipment")) return "Equipment Catalogue";
    if (pathname.startsWith("/reservations")) return "Reservations";
    if (pathname.startsWith("/admin/users")) return "User Management";
    if (pathname.startsWith("/admin")) return "Admin Console";
    return "Application";
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftArea}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
        >
          <IconMenu size={20} />
        </button>

        <div className={styles.breadcrumb}>
          <span>iVenture</span>
          <IconChevronRight size={14} style={{ opacity: 0.6 }} />
          <span className={styles.currentRoute}>{getRouteLabel()}</span>
        </div>
      </div>

      <div className={styles.rightArea}>
        <ThemeToggle />
      </div>
    </header>
  );
}
