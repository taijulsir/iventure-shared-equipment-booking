import { getRequestCookieHeader } from "@/lib/api/server-session";
import { listEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Equipment } from "@/types/equipment";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
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

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Equipment</h1>
      {errorMessage ? (
        <Alert variant="error">{errorMessage}</Alert>
      ) : (
        <Card>
          <EquipmentTable equipment={equipment ?? []} />
        </Card>
      )}
    </div>
  );
}
