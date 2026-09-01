import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive" | "accent";
}

const variantClasses = {
  default: "",
  elevated: "shadow-md border-border-subtle",
  interactive:
    "cursor-pointer hover:border-border-hover hover:shadow-md hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
  accent: "border-border-accent bg-surface-subtle",
};

export function Card({ variant = "default", className, ...rest }: CardProps) {
  const classNames = [
    "bg-surface border border-border rounded-[var(--radius-lg)] p-6 shadow-xs transition-all duration-150",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames} {...rest} />;
}
