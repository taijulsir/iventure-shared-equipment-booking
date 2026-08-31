"use client";

import { useTheme } from "@/lib/theme/ThemeContext";
import { IconSun, IconMoon } from "./Icons";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={[styles.toggleButton, className].filter(Boolean).join(" ")}
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
    </button>
  );
}
