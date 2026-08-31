import type { Equipment } from "@/types/equipment";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconEquipment } from "@/components/ui/Icons";
import styles from "./EquipmentTable.module.css";

export function EquipmentTable({ equipment }: { equipment: Equipment[] }) {
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
            </tr>
          </thead>
          <tbody>
            {equipment.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className={styles.nameCell}>
                    <div className={styles.itemIconBox}>
                      <IconEquipment size={18} />
                    </div>
                    <span className={styles.itemName}>{item.name}</span>
                  </div>
                </td>
                <td className={styles.description}>{item.description || "—"}</td>
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
      </div>

      {/* Mobile Card List */}
      <div className={styles.mobileCardList}>
        {equipment.map((item) => (
          <div key={item.id} className={styles.mobileCard}>
            <div className={styles.mobileCardHeader}>
              <div className={styles.nameCell}>
                <div className={styles.itemIconBox}>
                  <IconEquipment size={18} />
                </div>
                <span className={styles.itemName}>{item.name}</span>
              </div>
              {item.requiresApproval ? (
                <Badge tone="warning">Approval</Badge>
              ) : (
                <Badge tone="success">Instant</Badge>
              )}
            </div>
            <p className={styles.description}>{item.description || "No description provided."}</p>
          </div>
        ))}
      </div>
    </>
  );
}
