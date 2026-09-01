"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function ReservationFilters({ initialStatus }: { initialStatus: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? initialStatus ?? "";

  function handleSelectStatus(statusValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (statusValue) {
      params.set("status", statusValue);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="w-full overflow-x-auto pb-1">
      <nav
        className="inline-flex items-center gap-1 p-1 bg-surface-muted border border-border rounded-[var(--radius-md)] shrink-0"
        aria-label="Filter reservations by status"
      >
        {STATUS_TABS.map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleSelectStatus(tab.value)}
              className={[
                "px-3.5 py-1.5 rounded-[var(--radius-sm)] text-xs sm:text-sm font-medium cursor-pointer transition-all duration-150 whitespace-nowrap",
                isActive
                  ? "bg-surface text-foreground font-semibold shadow-xs border border-border"
                  : "text-foreground-secondary hover:text-foreground hover:bg-surface border border-transparent",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
