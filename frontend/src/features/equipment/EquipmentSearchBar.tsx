"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconSearch } from "@/components/ui/Icons";
import { datetimeLocalValueToUtcIso } from "@/lib/format";

export function EquipmentSearchBar({
  initialSearch,
  initialStartTime = "",
  initialEndTime = "",
}: {
  initialSearch: string;
  /** Already-UTC values as stored in the URL (see `EquipmentPage`'s
   * `datetime-local`-compatible truncation) — not re-converted here. */
  initialStartTime?: string;
  initialEndTime?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    const trimmed = value.trim();
    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }

    // Both-or-neither, same rule the backend enforces (400 otherwise) — kept
    // out of the request entirely rather than letting a half-filled pair
    // through to surface as a server error.
    if (startTime && endTime) {
      params.set("startTime", datetimeLocalValueToUtcIso(startTime));
      params.set("endTime", datetimeLocalValueToUtcIso(endTime));
    } else {
      params.delete("startTime");
      params.delete("endTime");
    }

    params.delete("page");
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  function handleClearAvailability() {
    setStartTime("");
    setEndTime("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("startTime");
    params.delete("endTime");
    params.delete("page");
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} role="search">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <Input
            label="Search equipment"
            placeholder="Search by name or description…"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">
          <IconSearch size={16} />
          <span>Search</span>
        </Button>
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <div className="min-w-[200px]">
          <Input
            label="Available from (UTC)"
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>
        <div className="min-w-[200px]">
          <Input
            label="Available until (UTC)"
            type="datetime-local"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">
          Check availability
        </Button>
        {(startTime || endTime) && (
          <Button type="button" variant="ghost" onClick={handleClearAvailability}>
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
