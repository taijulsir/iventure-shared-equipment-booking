import type { BadgeTone } from "@/components/ui/Badge";
import type { Role } from "@/types/user";

/** Mirrors the tone used for the current user's own role badge in the
 * Sidebar (components/layout/Sidebar.tsx) — kept as one shared mapping so
 * the two places a role is displayed as a badge never drift apart. */
export function roleTone(role: Role): BadgeTone {
  switch (role) {
    case "SUPERADMIN":
      return "warning";
    case "ADMIN":
      return "info";
    case "EMPLOYEE":
      return "neutral";
  }
}
