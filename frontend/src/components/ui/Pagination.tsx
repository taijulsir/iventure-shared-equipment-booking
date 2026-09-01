import type { PaginationMeta } from "@/types/pagination";
import { Button } from "./Button";
import styles from "./Pagination.module.css";

/**
 * Generic Previous/Next pagination control shared by every paginated list
 * view (Equipment, Reservations, Admin equipment management). `buildHref`
 * receives the target page and returns the URL to navigate to — callers
 * own their own query-string scheme (search/status/etc. alongside `page`).
 * Renders nothing when there is only one page, so it never shows up as
 * empty chrome on a short list.
 */
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
    <nav className={styles.pagination} aria-label="Pagination">
      {hasPrev ? (
        <Button href={buildHref(meta.page - 1)} variant="outline" size="sm">
          Previous
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
      )}

      <span className={styles.pageInfo}>
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
