import Link from "next/link";
import type { EquipmentWithAvailability } from "@/types/equipment";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconEquipment } from "@/components/ui/Icons";

/** `available` is `null` unless the list was requested with a startTime/
 * endTime window — nothing renders in that case, so the default catalogue
 * view is unchanged. */
function AvailabilityBadge({ available }: { available: boolean | null }) {
  if (available === null) return null;
  return available ? (
    <Badge tone="success" showDot={false}>Available</Badge>
  ) : (
    <Badge tone="danger" showDot={false}>Booked</Badge>
  );
}

export function EquipmentTable({
  equipment,
  showBookAction = false,
}: {
  equipment: EquipmentWithAvailability[];
  showBookAction?: boolean;
}) {
  if (equipment.length === 0) {
    return (
      <EmptyState
        icon={<IconEquipment size={28} />}
        title="No equipment catalogue entries yet"
        description="Once an administrator provisions inventory items, they will appear here for reservation."
      />
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden sm:block w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border rounded-tl-[var(--radius-md)]">
                Equipment Item
              </th>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border">
                Description
              </th>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border">
                Booking Policy
              </th>
              {showBookAction && (
                <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border rounded-tr-[var(--radius-md)]">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {equipment.map((item) => (
              <tr key={item.id} className="group hover:bg-surface-subtle transition-colors duration-150">
                <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
                  <Link href={`/equipment/${item.id}`} className="flex items-center gap-3 w-fit group/link">
                    <div className="w-9 h-9 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
                      <IconEquipment size={18} />
                    </div>
                    <span className="font-semibold text-foreground group-hover/link:text-primary transition-colors duration-150">
                      {item.name}
                    </span>
                  </Link>
                </td>
                <td className="p-4 border-b border-border text-foreground-secondary align-middle max-w-[48ch] leading-[1.45] group-last:border-b-0">
                  {item.description || "—"}
                </td>
                <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.requiresApproval ? (
                      <Badge tone="warning">Requires approval</Badge>
                    ) : (
                      <Badge tone="success">Instant booking</Badge>
                    )}
                    <AvailabilityBadge available={item.available} />
                  </div>
                </td>
                {showBookAction && (
                  <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
                    <Button href={`/reservations/new?equipmentId=${item.id}`} variant="outline" size="sm">
                      Book
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="sm:hidden flex flex-col gap-4">
        {equipment.map((item) => (
          <div key={item.id} className="bg-surface border border-border rounded-[var(--radius-md)] p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/equipment/${item.id}`} className="flex items-center gap-3 w-fit group/link">
                <div className="w-9 h-9 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
                  <IconEquipment size={18} />
                </div>
                <span className="font-semibold text-foreground group-hover/link:text-primary transition-colors duration-150">
                  {item.name}
                </span>
              </Link>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {item.requiresApproval ? (
                  <Badge tone="warning">Approval</Badge>
                ) : (
                  <Badge tone="success">Instant</Badge>
                )}
                <AvailabilityBadge available={item.available} />
              </div>
            </div>
            <p className="text-sm text-foreground-secondary leading-[1.45]">{item.description || "No description provided."}</p>
            {showBookAction && (
              <Button href={`/reservations/new?equipmentId=${item.id}`} variant="outline" size="sm" fullWidth>
                Book
              </Button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
