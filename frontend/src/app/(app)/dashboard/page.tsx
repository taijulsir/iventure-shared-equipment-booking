"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  IconEquipment,
  IconCalendar,
  IconShield,
  IconUser,
  IconChevronRight,
  IconSparkles,
  IconClock,
  IconCheck,
} from "@/components/ui/Icons";

export default function DashboardPage() {
  const { user, isAdmin, isSuperAdmin } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Hero Banner */}
      <section className="bg-gradient-to-br from-surface to-surface-subtle border border-border-accent rounded-[var(--radius-xl)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 mb-2">
            <Badge tone={isSuperAdmin ? "warning" : isAdmin ? "info" : "success"}>
              {isSuperAdmin ? "SuperAdmin Session" : isAdmin ? "Administrator Session" : "Employee Portal"}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-[1.75rem] font-extrabold text-foreground tracking-[-0.03em] leading-[1.2]">
            Welcome back, <span className="text-primary">{user.name}</span>
          </h1>

          <p className="text-[0.9375rem] text-foreground-secondary leading-[1.5] max-w-[50ch]">
            {isSuperAdmin
              ? "You have full SuperAdmin access, including managing Employee and Administrator role assignments."
              : isAdmin
                ? "You have full administrator access to company assets, approval requests, and reservation overviews."
                : "Search available equipment, create new bookings, and track your active reservations."}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <Button href="/equipment" variant="primary" size="md">
            <span className="text-white">Browse catalogue</span>
            <IconChevronRight className="text-white" size={16} />
          </Button>
          <Button href="/reservations" variant="secondary" size="md">
            {isAdmin ? "All Reservations" : "My Bookings"}
          </Button>
        </div>
      </section>

      {/* Quick Navigation Hub */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground tracking-[-0.01em]">Resource Center</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link
            href="/equipment"
            className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 flex flex-col justify-between gap-5 no-underline shadow-xs transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
                <IconEquipment size={24} />
              </div>
              <Badge tone="success" showDot={false}>
                Catalogue
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-[1.0625rem] font-semibold text-foreground group-hover:text-primary transition-colors duration-150">
                Equipment Catalogue
              </h3>
              <p className="text-sm text-foreground-muted leading-[1.45]">
                Browse available laptops, audiovisual gear, cameras, and hardware kits.
              </p>
            </div>

            <div className="flex items-center gap-1 text-[0.8125rem] font-semibold text-primary mt-auto">
              <span>View items</span>
              <IconChevronRight size={16} />
            </div>
          </Link>

          <Link
            href="/reservations"
            className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 flex flex-col justify-between gap-5 no-underline shadow-xs transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
                <IconCalendar size={24} />
              </div>
              <Badge tone="info" showDot={false}>
                Bookings
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-[1.0625rem] font-semibold text-foreground group-hover:text-primary transition-colors duration-150">
                {isAdmin ? "Global Reservations" : "My Reservations"}
              </h3>
              <p className="text-sm text-foreground-muted leading-[1.45]">
                {isAdmin
                  ? "Monitor all company equipment reservations and approval statuses across employees."
                  : "View your current, upcoming, and past equipment reservation schedules."}
              </p>
            </div>

            <div className="flex items-center gap-1 text-[0.8125rem] font-semibold text-primary mt-auto">
              <span>View schedule</span>
              <IconChevronRight size={16} />
            </div>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 flex flex-col justify-between gap-5 no-underline shadow-xs transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
                  <IconShield size={24} />
                </div>
                <Badge tone="warning" showDot={false}>
                  Admin
                </Badge>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-[1.0625rem] font-semibold text-foreground group-hover:text-primary transition-colors duration-150">
                  Admin Console
                </h3>
                <p className="text-sm text-foreground-muted leading-[1.45]">
                  Equipment inventory controls and pending reservation review workflows.
                </p>
              </div>

              <div className="flex items-center gap-1 text-[0.8125rem] font-semibold text-primary mt-auto">
                <span>Manage operations</span>
                <IconChevronRight size={16} />
              </div>
            </Link>
          )}

          {isSuperAdmin && (
            <Link
              href="/admin/users"
              className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 flex flex-col justify-between gap-5 no-underline shadow-xs transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
                  <IconUser size={24} />
                </div>
                <Badge tone="warning" showDot={false}>
                  SuperAdmin
                </Badge>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-[1.0625rem] font-semibold text-foreground group-hover:text-primary transition-colors duration-150">
                  User Management
                </h3>
                <p className="text-sm text-foreground-muted leading-[1.45]">
                  Review every account and promote or demote Employee/Administrator roles.
                </p>
              </div>

              <div className="flex items-center gap-1 text-[0.8125rem] font-semibold text-primary mt-auto">
                <span>Manage users</span>
                <IconChevronRight size={16} />
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Booking Guidelines & Policy Reference */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground tracking-[-0.01em]">Booking Rules & Guidelines</h2>
        </div>

        <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-surface-muted">
              <div className="text-primary mt-0.5 shrink-0">
                <IconSparkles size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">Instant vs Approval</span>
                <span className="text-[0.8125rem] text-foreground-muted leading-[1.4]">
                  Items marked Instant are confirmed immediately. High-tier equipment requires administrator sign-off.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-surface-muted">
              <div className="text-primary mt-0.5 shrink-0">
                <IconClock size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">UTC Timelines</span>
                <span className="text-[0.8125rem] text-foreground-muted leading-[1.4]">
                  All reservation start and end times are recorded in standard UTC to eliminate timezone ambiguity.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-surface-muted">
              <div className="text-primary mt-0.5 shrink-0">
                <IconCheck size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">Return Responsibility</span>
                <span className="text-[0.8125rem] text-foreground-muted leading-[1.4]">
                  Please ensure items are inspected and returned on time so subsequent bookings proceed without delay.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
