import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { IconArrowRight } from "@/components/ui/Icons";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background text-center">
      <div className="px-4 py-2 rounded-[var(--radius-lg)] bg-surface-subtle border border-border-accent flex items-center justify-center mb-6">
        <BrandLogo height={40} />
      </div>

      <span className="text-sm font-bold text-primary tracking-[0.05em] uppercase mb-2">
        404 Error
      </span>

      <h1 className="text-[2rem] font-extrabold text-foreground tracking-[-0.02em] mb-3">
        Page Not Found
      </h1>

      <p className="text-[0.9375rem] text-foreground-muted max-w-[42ch] leading-[1.5] mb-8">
        The page you are looking for does not exist or may have been moved.
      </p>

      <Button href="/" variant="primary" size="lg">
        <span>Return to Dashboard</span>
        <IconArrowRight size={18} />
      </Button>
    </div>
  );
}
