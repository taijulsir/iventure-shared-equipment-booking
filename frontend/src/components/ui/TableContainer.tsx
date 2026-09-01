"use client";

import type { ReactNode } from "react";

export interface TableContainerProps {
  children: ReactNode;
  pagination?: ReactNode;
  className?: string;
}

export function TableContainer({
  children,
  pagination,
  className,
}: TableContainerProps) {
  return (
    <div
      className={[
        "bg-surface border border-border rounded-[var(--radius-lg)] shadow-xs flex flex-col overflow-hidden w-full h-[calc(100vh-270px)] sm:h-[calc(100vh-260px)] min-h-[380px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto w-full relative">
        {children}
      </div>

      {pagination && (
        <div className="border-t border-border bg-surface px-4 py-2.5 shrink-0 flex items-center justify-center z-20">
          {pagination}
        </div>
      )}
    </div>
  );
}
