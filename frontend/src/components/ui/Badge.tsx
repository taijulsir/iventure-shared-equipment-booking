import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

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
  return (
    <span className={[styles.badge, styles[tone], className].filter(Boolean).join(" ")}>
      {showDot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
