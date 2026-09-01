"use client";

import { usePathname } from "next/navigation";
import { IconMenu, IconChevronRight } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="hidden max-lg:inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] border border-border bg-surface text-foreground-secondary cursor-pointer transition-all duration-150 hover:bg-surface-muted hover:text-foreground"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
        >
          <IconMenu size={20} />
        </button>

        <div className="flex items-center gap-2 text-sm font-medium text-foreground-muted">
          <span>iVenture</span>
          <IconChevronRight size={14} style={{ opacity: 0.6 }} />
          <span className="text-foreground font-semibold">{getRouteLabel()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
