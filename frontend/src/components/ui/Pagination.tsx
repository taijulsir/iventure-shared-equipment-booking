import type { PaginationMeta } from "@/types/pagination";
import { Button } from "./Button";

export function Pagination({
  meta,
  buildHref,
}: {
  meta: PaginationMeta;
  buildHref: (page: number) => string;
}) {
  if (meta.totalPages <= 1) {
    return null;
  }

  const hasPrev = meta.page > 1;
  const hasNext = meta.page < meta.totalPages;

  return (
    <nav className="flex items-center justify-center gap-4 flex-wrap w-full" aria-label="Pagination">
      {hasPrev ? (
        <Button href={buildHref(meta.page - 1)} variant="outline" size="sm">
          Previous
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
      )}

      <span className="text-[0.8125rem] text-foreground-muted whitespace-nowrap">
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>

      {hasNext ? (
        <Button href={buildHref(meta.page + 1)} variant="outline" size="sm">
          Next
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      )}
    </nav>
  );
}
