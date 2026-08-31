/**
 * Formats an ISO timestamp as an explicit UTC string (e.g.
 * "2027-06-01 10:00 UTC"). The backend stores and compares reservation
 * times in UTC (docs/decisions.md) and presenting them in the viewer's
 * local timezone is explicitly a frontend concern for a later phase, not
 * this one — labeling the value as UTC here is honest about that rather
 * than silently formatting with the server's or browser's local timezone
 * (which would also risk a server/client rendering mismatch, since this
 * runs in Server Components).
 */
export function formatUtc(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const pad = (value: number) => String(value).padStart(2, "0");
  const datePart = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  const timePart = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  return `${datePart} ${timePart} UTC`;
}
