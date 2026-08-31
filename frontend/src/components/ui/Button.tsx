import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import styles from "./Button.module.css";
import { Spinner } from "./Spinner";

type BaseButtonProps = {
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
};

export type ButtonProps =
  | (BaseButtonProps &
      Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> & {
        href?: undefined;
      })
  | (BaseButtonProps &
      Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
        href: string;
      });


export function Button({
  variant = "primary",
  fullWidth = false,
  isLoading = false,
  disabled,
  className,
  children,
  href,
  ...rest
}: ButtonProps) {
  const classNames = [styles.button, styles[variant], fullWidth ? styles.fullWidth : "", className]
    .filter(Boolean)
    .join(" ");

  if (href) {
    const anchorProps = rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;
    return (
      <Link href={href} className={classNames} {...anchorProps}>
        {isLoading && <Spinner size="sm" />}
        {children}
      </Link>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classNames} disabled={disabled || isLoading} {...buttonProps}>
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

