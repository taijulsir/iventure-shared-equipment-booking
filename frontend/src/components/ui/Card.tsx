import type { HTMLAttributes } from "react";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive" | "accent";
}

export function Card({ variant = "default", className, ...rest }: CardProps) {
  const classNames = [styles.card, variant !== "default" ? styles[variant] : "", className]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames} {...rest} />;
}
