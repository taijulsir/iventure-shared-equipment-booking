import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession, getRequestCookieHeader } from "@/lib/api/server-session";
import { getEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Equipment } from "@/types/equipment";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconArrowRight, IconEquipment } from "@/components/ui/Icons";
import { formatUtc } from "@/lib/format";
import styles from "./page.module.css";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getServerSession();
  const cookieHeader = await getRequestCookieHeader();
  const isEmployee = user?.role === "EMPLOYEE";

  // See reservations/[id]/page.tsx for why fetching (plain variables only)
  // and JSX construction are kept strictly separate here.
  let equipment: Equipment | null = null;
  let errorMessage: string | null = null;

  try {
    equipment = await getEquipment(id, cookieHeader);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    errorMessage =
      error instanceof ApiError ? error.message : "Something went wrong loading this equipment item.";
  }

  if (errorMessage || !equipment) {
    return (
      <div className={styles.page}>
        <PageHeader title="Equipment" subtitle="Equipment details" />
        <Alert variant="error" title="Failed to load equipment">
          {errorMessage}
        </Alert>
        <Link href="/equipment" className={styles.backLink}>
          <IconArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
          <span>Back to catalogue</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={equipment.name}
        subtitle="Equipment details"
        badge={
          equipment.requiresApproval ? (
            <Badge tone="warning">Requires approval</Badge>
          ) : (
            <Badge tone="success">Instant booking</Badge>
          )
        }
      />

      <Card className={styles.detailCard}>
        <div className={styles.iconBox}>
          <IconEquipment size={28} />
        </div>

        <div>
          <span className={styles.detailLabel}>Description</span>
          <p className={styles.detailValue}>{equipment.description || "No description provided."}</p>
        </div>

        <div>
          <span className={styles.detailLabel}>Added</span>
          <p className={styles.detailValue}>{formatUtc(equipment.createdAt)}</p>
        </div>

        {isEmployee && (
          <Button href={`/reservations/new?equipmentId=${equipment.id}`} variant="primary" size="lg" fullWidth>
            Book this equipment
          </Button>
        )}
      </Card>

      <Link href="/equipment" className={styles.backLink}>
        <IconArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
        <span>Back to catalogue</span>
      </Link>
    </div>
  );
}
