import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";
import { Spinner } from "./Spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  isLoading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classNames = [styles.button, styles[variant], fullWidth ? styles.fullWidth : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classNames} disabled={disabled || isLoading} {...rest}>
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
