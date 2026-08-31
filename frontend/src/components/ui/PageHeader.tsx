import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

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
    <div className={[styles.header, className].filter(Boolean).join(" ")}>
      <div className={styles.textGroup}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {badge}
        </div>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.actionGroup}>{action}</div>}
    </div>
  );
}
