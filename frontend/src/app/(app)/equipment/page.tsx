import { getServerSession, getRequestCookieHeader } from "@/lib/api/server-session";
import { listEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Equipment } from "@/types/equipment";
import type { PaginationMeta } from "@/types/pagination";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { EquipmentTable } from "@/features/equipment/EquipmentTable";
import { EquipmentSearchBar } from "@/features/equipment/EquipmentSearchBar";

const PAGE_LIMIT = 20;

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search, page: pageParam } = await searchParams;
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;

  const user = await getServerSession();
  const isEmployee = user?.role === "EMPLOYEE";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const cookieHeader = await getRequestCookieHeader();

  let equipment: Equipment[] | null = null;
  let meta: PaginationMeta | null = null;
  let errorMessage: string | null = null;

  try {
    const result = await listEquipment({ search, page, limit: PAGE_LIMIT }, cookieHeader);
    equipment = result.data;
    meta = result.meta;
  } catch (error) {
    errorMessage =
      error instanceof ApiError ? error.message : "Something went wrong loading the equipment list.";
  }

  function buildHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(targetPage));
    return `/equipment?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Equipment Catalogue"
        subtitle="Browse shared enterprise equipment, review specifications, and check booking policies."
        badge={
          meta && (
            <Badge tone="neutral" showDot={false}>
              {meta.total} {meta.total === 1 ? "Item" : "Items"}
            </Badge>
          )
        }
        action={
          isAdmin && (
            <Button href="/admin/equipment" variant="secondary" size="md">
              Manage Equipment
            </Button>
          )
        }
      />

      <EquipmentSearchBar initialSearch={search ?? ""} />

      {errorMessage ? (
        <Alert variant="error" title="Failed to load equipment">
          {errorMessage}
        </Alert>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-[var(--radius-lg)] overflow-hidden shadow-xs">
            <EquipmentTable equipment={equipment ?? []} showBookAction={isEmployee} />
          </div>
          {meta && <Pagination meta={meta} buildHref={buildHref} />}
        </>
      )}
    </div>
  );
}
