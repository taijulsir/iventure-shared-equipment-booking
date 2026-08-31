import styles from "./Spinner.module.css";

export function Spinner({
  size = "md",
  label = "Loading",
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  return <span className={`${styles.spinner} ${styles[size]}`} role="status" aria-label={label} />;
}
