import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Spinner } from "./Spinner";

type BaseButtonProps = {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
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

const variantClasses = {
  primary: "bg-primary text-primary-contrast shadow-xs hover:bg-primary-hover hover:shadow-emerald active:bg-primary-active",
  secondary: "bg-surface text-foreground border-border shadow-xs hover:bg-surface-muted hover:border-border-hover",
  outline: "bg-transparent text-primary border-border-accent hover:bg-primary-subtle hover:border-primary",
  ghost: "bg-transparent text-foreground-secondary border-transparent hover:bg-surface-muted hover:text-foreground",
  danger: "bg-danger text-white hover:opacity-90 hover:shadow-[0_4px_12px_rgba(220,38,38,0.25)]",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-[0.8125rem] rounded-[var(--radius-sm)]",
  md: "px-4 py-[9px] text-sm rounded-[var(--radius-md)]",
  lg: "px-6 py-3 text-base rounded-[var(--radius-lg)]",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  disabled,
  className,
  children,
  href,
  ...rest
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 border border-transparent font-medium leading-5 cursor-pointer whitespace-nowrap select-none no-underline transition-all duration-150 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2";

  const classNames = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ]
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
