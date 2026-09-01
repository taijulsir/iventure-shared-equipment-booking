import { getRequestCookieHeader } from "@/lib/api/server-session";
import { listEquipment } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/core";
import type { Equipment } from "@/types/equipment";
import type { PaginationMeta } from "@/types/pagination";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { EquipmentSearchBar } from "@/features/equipment/EquipmentSearchBar";
import { EquipmentManagementTable } from "@/features/equipment/EquipmentManagementTable";
import styles from "./page.module.css";

const PAGE_LIMIT = 20;

export default async function AdminEquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search, page: pageParam } = await searchParams;
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;
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
    return `/admin/equipment?${params.toString()}`;
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Equipment Management"
        subtitle="Add, edit, and decommission shared equipment catalogue items."
        badge={
          meta && (
            <Badge tone="neutral" showDot={false}>
              {meta.total} {meta.total === 1 ? "Item" : "Items"}
            </Badge>
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
          <EquipmentManagementTable equipment={equipment ?? []} />
          {meta && <Pagination meta={meta} buildHref={buildHref} />}
        </>
      )}
    </div>
  );
}
