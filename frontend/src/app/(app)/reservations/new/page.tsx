import { getRequestCookieHeader } from "@/lib/api/server-session";
import { listEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Equipment } from "@/types/equipment";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReservationForm } from "@/features/reservations/ReservationForm";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ equipmentId?: string }>;
}) {
  const { equipmentId } = await searchParams;
  const cookieHeader = await getRequestCookieHeader();

  let equipment: Equipment[] | null = null;
  let errorMessage: string | null = null;

  try {
    const result = await listEquipment({ limit: 100 }, cookieHeader);
    equipment = result.data;
  } catch (error) {
    errorMessage =
      error instanceof ApiError ? error.message : "Something went wrong loading the equipment catalogue.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New Reservation"
        subtitle="Choose equipment and a time window. Items marked Instant are confirmed immediately; others require administrator approval."
      />

      {errorMessage ? (
        <Alert variant="error" title="Failed to load equipment">
          {errorMessage}
        </Alert>
      ) : (
        <div className="max-w-[520px] bg-surface border border-border rounded-[var(--radius-lg)] shadow-xs p-6">
          <ReservationForm equipment={equipment ?? []} initialEquipmentId={equipmentId} />
        </div>
      )}
    </div>
  );
}
