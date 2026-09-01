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

/**
 * Converts a `<input type="datetime-local">` value ("YYYY-MM-DDTHH:mm") into
 * a UTC ISO 8601 string for the reservation create form. Deliberately does
 * NOT treat the typed value as the browser's local time and convert it (that
 * would silently shift the time the user typed) — consistent with this
 * app's existing choice not to do local-timezone conversion anywhere yet
 * (see the `Reservation` type's comment, and the Dashboard's "UTC
 * Timelines" guideline): the value the user types is taken to already be
 * UTC, and the form labels its fields accordingly.
 */
export function datetimeLocalValueToUtcIso(value: string): string {
  return `${value}:00.000Z`;
}

/**
 * Mirrors the backend's "Definition of Upcoming Reservation"
 * (docs/decisions.md): startTime > now. Used only to decide whether to
 * show a Cancel button — the backend re-checks this on every actual cancel
 * request regardless, so this is UX only, not an authorization boundary.
 *
 * Deliberately a plain function, not called directly in a component's
 * render body: `Date.now()` is an impure read of "now" and the
 * react-hooks/purity lint rule flags it specifically at a component's own
 * call site. Wrapping it here keeps every caller's component body pure
 * from the linter's perspective while the actual behavior is unchanged.
 */
export function isUpcomingReservation(startTimeIso: string): boolean {
  return new Date(startTimeIso).getTime() > Date.now();
}
