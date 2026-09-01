import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession, getRequestCookieHeader } from "@/lib/api/server-session";
import { getEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Equipment } from "@/types/equipment";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconArrowRight, IconEquipment } from "@/components/ui/Icons";
import { formatUtc } from "@/lib/format";

import { BookEquipmentButton } from "@/features/equipment/BookEquipmentButton";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getServerSession();
  const cookieHeader = await getRequestCookieHeader();
  const isEmployee = user?.role === "EMPLOYEE";

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
      <div className="flex flex-col gap-6 max-w-[560px]">
        <PageHeader title="Equipment" subtitle="Equipment details" />
        <Alert variant="error" title="Failed to load equipment">
          {errorMessage}
        </Alert>
        <Link
          href="/equipment"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-primary transition-colors duration-150 w-fit"
        >
          <IconArrowRight size={14} className="rotate-180" />
          <span>Back to catalogue</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[560px]">
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

      <Card className="flex flex-col gap-4 p-6">
        <div className="w-12 h-12 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center">
          <IconEquipment size={28} />
        </div>

        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted">Description</span>
          <p className="text-[0.9375rem] text-foreground mt-1 leading-[1.5]">{equipment.description || "N/A"}</p>
        </div>

        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted">Added</span>
          <p className="text-[0.9375rem] text-foreground mt-1 leading-[1.5] tabular-nums">{formatUtc(equipment.createdAt)}</p>
        </div>

        {isEmployee && <BookEquipmentButton equipment={equipment} />}
      </Card>

      <Link
        href="/equipment"
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-primary transition-colors duration-150 w-fit"
      >
        <IconArrowRight size={14} className="rotate-180" />
        <span>Back to catalogue</span>
      </Link>
    </div>
  );
}
