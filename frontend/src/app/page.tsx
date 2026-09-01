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
    <div className="min-h-screen flex flex-col justify-between bg-background">
      {/* Public Navigation */}
      <header className="h-16 max-w-[1200px] w-full mx-auto px-4 sm:px-6 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center no-underline">
          <BrandLogo height={38} priority />
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button href="/login" variant="ghost" size="sm">
            Sign in
          </Button>
          <Button href="/register" variant="primary" size="sm">
            <span className="text-white">Get started</span>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 py-4 sm:px-6 sm:py-6 flex flex-col items-center justify-center text-center">
        <div className="mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle border border-border-accent text-primary text-xs sm:text-[0.8125rem] font-semibold">
            <IconSparkles size={14} />
            <span>Modern Enterprise Equipment Management</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-foreground tracking-[-0.03em] leading-[1.15] max-w-[22ch] mb-3">
          Seamless shared equipment booking for{" "}
          <span className="text-primary">every team</span>
        </h1>

        <p className="text-sm sm:text-base text-foreground-secondary leading-[1.5] max-w-[54ch] mb-5">
          Discover available laptops, high-end cameras, projectors, and testing hardware.
          Reserve with conflict-free scheduling and automated approval workflows.
        </p>

        <div className="flex items-center justify-center gap-3.5 flex-wrap mb-6 sm:mb-8">
          <Button href="/register" variant="primary" size="md">
            <span className="text-white">Create account</span>
            <IconArrowRight className="text-white" size={16} />
          </Button>
          <Button href="/login" variant="secondary" size="md" className="border border-border dark:border-[#364940] hover:dark:border-border-hover">
            Sign in to dashboard
          </Button>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full">
          <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-4 sm:p-5 text-left flex flex-col gap-2.5 shadow-xs transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
              <IconEquipment size={20} />
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Real-time Catalogue</h2>
            <p className="text-xs sm:text-sm text-foreground-muted leading-[1.45]">
              Browse shared company equipment with clear specifications, descriptions, and approval requirements.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-4 sm:p-5 text-left flex flex-col gap-2.5 shadow-xs transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
              <IconCalendar size={20} />
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Conflict-free Reservations</h2>
            <p className="text-xs sm:text-sm text-foreground-muted leading-[1.45]">
              Reserve assets across precise UTC timelines with automated overlap validation and active booking tracking.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-4 sm:p-5 text-left flex flex-col gap-2.5 shadow-xs transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
              <IconShield size={20} />
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Role-based Governance</h2>
            <p className="text-xs sm:text-sm text-foreground-muted leading-[1.45]">
              Instant bookings for standard equipment alongside manager approval flows for high-demand assets.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-3 px-6 text-center text-xs text-foreground-muted shrink-0">
        <p>&copy; {new Date().getFullYear()} iVenture Shared Equipment Booking. Enterprise Asset Hub.</p>
      </footer>
    </div>
  );
}
