"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "iventure_theme_preference";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Ignore storage read errors
  }
  return "system";
}

function subscribeToThemeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeState, setThemeState] = useState<Theme>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Sync external storage if updated across tabs
  const externalTheme = useSyncExternalStore(
    subscribeToThemeStorage,
    getStoredTheme,
    () => "system" as Theme
  );

  const activeTheme = themeState ?? externalTheme;

  // Apply theme to HTML data-theme attribute
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const isSystemDark = mediaQuery.matches;
      let effectiveTheme: "light" | "dark" = "light";

      if (activeTheme === "system") {
        effectiveTheme = isSystemDark ? "dark" : "light";
        document.documentElement.removeAttribute("data-theme");
      } else {
        effectiveTheme = activeTheme;
        document.documentElement.setAttribute("data-theme", activeTheme);
      }

      setResolvedTheme(effectiveTheme);
    }

    applyTheme();

    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [activeTheme]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore localStorage write errors
    }
  }

  function toggleTheme() {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "system" as Theme,
      resolvedTheme: "light" as "light" | "dark",
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
