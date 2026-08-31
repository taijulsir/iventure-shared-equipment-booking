import type { BadgeTone } from "@/components/ui/Badge";
import type { ReservationStatus } from "@/types/reservation";

/** Slot-blocking rule (docs/decisions.md): PENDING/CONFIRMED are "active"
 * (shown as info/success), REJECTED/CANCELLED are terminal (neutral/danger). */
export function statusTone(status: ReservationStatus): BadgeTone {
  switch (status) {
    case "PENDING":
      return "warning";
    case "CONFIRMED":
      return "success";
    case "REJECTED":
      return "danger";
    case "CANCELLED":
      return "neutral";
  }
}
