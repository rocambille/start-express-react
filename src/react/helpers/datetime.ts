/*
  Purpose:
  Robust, native JavaScript date and time utilities for Framework I/O.
  Follows the principle: "UTC for storage, Fixed Timezone for UI".

  Example Usage:
  ```typescript
  // 1. From API to Form Inputs
  const event = await fetchEvent(); // { start_time: "2026-05-05T10:00:00Z" }
  const dateValue = toInputDate(event.start_time); // "2026-05-05"
  const timeValue = toInputTime(event.start_time); // "12:00" (Paris)

  // 2. From Form Data to API
  const body = {
    start_time: fromInputParts(formData.date, formData.time).toISOString()
  };

  // 3. For Display
  const label = toDisplayString(event.start_time); // "5 mai 2026 à 12:00"
  ```
*/

const DEFAULT_TIMEZONE = import.meta.env.VITE_TIMEZONE ?? "Europe/Paris";

/**
 * Normalizes input to a Date object.
 * Returns an "Invalid Date" object if parsing fails.
 */
function toDate(input: string | Date): Date {
  return typeof input === "string" ? new Date(input) : input;
}

/**
 * Parses local date and time strings (from <input type="date|time">)
 * into a native Date object, interpreted in the target timezone.
 *
 * @param dateStr Format "YYYY-MM-DD"
 * @param timeStr Format "HH:mm"
 * @param timeZone Target timezone (defaults to VITE_TIMEZONE)
 * @returns A Date object representing the moment in UTC.
 */
export function fromInputParts(
  dateStr: string,
  timeStr: string,
  timeZone: string = DEFAULT_TIMEZONE,
): Date {
  // 1. Create a UTC date representing the "naive" parts.
  // We append 'Z' to treat the input as if it were UTC initially,
  // then we calculate the offset difference to "shift" it to the target timezone.
  const naiveUtc = new Date(`${dateStr}T${timeStr}:00Z`);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });

  /**
   * Native JS Dates don't provide an easy way to get the offset of a SPECIFIC timezone
   * at a specific moment (especially with DST).
   * We use Intl.DateTimeFormat to "render" the date in the target timezone,
   * then we parse those parts back into a UTC timestamp to see the difference.
   */
  const getOffsetMinutes = (d: Date) => {
    const parts = formatter.formatToParts(d);
    const p = (type: string) => parts.find((it) => it.type === type)?.value;
    const localized = Date.UTC(
      Number(p("year")),
      Number(p("month")) - 1,
      Number(p("day")),
      Number(p("hour")) % 24,
      Number(p("minute")),
      Number(p("second")),
    );
    return (localized - d.getTime()) / 60000;
  };

  const offset = getOffsetMinutes(naiveUtc);
  return new Date(naiveUtc.getTime() - offset * 60000);
}

/**
 * Returns a string in YYYY-MM-DD format based on the target timezone.
 * Suitable for <input type="date">.
 */
export function toInputDate(
  input: string | Date,
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  const date = toDate(input);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const f = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${f("year")}-${f("month")}-${f("day")}`;
}

/**
 * Returns a string in HH:mm (24h) format based on the target timezone.
 * Suitable for <input type="time">.
 */
export function toInputTime(
  input: string | Date,
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  const date = toDate(input);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const f = (type: string) => parts.find((p) => p.type === type)?.value;
  const hour = String(Number(f("hour")) % 24).padStart(2, "0");
  return `${hour}:${f("minute")}`;
}

/**
 * Formats an ISO string or Date into a human-readable localized string.
 */
export function toDisplayString(
  input: string | Date,
  options: {
    timeZone?: string;
    locale?: string;
    dateStyle?: "full" | "long" | "medium" | "short";
    timeStyle?: "full" | "long" | "medium" | "short";
  } = {},
): string {
  const {
    timeZone = DEFAULT_TIMEZONE,
    locale = "fr-FR",
    dateStyle = "long",
    timeStyle = "short",
  } = options;

  const date = toDate(input);

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    timeZone,
  }).format(date);
}
