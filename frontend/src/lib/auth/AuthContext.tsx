"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logout as apiLogout } from "@/lib/api/auth";
import type { SafeUser } from "@/types/user";

interface AuthContextValue {
  user: SafeUser;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Hydrates client components with the user already resolved server-side by
 * the (app) layout (see lib/api/server-session.ts) — no duplicate client
 * fetch on first render. This context exists purely for UI convenience
 * (showing the user's name/role, conditionally rendering the Admin nav
 * link); it is not an authorization boundary. Every protected route is
 * guarded server-side regardless of what this context holds, and every
 * mutation is re-checked by the backend regardless of what the UI shows.
 */
export function AuthProvider({
  user,
  children,
}: {
  user: SafeUser;
  children: ReactNode;
}) {
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      router.replace("/login");
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAdmin: user.role === "ADMIN", logout }),
    [user, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
