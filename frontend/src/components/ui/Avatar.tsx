import styles from "./Avatar.module.css";

export function Avatar({
  name,
  size = "md",
  isAdmin = false,
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  isAdmin?: boolean;
  className?: string;
}) {
  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div
      className={[
        styles.avatar,
        styles[size],
        isAdmin ? styles.adminRing : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  );
}
