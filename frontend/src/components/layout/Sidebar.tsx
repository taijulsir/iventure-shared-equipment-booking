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
    if (href === "/dashboard" || href === "/admin") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinkBase =
    "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 relative";
  const navLinkActive = "bg-primary-subtle text-primary font-semibold";
  const navLinkInactive = "text-foreground-secondary hover:bg-surface-muted hover:text-foreground";

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={[
          "hidden max-lg:block fixed inset-0 bg-black/50 backdrop-blur-[2px] z-35 transition-opacity duration-200 pointer-events-none opacity-0",
          isOpen ? "opacity-100 pointer-events-auto" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={[
          "w-[260px] h-screen sticky top-0 shrink-0 flex flex-col bg-surface border-r border-border p-5 pb-4 z-40 transition-transform duration-200",
          "max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:bottom-0 max-lg:shadow-lg",
          isOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Application Navigation"
      >
        {/* Brand identity */}
        <Link href="/dashboard" className="flex items-center p-2 pb-6 no-underline" onClick={onClose}>
          <BrandLogo height={38} priority />
        </Link>

        {/* Navigation items */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-foreground-muted px-3 pt-3 pb-1">
            Overview
          </span>

          <Link
            href="/dashboard"
            className={[navLinkBase, isLinkActive("/dashboard") ? navLinkActive : navLinkInactive].join(" ")}
            onClick={onClose}
          >
            <span className="flex items-center justify-center text-inherit">
              <IconDashboard size={18} />
            </span>
            Dashboard
          </Link>

          <Link
            href="/equipment"
            className={[navLinkBase, isLinkActive("/equipment") ? navLinkActive : navLinkInactive].join(" ")}
            onClick={onClose}
          >
            <span className="flex items-center justify-center text-inherit">
              <IconEquipment size={18} />
            </span>
            Equipment Catalogue
          </Link>

          <Link
            href="/reservations"
            className={[navLinkBase, isLinkActive("/reservations") ? navLinkActive : navLinkInactive].join(" ")}
            onClick={onClose}
          >
            <span className="flex items-center justify-center text-inherit">
              <IconCalendar size={18} />
            </span>
            {isAdmin ? "All Reservations" : "My Reservations"}
          </Link>

          {isAdmin && (
            <>
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-foreground-muted px-3 pt-3 pb-1 mt-3">
                Management
              </span>
              <Link
                href="/admin"
                className={[navLinkBase, isLinkActive("/admin") ? navLinkActive : navLinkInactive].join(" ")}
                onClick={onClose}
              >
                <span className="flex items-center justify-center text-inherit">
                  <IconShield size={18} />
                </span>
                Admin Console
              </Link>

              {isSuperAdmin && (
                <Link
                  href="/admin/users"
                  className={[navLinkBase, isLinkActive("/admin/users") ? navLinkActive : navLinkInactive].join(" ")}
                  onClick={onClose}
                >
                  <span className="flex items-center justify-center text-inherit">
                    <IconUser size={18} />
                  </span>
                  User Management
                </Link>
              )}
            </>
          )}
        </nav>

        {/* User Account & Controls Footer */}
        <div className="flex flex-col gap-3 pt-4 border-t border-border mt-auto shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-[var(--radius-md)]">
            <Avatar name={user.name} size="md" isAdmin={isAdmin} />
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-sm font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                {user.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge tone={roleTone(user.role)} showDot={false}>
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-border bg-surface text-foreground-secondary text-[0.8125rem] font-medium cursor-pointer transition-all duration-150 hover:not-disabled:bg-danger-bg hover:not-disabled:border-danger-border hover:not-disabled:text-danger disabled:opacity-60 disabled:cursor-not-allowed"
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
