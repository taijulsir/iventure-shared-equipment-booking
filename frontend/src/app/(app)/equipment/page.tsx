import { getRequestCookieHeader } from "@/lib/api/server-session";
import { listEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Equipment } from "@/types/equipment";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EquipmentTable } from "@/features/equipment/EquipmentTable";
import styles from "./page.module.css";

export default async function EquipmentPage() {
  const cookieHeader = await getRequestCookieHeader();

  let equipment: Equipment[] | null = null;
  let errorMessage: string | null = null;

  try {
    const page = await listEquipment(undefined, cookieHeader);
    equipment = page.data;
  } catch (error) {
    errorMessage =
      error instanceof ApiError ? error.message : "Something went wrong loading the equipment list.";
  }

  const count = equipment ? equipment.length : 0;

  return (
    <div className={styles.page}>
      <PageHeader
        title="Equipment Catalogue"
        subtitle="Browse shared enterprise equipment, review specifications, and check booking policies."
        badge={
          equipment && (
            <Badge tone="neutral" showDot={false}>
              {count} {count === 1 ? "Item" : "Items"}
            </Badge>
          )
        }
      />

      {errorMessage ? (
        <Alert variant="error" title="Failed to load equipment">
          {errorMessage}
        </Alert>
      ) : (
        <div className={styles.tableCard}>
          <EquipmentTable equipment={equipment ?? []} />
        </div>
      )}
    </div>
  );
}
