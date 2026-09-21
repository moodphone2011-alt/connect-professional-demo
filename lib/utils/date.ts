/** Date helpers shared by the demo data layer and the UI. */

const MS_PER_DAY = 86_400_000;

/** `YYYY-MM-DD` for a Date, using local time (never UTC-shifted). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date = new Date()): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Sunday-first week start, matching the regional working week. */
export function startOfWeek(date = new Date()): Date {
  const next = startOfDay(date);
  return addDays(next, -next.getDay());
}

export function daysBetween(from: string, to: string): number {
  const diff = parseISODate(to).getTime() - parseISODate(from).getTime();
  return Math.round(diff / MS_PER_DAY) + 1;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  // Friday and Saturday are the regional weekend.
  return day === 5 || day === 6;
}

export function formatDate(value: string | Date, withYear = false): string {
  const date = typeof value === "string" ? parseISODate(value) : value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function formatLongDate(value: string | Date): string {
  const date = typeof value === "string" ? parseISODate(value) : value;
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateRange(start: string, end: string): string {
  if (start === end) return formatDate(start);
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export function formatTime(value: string | Date | null): string {
  if (!value) return "—";
  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${`${m}`.padStart(2, "0")} ${suffix}`;
  }
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** "3 hours ago", "Yesterday", "12 Mar" — for activity feeds and notifications. */
export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(new Date(then), true);
}

export function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0h";
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (minutes === 0) return `${whole}h`;
  return `${whole}h ${minutes}m`;
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Minutes elapsed between two `HH:mm` values, expressed as decimal hours. */
export function hoursBetween(checkIn: string, checkOut: string): number {
  const [h1, m1] = checkIn.split(":").map(Number);
  const [h2, m2] = checkOut.split(":").map(Number);
  return Math.max(0, Math.round(((h2 * 60 + m2 - (h1 * 60 + m1)) / 60) * 10) / 10);
}
