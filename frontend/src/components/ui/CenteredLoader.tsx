import { BrandLogo } from "./BrandLogo";

export function CenteredLoader({
  title = "Loading data...",
  subtitle,
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={["flex flex-col items-center justify-center min-h-[380px] w-full p-8 text-center", className]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-16 h-16 flex items-center justify-center mb-4">
        <div
          className="absolute inset-0 rounded-full border-[3px] border-primary-subtle border-t-primary animate-spin"
          aria-hidden="true"
        />
        <div
          className="w-9 h-9 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center animate-pulse"
          aria-hidden="true"
        >
          <BrandLogo height={24} width={24} />
        </div>
      </div>

      <p className="text-[0.9375rem] font-semibold text-foreground mb-0.5">{title}</p>
      {subtitle && <p className="text-[0.8125rem] text-foreground-muted">{subtitle}</p>}
    </div>
  );
}
