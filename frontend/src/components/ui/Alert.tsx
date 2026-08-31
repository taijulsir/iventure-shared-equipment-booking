import type { ReactNode } from "react";
import styles from "./Alert.module.css";

export function Alert({
  variant = "info",
  children,
}: {
  variant?: "error" | "success" | "info";
  children: ReactNode;
}) {
  return (
    <div className={`${styles.alert} ${styles[variant]}`} role={variant === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
