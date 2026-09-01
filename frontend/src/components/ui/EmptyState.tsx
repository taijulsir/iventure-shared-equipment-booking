import type { ReactNode } from "react";
import { IconLayers } from "./Icons";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["flex flex-col items-center justify-center text-center py-10 px-6 text-foreground-muted", className].filter(Boolean).join(" ")}>
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-muted border border-border text-foreground-secondary mb-4" aria-hidden="true">
        {icon ?? <IconLayers size={24} />}
      </div>
      <p className="text-base font-semibold text-foreground mb-1">{title}</p>
      {description && <p className="text-sm text-foreground-muted max-w-[42ch] leading-[1.4] mb-4">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
