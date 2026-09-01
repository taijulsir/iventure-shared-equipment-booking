const sizeClasses = {
  sm: "w-3.5 h-3.5",
  md: "w-6 h-6",
  lg: "w-9 h-9",
};

export function Spinner({
  size = "md",
  label = "Loading",
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  return (
    <span
      className={["inline-block rounded-full border-2 border-current border-r-transparent animate-spin opacity-80", sizeClasses[size]].join(" ")}
      role="status"
      aria-label={label}
    />
  );
}
