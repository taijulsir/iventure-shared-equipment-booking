import Link from "next/link";
import type { Equipment } from "@/types/equipment";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconEquipment } from "@/components/ui/Icons";
import styles from "./EquipmentTable.module.css";

/** `showBookAction` is only true for Employees viewing the catalogue — the
 * backend rejects an Admin/SuperAdmin reservation attempt anyway, so the
 * button simply isn't rendered for them ("do not display actions the
 * backend will reject"). */
export function EquipmentTable({
  equipment,
  showBookAction = false,
}: {
  equipment: Equipment[];
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
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Equipment Item</th>
              <th>Description</th>
              <th>Booking Policy</th>
              {showBookAction && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {equipment.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/equipment/${item.id}`} className={styles.nameCell}>
                    <div className={styles.itemIconBox}>
                      <IconEquipment size={18} />
                    </div>
                    <span className={styles.itemName}>{item.name}</span>
                  </Link>
                </td>
                <td className={styles.description}>{item.description || "—"}</td>
                <td>
                  {item.requiresApproval ? (
                    <Badge tone="warning">Requires approval</Badge>
                  ) : (
                    <Badge tone="success">Instant booking</Badge>
                  )}
                </td>
                {showBookAction && (
                  <td>
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
      <div className={styles.mobileCardList}>
        {equipment.map((item) => (
          <div key={item.id} className={styles.mobileCard}>
            <div className={styles.mobileCardHeader}>
              <Link href={`/equipment/${item.id}`} className={styles.nameCell}>
                <div className={styles.itemIconBox}>
                  <IconEquipment size={18} />
                </div>
                <span className={styles.itemName}>{item.name}</span>
              </Link>
              {item.requiresApproval ? (
                <Badge tone="warning">Approval</Badge>
              ) : (
                <Badge tone="success">Instant</Badge>
              )}
            </div>
            <p className={styles.description}>{item.description || "No description provided."}</p>
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
