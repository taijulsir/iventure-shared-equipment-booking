const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
};

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
        "inline-flex items-center justify-center rounded-full font-semibold text-primary-contrast bg-gradient-to-br from-primary to-primary-hover select-none shrink-0 uppercase tracking-[0.02em]",
        sizeClasses[size],
        isAdmin ? "shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--color-primary)]" : "",
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
