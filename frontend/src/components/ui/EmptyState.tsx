import styles from "./EmptyState.module.css";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}
