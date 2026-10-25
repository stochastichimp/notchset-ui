// Notchset time-picker 2.0.0 · https://notchset.dev/changelog
/*
 * Dates for the pickers, with no date library: a day is an ISO string ("2026-11-07"), so it never shifts with
 * the reader's time zone, compares with < and >, and is what a form stores. Display uses Intl in UTC for the
 * same reason. Times are minutes after midnight.
 */

export type Day = string;

const DAY = 864e5;
const toUTC = (d: Day) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
export const fromUTC = (t: number): Day => new Date(t).toISOString().slice(0, 10);
export const makeDay = (y: number, m: number, d: number): Day => fromUTC(Date.UTC(y, m, d));
export const partsOf = (d: Day) => ({ y: +d.slice(0, 4), m: +d.slice(5, 7) - 1, d: +d.slice(8, 10) });

/** Today in the reader's own calendar. */
export function today(now = new Date()): Day {
  return makeDay(now.getFullYear(), now.getMonth(), now.getDate());
}

export const addDays = (d: Day, n: number): Day => fromUTC(toUTC(d) + n * DAY);
export function addMonths(d: Day, n: number): Day {
  const { y, m, d: day } = partsOf(d);
  const last = new Date(Date.UTC(y, m + n + 1, 0)).getUTCDate();
  return makeDay(y, m + n, Math.min(day, last));
}
export const weekday = (d: Day) => new Date(toUTC(d)).getUTCDay();
export const sameMonth = (a: Day, b: Day) => a.slice(0, 7) === b.slice(0, 7);
export const daysBetween = (a: Day, b: Day) => Math.round((toUTC(b) - toUTC(a)) / DAY);

/** Six full weeks around a month, so the calendar never changes height as you page through months. */
export function monthGrid(year: number, month: number, weekStartsOn = 1): Day[] {
  const first = makeDay(year, month, 1);
  const lead = (weekday(first) - weekStartsOn + 7) % 7;
  const start = addDays(first, -lead);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function weekdayNames(weekStartsOn = 1, locale?: string) {
  const f = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
  const full = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
  // 2024-01-07 was a Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const t = Date.UTC(2024, 0, 7 + ((i + weekStartsOn) % 7));
    return { short: f.format(t), long: full.format(t) };
  });
}

export function formatDay(d: Day, style: "short" | "medium" | "long" = "medium", locale?: string) {
  const opts: Intl.DateTimeFormatOptions =
    style === "short" ? { month: "short", day: "numeric" } : style === "medium" ? { month: "short", day: "numeric", year: "numeric" } : { weekday: "long", month: "long", day: "numeric", year: "numeric" };
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(toUTC(d));
}
export const monthName = (m: number, style: "long" | "short" = "long", locale?: string) =>
  new Intl.DateTimeFormat(locale, { month: style, timeZone: "UTC" }).format(Date.UTC(2024, m, 1));

/** "Nov 3 – Dec 31" (one year) or "Nov 3, 2026 – Jan 4, 2027". */
export function formatRange(a: Day, b: Day, locale?: string) {
  return a.slice(0, 4) === b.slice(0, 4) ? `${formatDay(a, "short", locale)} – ${formatDay(b, "short", locale)}` : `${formatDay(a, "medium", locale)} – ${formatDay(b, "medium", locale)}`;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const monthOf = (w: string) => (w.length >= 3 ? MONTHS.findIndex((m) => w.startsWith(m)) : -1);
const DAYNAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const weekdayOf = (w: string) => (w.length >= 3 ? DAYNAMES.findIndex((d, i) => d.startsWith(w) || (WEEKDAYS[i] === w.slice(0, 3) && /^(tues?|thur?s?|weds?)$/.test(w))) : -1);

/**
 * A typed date: "today", "tomorrow", "yesterday", "fri", "next fri", "in 2 weeks", "3 days ago",
 * "nov 3", "3 nov", "nov 3 2023", "3 November, 2023", "2023-11-03". Numeric dates like 11/03 are refused:
 * half the world reads them the other way round. A month and day with no year means this year; with `ahead`
 * (a close date, a due date: things still to come) it means the next time that date comes round, never the past.
 */
export function parseDay(text: string, now: Day = today(), { ahead = false }: { ahead?: boolean } = {}): Day | null {
  const s = text.trim().toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ");
  if (!s) return null;
  if (s === "today" || s === "now") return now;
  if (s === "tomorrow" || s === "tmr" || s === "tmrw") return addDays(now, 1);
  if (s === "yesterday") return addDays(now, -1);
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return valid(+m[1]!, +m[2]! - 1, +m[3]!);
  m = s.match(/^in (\d+) (day|week|month|year)s?$/) ?? s.match(/^(\d+) (day|week|month|year)s? from now$/);
  if (m) return shift(now, +m[1]!, m[2]!);
  m = s.match(/^(\d+) (day|week|month|year)s? ago$/);
  if (m) return shift(now, -m[1]!, m[2]!);
  m = s.match(/^(next |this )?([a-z]+)$/);
  if (m && weekdayOf(m[2]!) >= 0 && monthOf(m[2]!) < 0) {
    // "fri" and "next fri" both mean the coming Friday, 1 to 7 days ahead; the field shows the date before Enter
    return addDays(now, (weekdayOf(m[2]!) - weekday(now) + 7) % 7 || 7);
  }
  const words = s.split(" ");
  let month = -1, day = -1, year = -1;
  for (const w of words) {
    if (/^\d{4}$/.test(w)) year = +w;
    else if (/^\d{1,2}(st|nd|rd|th)?$/.test(w)) day = parseInt(w, 10);
    else if (monthOf(w) >= 0) month = monthOf(w);
    else return null;
  }
  if (month < 0 || day < 0) return null;
  if (year >= 0) return valid(year, month, day);
  const y = partsOf(now).y;
  if (!ahead) return valid(y, month, day);
  /* the next time it comes round: a leap day can be up to eight years off (2096 → 2104); a date no year has stays null */
  for (let k = 0; k <= 8; k++) {
    const out = valid(y + k, month, day);
    if (out && out >= now) return out;
  }
  return null;
}

function valid(y: number, m: number, d: number): Day | null {
  if (m < 0 || m > 11 || d < 1) return null;
  const out = makeDay(y, m, d);
  return partsOf(out).m === m ? out : null;
}
function shift(d: Day, n: number, unit: string): Day {
  return unit === "day" ? addDays(d, n) : unit === "week" ? addDays(d, 7 * n) : unit === "month" ? addMonths(d, n) : addMonths(d, 12 * n);
}

/** A typed time: "2:30pm", "2.30 pm", "14:30", "1430", "2p", "9", "noon", "midnight". Minutes after midnight. */
export function parseTime(text: string): number | null {
  const s = text.trim().toLowerCase().replace(/\s+/g, "");
  if (s === "noon") return 720;
  if (s === "midnight") return 0;
  const m = s.match(/^(\d{1,2})(?:[:.]?(\d{2}))?(a|am|p|pm)?$/);
  if (!m) return null;
  let h = +m[1]!;
  const min = m[2] ? +m[2] : 0;
  if (min > 59) return null;
  if (m[3]) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (m[3].startsWith("p") ? 12 : 0);
  } else if (h > 23) return null;
  return h * 60 + min;
}

export function formatTime(minutes: number, hour12: boolean, locale?: string) {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12, timeZone: "UTC" }).format(Date.UTC(2024, 0, 1, 0, minutes));
}
