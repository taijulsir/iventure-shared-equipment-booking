import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius,
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      className={["animate-pulse bg-surface-muted rounded-[var(--radius-sm)]", className].filter(Boolean).join(" ")}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}
