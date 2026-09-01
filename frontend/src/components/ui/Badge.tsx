import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, { badge: string; dot: string }> = {
  neutral: {
    badge: "bg-neutral-bg border-neutral-border text-neutral-text",
    dot: "bg-neutral",
  },
  info: {
    badge: "bg-info-bg border-info-border text-info-text",
    dot: "bg-info",
  },
  success: {
    badge: "bg-success-bg border-success-border text-success-text",
    dot: "bg-success",
  },
  warning: {
    badge: "bg-warning-bg border-warning-border text-warning-text",
    dot: "bg-warning",
  },
  danger: {
    badge: "bg-danger-bg border-danger-border text-danger-text",
    dot: "bg-danger",
  },
};

export function Badge({
  tone = "neutral",
  showDot = true,
  className,
  children,
}: {
  tone?: BadgeTone;
  showDot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const currentTone = toneClasses[tone];

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-xs font-medium leading-4 tracking-[0.01em] whitespace-nowrap border",
        currentTone.badge,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showDot && (
        <span
          className={["w-1.5 h-1.5 rounded-full shrink-0", currentTone.dot].join(" ")}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
