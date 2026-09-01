"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { IconSearch, IconAlertCircle, IconX, IconClock } from "@/components/ui/Icons";
import { datetimeLocalValueToUtcIso } from "@/lib/format";

export function EquipmentSearchBar({
  initialSearch,
  initialStartTime = "",
  initialEndTime = "",
}: {
  initialSearch: string;
  initialStartTime?: string;
  initialEndTime?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [isStartFocused, setIsStartFocused] = useState(false);
  const [isEndFocused, setIsEndFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    // Validation: incomplete availability window
    if (startTime && !endTime) {
      setValidationError("Please provide both Available From and Available Until to check availability.");
      return;
    }
    if (!startTime && endTime) {
      setValidationError("Please provide both Available From and Available Until to check availability.");
      return;
    }

    if (startTime && endTime) {
      const startMs = new Date(startTime).getTime();
      const endMs = new Date(endTime).getTime();
      if (startMs >= endMs) {
        setValidationError("Available Until must be after Available From.");
        return;
      }
    }

    const params = new URLSearchParams(searchParams.toString());

    const trimmed = value.trim();
    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }

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

  function handleClear() {
    setValue("");
    setStartTime("");
    setEndTime("");
    setValidationError(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("startTime");
    params.delete("endTime");
    params.delete("page");
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  const hasActiveFilters = Boolean(value || startTime || endTime);

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit} role="search" noValidate>
      <div className="flex items-end gap-3 flex-wrap lg:flex-nowrap">
        {/* Keyword Search Input */}
        <div className="flex-1 min-w-[200px] w-full">
          <div className="flex flex-col gap-1.5 w-full">
            <label
              htmlFor="equipment-search-input"
              className="text-xs sm:text-sm font-medium text-foreground tracking-[-0.01em]"
            >
              Search equipment
            </label>
            <div className="relative flex items-center w-full">
              <input
                id="equipment-search-input"
                type="text"
                placeholder="Search by name or description…"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  if (validationError) setValidationError(null);
                }}
                className="w-full h-10 border border-border rounded-[var(--radius-md)] px-3.5 text-xs sm:text-sm bg-surface text-foreground shadow-xs placeholder:text-foreground-muted placeholder:opacity-80 transition-all duration-150 hover:border-border-hover focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Cohesive Availability Window Group */}
        <div className="w-full sm:w-auto shrink-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-foreground tracking-[-0.01em] flex items-center gap-1.5">
                <IconClock size={14} className="text-primary shrink-0" />
                <span>Availability Window (UTC)</span>
              </span>
            </div>

            <div className="flex items-center bg-surface border border-border rounded-[var(--radius-md)] shadow-xs divide-x divide-border h-10 transition-all duration-150 hover:border-border-hover focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              {/* From Input with Set Date & Time placeholder */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 min-w-0 flex-1 sm:flex-initial">
                <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted select-none shrink-0">
                  From
                </span>
                <input
                  type={startTime || isStartFocused ? "datetime-local" : "text"}
                  value={startTime}
                  placeholder="Set Date & Time"
                  aria-label="Available from (UTC)"
                  onFocus={() => setIsStartFocused(true)}
                  onBlur={() => setIsStartFocused(false)}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full sm:w-[155px] bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-foreground-muted/70 placeholder:text-xs font-medium p-0 focus:ring-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                />
              </div>

              {/* Until Input with Set Date & Time placeholder */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 min-w-0 flex-1 sm:flex-initial">
                <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted select-none shrink-0">
                  Until
                </span>
                <input
                  type={endTime || isEndFocused ? "datetime-local" : "text"}
                  value={endTime}
                  placeholder="Set Date & Time"
                  aria-label="Available until (UTC)"
                  onFocus={() => setIsEndFocused(true)}
                  onBlur={() => setIsEndFocused(false)}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full sm:w-[155px] bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-foreground-muted/70 placeholder:text-xs font-medium p-0 focus:ring-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button type="submit" variant="primary" size="md" className="h-10 px-4">
            <IconSearch size={16} />
            <span className="text-white">Check availability</span>
          </Button>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClear}
              aria-label="Clear filters"
              className="h-10 px-3"
            >
              <IconX size={15} />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Meaningful Validation Feedback */}
      {validationError && (
        <div className="flex items-center gap-1.5 text-danger text-xs sm:text-sm font-medium animate-in fade-in duration-150 mt-1">
          <IconAlertCircle size={15} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </form>
  );
}
