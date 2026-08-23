/** Product timezone: Africa/Lagos (WAT, UTC+1, no DST). */
export const LAGOS_TIME_ZONE = "Africa/Lagos";
export const LAGOS_OFFSET = "+01:00";

/**
 * Treat a datetime-local value (YYYY-MM-DDTHH:mm) as Lagos wall time
 * and return RFC3339 with an explicit +01:00 offset.
 */
export function lagosDatetimeLocalToRfc3339(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  // datetime-local is "YYYY-MM-DDTHH:mm" or with seconds
  const m = trimmed.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?/);
  if (!m) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? trimmed : d.toISOString();
  }
  const seconds = m[3] ?? "00";
  return `${m[1]}T${m[2]}:${seconds}${LAGOS_OFFSET}`;
}

/**
 * Convert an API RFC3339 / ISO instant into a Lagos datetime-local string
 * suitable for <input type="datetime-local" />.
 */
export function rfc3339ToLagosDatetimeLocal(value: string | undefined | null): string {
  if (!value?.trim()) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function addLagosCalendarDaysRfc3339(eventRfc3339: string, days: number): string {
  const local = rfc3339ToLagosDatetimeLocal(eventRfc3339);
  if (!local) return eventRfc3339;
  const [datePart, timePart] = local.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  const yy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(base.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}T${timePart}:00${LAGOS_OFFSET}`;
}
