"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  IconEquipment,
  IconCalendar,
  IconShield,
  IconChevronRight,
  IconSparkles,
  IconClock,
  IconCheck,
} from "@/components/ui/Icons";
import styles from "./page.module.css";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className={styles.page}>
      {/* Welcome Hero Banner */}
      <section className={styles.welcomeHero}>
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeBadge}>
            <Badge tone={isAdmin ? "info" : "success"}>
              {isAdmin ? "Administrator Session" : "Employee Portal"}
            </Badge>
          </div>

          <h1 className={styles.title}>
            Welcome back, <span className={styles.titleName}>{user.name}</span>
          </h1>

          <p className={styles.subtitle}>
            {isAdmin
              ? "You have full administrator access to company assets, approval requests, and reservation overviews."
              : "Search available equipment, create new bookings, and track your active reservations."}
          </p>
        </div>

        <div className={styles.heroActions}>
          <Button href="/equipment" variant="primary" size="md">
            <span>Browse catalogue</span>
            <IconChevronRight size={16} />
          </Button>
          <Button href="/reservations" variant="secondary" size="md">
            {isAdmin ? "All Reservations" : "My Bookings"}
          </Button>
        </div>
      </section>

      {/* Quick Navigation Hub */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Resource Center</h2>
        </div>

        <div className={styles.grid}>
          <Link href="/equipment" className={styles.navCard}>
            <div className={styles.cardTop}>
              <div className={styles.iconBox}>
                <IconEquipment size={24} />
              </div>
              <Badge tone="success" showDot={false}>
                Catalogue
              </Badge>
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>Equipment Catalogue</h3>
              <p className={styles.cardDescription}>
                Browse available laptops, audiovisual gear, cameras, and hardware kits.
              </p>
            </div>

            <div className={styles.cardFooter}>
              <span>View items</span>
              <IconChevronRight size={16} />
            </div>
          </Link>

          <Link href="/reservations" className={styles.navCard}>
            <div className={styles.cardTop}>
              <div className={styles.iconBox}>
                <IconCalendar size={24} />
              </div>
              <Badge tone="info" showDot={false}>
                Bookings
              </Badge>
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>
                {isAdmin ? "Global Reservations" : "My Reservations"}
              </h3>
              <p className={styles.cardDescription}>
                {isAdmin
                  ? "Monitor all company equipment reservations and approval statuses across employees."
                  : "View your current, upcoming, and past equipment reservation schedules."}
              </p>
            </div>

            <div className={styles.cardFooter}>
              <span>View schedule</span>
              <IconChevronRight size={16} />
            </div>
          </Link>

          {isAdmin && (
            <Link href="/admin" className={styles.navCard}>
              <div className={styles.cardTop}>
                <div className={styles.iconBox}>
                  <IconShield size={24} />
                </div>
                <Badge tone="warning" showDot={false}>
                  Admin
                </Badge>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>Admin Console</h3>
                <p className={styles.cardDescription}>
                  Equipment inventory controls and pending reservation review workflows.
                </p>
              </div>

              <div className={styles.cardFooter}>
                <span>Manage operations</span>
                <IconChevronRight size={16} />
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Booking Guidelines & Policy Reference */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Booking Rules & Guidelines</h2>
        </div>

        <div className={styles.guidelinesCard}>
          <div className={styles.guidelinesGrid}>
            <div className={styles.guidelineItem}>
              <div className={styles.guidelineIcon}>
                <IconSparkles size={18} />
              </div>
              <div className={styles.guidelineText}>
                <span className={styles.guidelineTitle}>Instant vs Approval</span>
                <span className={styles.guidelineDesc}>
                  Items marked Instant are confirmed immediately. High-tier equipment requires administrator sign-off.
                </span>
              </div>
            </div>

            <div className={styles.guidelineItem}>
              <div className={styles.guidelineIcon}>
                <IconClock size={18} />
              </div>
              <div className={styles.guidelineText}>
                <span className={styles.guidelineTitle}>UTC Timelines</span>
                <span className={styles.guidelineDesc}>
                  All reservation start and end times are recorded in standard UTC to eliminate timezone ambiguity.
                </span>
              </div>
            </div>

            <div className={styles.guidelineItem}>
              <div className={styles.guidelineIcon}>
                <IconCheck size={18} />
              </div>
              <div className={styles.guidelineText}>
                <span className={styles.guidelineTitle}>Return Responsibility</span>
                <span className={styles.guidelineDesc}>
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
