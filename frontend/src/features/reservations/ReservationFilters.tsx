"use client";

import type { ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import styles from "./ReservationFilters.module.css";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

/** Drives GET /reservations's real `status` query param via the URL, same
 * approach as EquipmentSearchBar — no client-side re-filtering. */
export function ReservationFilters({ initialStatus }: { initialStatus: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value) {
      params.set("status", event.target.value);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className={styles.filters}>
      <Select
        label="Filter by status"
        options={STATUS_OPTIONS}
        defaultValue={initialStatus}
        onChange={handleChange}
      />
    </div>
  );
}
