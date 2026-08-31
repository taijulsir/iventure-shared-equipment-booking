import type { Equipment } from "@/types/equipment";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import styles from "./EquipmentTable.module.css";

/**
 * Read-only catalogue table — no create/edit/delete actions. Equipment
 * management is Admin-only backend functionality (POST/PATCH/DELETE
 * /equipment) that belongs to a dedicated Equipment feature phase, not this
 * foundation.
 */
export function EquipmentTable({ equipment }: { equipment: Equipment[] }) {
  if (equipment.length === 0) {
    return (
      <EmptyState
        title="No equipment yet"
        description="Once an administrator adds equipment, it will show up here."
      />
    );
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Approval</th>
        </tr>
      </thead>
      <tbody>
        {equipment.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td className={styles.description}>{item.description ?? "—"}</td>
            <td>
              {item.requiresApproval ? (
                <Badge tone="warning">Requires approval</Badge>
              ) : (
                <Badge tone="success">Instant booking</Badge>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
