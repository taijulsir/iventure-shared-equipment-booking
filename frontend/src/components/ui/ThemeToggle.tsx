"use client";

import { useTheme } from "@/lib/theme/ThemeContext";
import { IconSun, IconMoon } from "./Icons";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={[
        "inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-surface-muted border border-border text-foreground-secondary cursor-pointer transition-all duration-150 hover:bg-surface-elevated hover:border-border-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
    </button>
  );
}
