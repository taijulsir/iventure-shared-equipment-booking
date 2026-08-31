import type { ReactNode } from "react";
import { IconAlertCircle, IconCheck, IconInfo } from "./Icons";
import styles from "./Alert.module.css";

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: "error" | "success" | "warning" | "info";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const getIcon = () => {
    switch (variant) {
      case "error":
        return <IconAlertCircle size={18} />;
      case "warning":
        return <IconAlertCircle size={18} />;
      case "success":
        return <IconCheck size={18} />;
      case "info":
      default:
        return <IconInfo size={18} />;
    }
  };

  return (
    <div
      className={[styles.alert, styles[variant], className].filter(Boolean).join(" ")}
      role={variant === "error" ? "alert" : "status"}
    >
      <span className={styles.iconWrapper} aria-hidden="true">
        {getIcon()}
      </span>
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
