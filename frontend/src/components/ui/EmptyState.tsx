import type { ReactNode } from "react";
import { IconLayers } from "./Icons";
import styles from "./EmptyState.module.css";

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
    <div className={[styles.emptyState, className].filter(Boolean).join(" ")}>
      <div className={styles.iconContainer} aria-hidden="true">
        {icon ?? <IconLayers size={24} />}
      </div>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.actionArea}>{action}</div>}
    </div>
  );
}
