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

export default async function Home() {
  const user = await getServerSession();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Public Navigation */}
      <header className="h-[72px] max-w-[1200px] w-full mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center no-underline">
          <BrandLogo height={40} priority />
        </Link>

        <div className="flex items-center gap-3">
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
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 py-8 sm:px-6 sm:py-12 flex flex-col items-center text-center">
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-subtle border border-border-accent text-primary text-[0.8125rem] font-semibold">
            <IconSparkles size={14} />
            <span>Modern Enterprise Equipment Management</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-[2.75rem] font-extrabold text-foreground tracking-[-0.03em] leading-[1.15] max-w-[22ch] mb-5">
          Seamless shared equipment booking for{" "}
          <span className="text-primary">every team</span>
        </h1>

        <p className="text-base sm:text-lg text-foreground-secondary leading-[1.6] max-w-[54ch] mb-8">
          Discover available laptops, high-end cameras, projectors, and testing hardware.
          Reserve with conflict-free scheduling and automated approval workflows.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap mb-12">
          <Button href="/register" variant="primary" size="lg">
            <span>Create account</span>
            <IconArrowRight size={18} />
          </Button>
          <Button href="/login" variant="secondary" size="lg">
            Sign in to dashboard
          </Button>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-6">
          <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 text-left flex flex-col gap-3 shadow-xs transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5">
            <div className="w-[42px] h-[42px] rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center">
              <IconEquipment size={22} />
            </div>
            <h2 className="text-base font-semibold text-foreground">Real-time Catalogue</h2>
            <p className="text-sm text-foreground-muted leading-[1.5]">
              Browse all shared company equipment with clear specifications, descriptions, and approval requirements.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 text-left flex flex-col gap-3 shadow-xs transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5">
            <div className="w-[42px] h-[42px] rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center">
              <IconCalendar size={22} />
            </div>
            <h2 className="text-base font-semibold text-foreground">Conflict-free Reservations</h2>
            <p className="text-sm text-foreground-muted leading-[1.5]">
              Reserve assets across precise UTC timelines with automated overlap validation and active booking tracking.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 text-left flex flex-col gap-3 shadow-xs transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5">
            <div className="w-[42px] h-[42px] rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center">
              <IconShield size={22} />
            </div>
            <h2 className="text-base font-semibold text-foreground">Role-based Governance</h2>
            <p className="text-sm text-foreground-muted leading-[1.5]">
              Instant bookings for standard equipment alongside manager approval flows for high-demand assets.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border p-6 text-center text-[0.8125rem] text-foreground-muted">
        <p>&copy; {new Date().getFullYear()} iVenture Shared Equipment Booking. Enterprise Asset Hub.</p>
      </footer>
    </div>
  );
}
