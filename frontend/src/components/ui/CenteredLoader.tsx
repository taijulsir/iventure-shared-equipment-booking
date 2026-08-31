import { IconBrandLogo } from "./Icons";
import styles from "./CenteredLoader.module.css";

export function CenteredLoader({
  title = "Loading data...",
  subtitle,
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={[styles.container, className].filter(Boolean).join(" ")} role="status" aria-live="polite">
      <div className={styles.loaderWrapper}>
        <div className={styles.pulsingRing} aria-hidden="true" />
        <div className={styles.innerCore} aria-hidden="true">
          <IconBrandLogo size={20} />
        </div>
      </div>
      <p className={styles.title}>{title}</p>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
