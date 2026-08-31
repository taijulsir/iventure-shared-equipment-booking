import type { HTMLAttributes } from "react";
import styles from "./Skeleton.module.css";

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
      className={[styles.skeleton, className].filter(Boolean).join(" ")}
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
