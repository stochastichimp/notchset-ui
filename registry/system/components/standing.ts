// Notchset standing-arc 2.0.0 · https://notchset.dev/changelog
/*
 * Standing: where a value sits against a named range, as one calculation every health piece reads (the range bar,
 * the results strip, a result list, a metric card), so a value can never read "High" in one place and "In range" in
 * another. A range always says whose it is: the lab's printed reference range, an optimal range with its source, or
 * your own baseline from your last nights. Plain functions, no React.
 */

/** Whose range it is. Never a bare band: the source is always said. */
export type RangeKind = "lab" | "optimal" | "baseline";

/** A range, open at either end ("< 100" has no low). Values are in the unit the value is shown in. */
export type ValueRange = {
  low?: number | undefined;
  high?: number | undefined;
  kind: RangeKind;
  /** who set it: "Northside Lab", "Endocrine Society 2024", "Your last 14 nights" */
  source: string;
};

/** Where a value stands: below, inside or above its range; unknown when there is no range or no value. */
export type Standing = "low" | "in" | "high" | "unknown";

/** A value's standing against a range: inclusive at both limits, as labs print them ("30–100" includes 30). */
export function standingOf(value: number | null | undefined, range: Pick<ValueRange, "low" | "high"> | null | undefined): Standing {
  if (value == null || !Number.isFinite(value) || !range) return "unknown";
  if (range.low == null && range.high == null) return "unknown";
  if (range.low != null && value < range.low) return "low";
  if (range.high != null && value > range.high) return "high";
  return "in";
}

/** The word for a standing. A baseline says "usual", never "range", because it is yours, not a reference. */
export function standingWord(s: Standing, kind: RangeKind = "lab"): string {
  if (kind === "baseline") return s === "low" ? "Below your usual" : s === "high" ? "Above your usual" : s === "in" ? "Your usual" : "No baseline yet";
  return s === "low" ? "Low" : s === "high" ? "High" : s === "in" ? "In range" : "No range";
}

/** A value's flag beyond its standing: the lab marked it critical, or it may have been read wrong. */
export type ValueFlag = "critical" | "may-be-wrong" | undefined;

/**
 * The tone a standing is said in (LANGUAGE.md §9b): in range is good news (ok), out of range needs attention (warn;
 * a high LDL isn't an error), and only the lab's critical flag or a value that may be wrong is bad. Your usual is
 * plain ink: being normal for you is not news.
 */
export function standingTone(s: Standing, flag?: ValueFlag, kind: RangeKind = "lab"): "ok" | "warn" | "bad" | "neutral" {
  if (flag) return "bad";
  if (s === "unknown") return "neutral";
  if (s === "in") return kind === "baseline" ? "neutral" : "ok";
  return "warn";
}

/** The word a flag is said in, which replaces the standing's word: nothing is concluded from it. */
export function flagWord(flag: ValueFlag): string | null {
  return flag === "critical" ? "Flagged by your lab" : flag === "may-be-wrong" ? "May be wrong" : null;
}

/** "30–100", "< 100", "> 40", in the value's own precision. */
export function rangeText(r: Pick<ValueRange, "low" | "high">, fmt: (n: number) => string = String): string {
  if (r.low != null && r.high != null) return `${fmt(r.low)}–${fmt(r.high)}`;
  if (r.high != null) return `< ${fmt(r.high)}`;
  if (r.low != null) return `> ${fmt(r.low)}`;
  return "";
}

/** Whose range, in words: "Lab range", "Optimal", "Your usual". */
export function rangeName(kind: RangeKind): string {
  return kind === "lab" ? "Lab range" : kind === "optimal" ? "Optimal" : "Your usual";
}

/** A number in the precision its unit is read at: one decimal under 10, none above (5.4 %, 128 mg/dL). */
export function formatReading(n: number, decimals?: number): string {
  const d = decimals ?? (Math.abs(n) < 10 && !Number.isInteger(n) ? 1 : 0);
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** What a change means: better, worse or the same, by the measure's better direction (LANGUAGE.md §9, delta chips). */
export type Better = "up" | "down" | "in-range";

/**
 * A change between two readings, signed and toned by what's better for this measure, never by up or down. For a
 * measure whose better direction is "in-range" (vitamin D, TSH), moving toward the range is better.
 */
export function changeTone(now: number, then: number, better: Better, range?: Pick<ValueRange, "low" | "high">): "ok" | "bad" | "neutral" {
  if (now === then) return "neutral";
  if (better === "up") return now > then ? "ok" : "bad";
  if (better === "down") return now < then ? "ok" : "bad";
  if (!range) return "neutral";
  const dist = (v: number) => (range.low != null && v < range.low ? range.low - v : range.high != null && v > range.high ? v - range.high : 0);
  const a = dist(now), b = dist(then);
  return a === b ? "neutral" : a < b ? "ok" : "bad";
}

/** Plausible limits for a reading a person types (the log), per measure, so a slip ("310/80") is caught before it's kept. */
export const PLAUSIBLE = {
  weight: { low: 25, high: 300, unit: "kg" },
  systolic: { low: 60, high: 260, unit: "mmHg" },
  diastolic: { low: 30, high: 160, unit: "mmHg" },
  glucose: { low: 20, high: 600, unit: "mg/dL" },
  heartRate: { low: 25, high: 230, unit: "bpm" },
} as const;

/** Whether a typed reading is plausible; when it isn't, the words that say what to check ("BP 310/80? Check the value"). */
export function plausible(kind: keyof typeof PLAUSIBLE, value: number): { ok: true } | { ok: false; reason: string } {
  const p = PLAUSIBLE[kind];
  if (!Number.isFinite(value)) return { ok: false, reason: "Type a number" };
  if (value < p.low || value > p.high) return { ok: false, reason: `${formatReading(value)} ${p.unit}? Check the value: it's outside what a body reads (${p.low}–${p.high})` };
  return { ok: true };
}

/**
 * Where a value stands, in three (Superpower's and Whoop's model): Optimal (inside the optimal range), Normal (inside
 * the lab's range, outside the optimal one) and Out of range (outside the lab's). Where no optimal range is named the
 * lab's range is the optimal one, and the host says so. A flag (critical, may be wrong) is said instead, never a grade.
 */
export type Grade = "optimal" | "normal" | "out" | "unknown";
export function gradeOf(value: number | null | undefined, lab: Pick<ValueRange, "low" | "high"> | null | undefined, optimal?: Pick<ValueRange, "low" | "high"> | null): Grade {
  const s = standingOf(value, lab);
  if (s === "unknown") return "unknown";
  if (s !== "in") return "out";
  if (!optimal) return "optimal";
  return standingOf(value, optimal) === "in" ? "optimal" : "normal";
}
export function gradeWord(g: Grade): string {
  return g === "optimal" ? "Optimal" : g === "normal" ? "Normal" : g === "out" ? "Out of range" : "No range";
}
/**
 * The tone a grade is said in, from the existing roles (no new hue): Optimal ok, Normal plain ink (inside the lab's
 * range is not news), Out of range warn, and a flag (critical, may be wrong) bad. Always a dot and a word.
 */
export function gradeTone(g: Grade, flag?: ValueFlag): "ok" | "neutral" | "warn" | "bad" {
  if (flag) return "bad";
  return g === "optimal" ? "ok" : g === "out" ? "warn" : "neutral";
}
/** The dot's colour for a grade (the segmented bar, a row's dot). */
export function gradeColor(g: Grade, flag?: ValueFlag): string {
  const t = gradeTone(g, flag);
  return t === "ok" ? "var(--ns-standing-in)" : t === "warn" ? "var(--ns-standing-out)" : t === "bad" ? "var(--ns-standing-critical)" : "var(--ns-ink-3)";
}

/**
 * The tone a reading against your own usual is said in, by which way is better for that measure: above your usual
 * HRV is good news (ok), above your usual resting heart rate needs a look (warn), inside your usual is plain ink.
 * For a measure that's best inside its band (skin temperature), outside it either way is warn.
 */
export function usualTone(s: Standing, better: Better): "ok" | "neutral" | "warn" {
  if (s === "in" || s === "unknown") return "neutral";
  if (better === "up") return s === "high" ? "ok" : "warn";
  if (better === "down") return s === "low" ? "ok" : "warn";
  return "warn";
}
