import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  IconEquipment,
  IconCalendar,
  IconShield,
  IconSparkles,
  IconArrowRight,
} from "@/components/ui/Icons";
import styles from "./page.module.css";

export default async function Home() {
  const user = await getServerSession();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className={styles.landingContainer}>
      {/* Public Navigation */}
      <header className={styles.publicNav}>
        <Link href="/" className={styles.brand}>
          <BrandLogo height={40} priority />
        </Link>




        <div className={styles.navActions}>
          <ThemeToggle />
          <Button href="/login" variant="ghost" size="sm">
            Sign in
          </Button>
          <Button href="/register" variant="primary" size="sm">
            Get started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.badgeWrapper}>
          <div className={styles.heroBadge}>
            <IconSparkles size={14} />
            <span>Modern Enterprise Equipment Management</span>
          </div>
        </div>

        <h1 className={styles.heroTitle}>
          Seamless shared equipment booking for{" "}
          <span className={styles.heroTitleHighlight}>every team</span>
        </h1>

        <p className={styles.subtitle || styles.heroSubtitle}>
          Discover available laptops, high-end cameras, projectors, and testing hardware.
          Reserve with conflict-free scheduling and automated approval workflows.
        </p>

        <div className={styles.heroActions}>
          <Button href="/register" variant="primary" size="lg">
            <span>Create account</span>
            <IconArrowRight size={18} />
          </Button>
          <Button href="/login" variant="secondary" size="lg">
            Sign in to dashboard
          </Button>
        </div>

        {/* Feature Preview Cards */}
        <div className={styles.grid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconBox}>
              <IconEquipment size={22} />
            </div>
            <h2 className={styles.featureTitle}>Real-time Catalogue</h2>
            <p className={styles.featureDescription}>
              Browse all shared company equipment with clear specifications, descriptions, and approval requirements.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconBox}>
              <IconCalendar size={22} />
            </div>
            <h2 className={styles.featureTitle}>Conflict-free Reservations</h2>
            <p className={styles.featureDescription}>
              Reserve assets across precise UTC timelines with automated overlap validation and active booking tracking.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconBox}>
              <IconShield size={22} />
            </div>
            <h2 className={styles.featureTitle}>Role-based Governance</h2>
            <p className={styles.featureDescription}>
              Instant bookings for standard equipment alongside manager approval flows for high-demand assets.
            </p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} iVenture Shared Equipment Booking. Enterprise Asset Hub.</p>
      </footer>
    </div>
  );
}
