import Image from "next/image";
import styles from "./BrandLogo.module.css";

export function BrandLogo({
  height = 38,
  width = 160,
  className,
  priority = false,
}: {
  height?: number;
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={[styles.logoContainer, className].filter(Boolean).join(" ")}>
      {/* Light Mode Logo: Red circle with dark text */}
      <Image
        src="/i-Venture-Logo-light.png"
        alt="iVenture"
        width={width}
        height={height}
        className={[styles.logoImage, styles.logoLight].join(" ")}
        style={{ height: `${height}px`, width: "auto" }}
        priority={priority}
      />
      {/* Dark Mode Logo: Red circle with white text */}
      <Image
        src="/i-Venture-Logo-.png"
        alt="iVenture"
        width={width}
        height={height}
        className={[styles.logoImage, styles.logoDark].join(" ")}
        style={{ height: `${height}px`, width: "auto" }}
        priority={priority}
      />
    </span>
  );
}
