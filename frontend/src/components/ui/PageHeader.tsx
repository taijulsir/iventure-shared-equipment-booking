import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  badge,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6", className].filter(Boolean).join(" ")}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground tracking-[-0.02em] leading-[1.25]">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-[0.9375rem] text-foreground-muted leading-[1.4] max-w-[60ch]">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
