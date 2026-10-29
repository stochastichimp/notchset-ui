// Notchset reason-glyph 2.0.0 · https://notchset.dev/changelog
"use client";
import { cn } from "@/lib/utils";

/*
 * Reason glyph: a small drawing of the reason for a judging word, never decoration. A word that judges ("Due",
 * "Drifting", "Out of range", "Above usual") gets a glyph that shows why; a glyph never appears without its word.
 * Five shapes, all in the Signature's family, at the weight of a status line:
 *   arc    a shallow arc with the usual band drawn heavier and a dot where the reading sits (a value against usual)
 *   span   a faint window with a solid span over it (last night's sleep against the usual window; a draw's age
 *          against the time it stays fresh)
 *   marks  a few readings, each a band with a dot inside it (usual) or outside it (moved)
 *   align  two dots on a line, the usual (a ring) and the latest (filled), that meet when they align
 *   days   a run of days as dots, the ones that count filled (a streak of watch days, a week of ticks)
 * `ReasonGlyph` fills its box (a tile's visual band). `ReasonWord` is the inline pair for a list row: the glyph at
 * 36 × 14 and its word after it, so the word is always there; the pair reads as the word alone to a screen reader.
 *
 *   <ReasonGlyph glyph={{ kind: "arc", value: 61, low: 47, high: 55, min: 30, max: 75 }} />
 *   <ReasonWord word="Due" glyph={{ kind: "span", usual: [0, 1], span: [0, 1.1] }} />
 */
type Glyph =
  /** where a reading sits on a scale min..max, against its usual band low..high */
  | { kind: "arc"; value: number; low: number; high: number; min: number; max: number }
  /** a 0–1 axis: the window (the usual, or how long a draw stays fresh) and the span over it; past 1 runs out */
  | { kind: "span"; usual: readonly [number, number]; span: readonly [number, number] }
  /** small readings: `at` is where each sits against its band (−1 and 1 are the band's edges); outside is moved */
  | { kind: "marks"; marks: readonly { label: string; at: number }[] }
  /** two dots on a line: the usual (a ring, centred) and the latest (filled), `offset` −1 to 1 apart */
  | { kind: "align"; offset: number }
  /** a run of days, oldest first: true counts (filled), false doesn't, null is no data (a faint ring) */
  | { kind: "days"; days: readonly (boolean | null)[] };

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const soft = (p: number) => `color-mix(in oklab, var(--ns-signal) ${p}%, transparent)`;
/** the arc's points on a 200 × 34 box, 0..1 left to right */
const arcPt = (t: number): [number, number] => [4 + t * 192, 30 - Math.sin(t * Math.PI) * 22];

/** where an arc's reading sits, 0..1 along it (exported for tests) */
function arcAt(g: Extract<Glyph, { kind: "arc" }>) {
  return clamp((g.value - g.min) / (g.max - g.min || 1));
}

/** whether a glyph shows something moved (outside its band, out of its window, apart) */
function glyphMoved(g: Glyph): boolean {
  if (g.kind === "arc") return g.value < g.low || g.value > g.high;
  if (g.kind === "span") return g.span[0] < g.usual[0] || g.span[1] > g.usual[1];
  if (g.kind === "marks") return g.marks.some((m) => Math.abs(m.at) > 1);
  if (g.kind === "align") return Math.abs(g.offset) > 0.25;
  return g.days.some(Boolean);
}

function ReasonGlyph({ glyph: g, small, className }: { glyph: Glyph; small?: boolean | undefined; className?: string | undefined }) {
  const box = cn("relative block h-full w-full", className);
  const moved = glyphMoved(g) || undefined;
  if (g.kind === "arc") {
    const seg = (a: number, b: number) =>
      Array.from({ length: 25 }, (_, i) => arcPt(a + ((b - a) * i) / 24))
        .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
        .join("");
    const f = (x: number) => clamp((x - g.min) / (g.max - g.min || 1));
    const [x, y] = arcPt(arcAt(g));
    return (
      <span aria-hidden data-slot="reason-glyph" data-kind="arc" data-moved={moved} className={box}>
        <svg viewBox="0 0 200 34" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <path d={seg(0, 1)} fill="none" stroke={soft(30)} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <path d={seg(f(g.low), f(g.high))} fill="none" stroke={soft(70)} strokeWidth={small ? 2 : 3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className={cn("absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ns-signal)] shadow-[0_0_0_1.5px_var(--ns-panel)]", small ? "size-[6px]" : "size-[9px]")} style={{ left: `${(x / 200) * 100}%`, top: `${(y / 34) * 100}%` }} />
      </span>
    );
  }
  if (g.kind === "span") {
    /* the axis runs 0..1 inside the box; a span past 1 (a draw past its fresh time) runs to the edge, solid */
    const [u0, u1] = [clamp(g.usual[0]), clamp(g.usual[1])];
    const [s0, s1] = [clamp(g.span[0]), clamp(g.span[1])];
    return (
      <span aria-hidden data-slot="reason-glyph" data-kind="span" data-moved={moved} className={box}>
        <span className="absolute inset-x-0 top-1/2 h-0 border-0 border-t-[0.5px] border-[color-mix(in_oklab,var(--ns-signal)_35%,transparent)]" />
        <span className={cn("absolute top-1/2 -translate-y-1/2 rounded-full bg-[color-mix(in_oklab,var(--ns-signal)_16%,transparent)]", small ? "h-2" : "h-2.5")} style={{ left: `${u0 * 100}%`, width: `${(u1 - u0) * 100}%` }} />
        <span className={cn("absolute top-1/2 -translate-y-1/2 rounded-full bg-[var(--ns-signal)]", small ? "h-1" : "h-1.5")} style={{ left: `${s0 * 100}%`, width: `${(s1 - s0) * 100}%` }} />
      </span>
    );
  }
  if (g.kind === "marks") {
    return (
      <span aria-hidden data-slot="reason-glyph" data-kind="marks" data-moved={moved} className={cn("flex h-full w-full items-center justify-around", className)}>
        {g.marks.map((m) => {
          const out = Math.abs(m.at) > 1;
          return (
            <span key={m.label} data-moved={out || undefined} className={cn("relative h-full", small ? "w-2" : "w-3")}>
              {/* the band: the middle half of the mark's height is the usual; the dot is the reading */}
              <span className="absolute inset-x-0 top-1/4 bottom-1/4 rounded-full bg-[color-mix(in_oklab,var(--ns-signal)_14%,transparent)]" />
              <span className={cn("absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full", small ? "size-[5px]" : "size-[7px]")} style={{ top: `${50 - clamp(m.at, -1.9, 1.9) * 25}%`, background: out ? "var(--ns-signal)" : soft(88) }} />
            </span>
          );
        })}
      </span>
    );
  }
  if (g.kind === "align") {
    const o = clamp(g.offset, -1, 1);
    return (
      <span aria-hidden data-slot="reason-glyph" data-kind="align" data-moved={moved} className={box}>
        <span className="absolute inset-x-0 top-1/2 h-0 border-0 border-t-[0.5px] border-[color-mix(in_oklab,var(--ns-signal)_35%,transparent)]" />
        {/* the usual: a ring at the centre; the latest: a filled dot, moved by the offset */}
        <span className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[var(--ns-signal)] bg-[color-mix(in_oklab,var(--ns-signal)_5%,var(--ns-panel))]", small ? "size-[8px]" : "size-[11px]")} />
        <span className={cn("absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ns-signal)]", small ? "size-[5px]" : "size-[7px]")} style={{ left: `${50 + o * 40}%` }} />
      </span>
    );
  }
  return (
    <span aria-hidden data-slot="reason-glyph" data-kind="days" data-moved={moved} className={cn("flex h-full w-full items-center justify-between", className)}>
      {g.days.map((d, i) => (
        <span key={i} data-on={d || undefined} className={cn("block shrink-0 rounded-full", small ? "size-[4px]" : "size-[6px]")} style={{ background: d ? "var(--ns-signal)" : d === false ? soft(22) : "transparent", boxShadow: d == null ? `inset 0 0 0 1px ${soft(28)}` : undefined }} />
      ))}
    </span>
  );
}

/** A judging word with its glyph before it, for a list row; the word is what a screen reader hears. */
function ReasonWord({ word, glyph, className }: { word: string; glyph: Glyph; className?: string | undefined }) {
  return (
    <span data-slot="reason-word" className={cn("inline-flex items-center gap-2 whitespace-nowrap", className)}>
      <span className="inline-block h-3.5 w-9 shrink-0">
        <ReasonGlyph glyph={glyph} small />
      </span>
      <span>{word}</span>
    </span>
  );
}

export { ReasonGlyph, ReasonWord, arcAt, glyphMoved, type Glyph };
