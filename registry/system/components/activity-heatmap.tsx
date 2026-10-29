// Notchset activity-heatmap 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChartPill, ChartTable } from "@/components/ui/notchset/chart";

/* the heat ramp's steps over the surface, validated as an ordinal ramp light and dark (the lightest clears 2:1) */
const HEAT_STEPS = [0.55, 0.7, 0.85, 1] as const;

/*
 * Activity heatmap: when work happens, as working days by week. Each cell is a day in a step of a green ramp
 * (none, then four steps up to the busiest); a day still to come is an outline. Focus it and the arrows walk the
 * days (← → a week, ↑ ↓ a day) with a dark pill naming the day and its count; a key says less to more, and a chip
 * says the longest streak of working days with something done.
 *
 *   <ActivityHeatmap weeks={[[2, 0, 3, 1, 4], …]} labels={[["Mon, Aug 3", …], …]} unit={(n) => `${n} moves`} />
 *
 * weeks: oldest first, each five working days Monday to Friday; null for a day still to come.
 */
type ActivityHeatmapProps = {
  weeks: (number | null)[][];
  /** each day's name, in the same shape as weeks ("Mon, Aug 3") */
  labels: string[][];
  label: string;
  unit?: ((n: number) => string) | undefined;
  className?: string | undefined;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function ActivityHeatmap({ weeks, labels, label, unit = (n) => `${n} ${n === 1 ? "move" : "moves"}`, className }: ActivityHeatmapProps) {
  const [cur, setCur] = React.useState<[number, number] | null>(null);
  const grid = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(360);
  React.useEffect(() => {
    const el = grid.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  /* the real busiest day (for the spoken summary) is not the colour denominator (never below 1, so a zero stays pale);
     with no day known at all (no weeks, or only days still to come) there is nothing to read, so it is not a control */
  const known = weeks.flat().filter((v): v is number => v != null);
  const empty = known.length === 0;
  const busiest = Math.max(0, ...known);
  const most = Math.max(1, busiest);
  const level = (v: number | null) => (v == null ? -1 : v === 0 ? 0 : Math.min(4, Math.ceil((v / most) * 4)));
  /* a sequential green ramp, light to dark: the heat role (the Done green) mixed into the surface in four validated
     steps, light and dark (LANGUAGE.md §9) */
  const fill = (l: number) => (l < 1 ? undefined : { background: `color-mix(in srgb, var(--ns-heat) ${Math.round((HEAT_STEPS[l - 1] ?? 1) * 100)}%, var(--ns-panel))` });
  const n = weeks.length;
  let streak = 0;
  {
    let run = 0;
    for (const v of weeks.flat()) {
      if (v == null) continue;
      run = v > 0 ? run + 1 : 0;
      streak = Math.max(streak, run);
    }
  }
  const cell = Math.max(10, Math.min(24, (W - 34 - (n - 1) * 3) / Math.max(1, n)));
  const at = cur ? weeks[cur[0]]?.[cur[1]] : undefined;
  const move = (dw: number, dd: number) => {
    const lastWeek = weeks[n - 1] ?? [];
    let lastDay = 0;
    lastWeek.forEach((v, k) => v != null && (lastDay = k));
    const [w, d] = cur ?? [n - 1, lastDay];
    let nw = Math.max(0, Math.min(n - 1, w + dw)), nd = Math.max(0, Math.min(4, d + dd));
    if (weeks[nw]?.[nd] == null) [nw, nd] = [w, d];
    setCur([nw, nd]);
  };
  return (
    <div data-slot="activity-heatmap" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div
        ref={grid}
        role={empty ? "img" : "slider"}
        tabIndex={empty ? undefined : 0}
        aria-label={empty ? `${label}. No activity recorded yet.` : `${label}. Arrow keys read each day.`}
        aria-valuemin={empty ? undefined : 0}
        aria-valuemax={empty ? undefined : n * 5 - 1}
        aria-valuenow={empty ? undefined : cur ? cur[0] * 5 + cur[1] : n * 5 - 1}
        aria-valuetext={empty ? undefined : cur && at != null ? `${labels[cur[0]]?.[cur[1]] ?? ""}: ${unit(at)}` : `${n} weeks; the busiest day had ${unit(busiest)}`}
        onKeyDown={(e) => {
          if (empty) return;
          const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key] as [number, number] | undefined;
          if (e.key === "Escape") return setCur(null);
          if (!d) return;
          e.preventDefault();
          move(d[0], d[1]);
        }}
        onBlur={() => setCur(null)}
        onPointerLeave={() => setCur(null)}
        className="relative grid w-full gap-[3px] rounded-[8px] outline-hidden focus-visible:shadow-[0_0_0_2px_var(--ns-signal)]"
        style={{ gridTemplateColumns: `30px repeat(${n}, ${cell}px)`, gridTemplateRows: `repeat(5, ${cell}px)` }}
      >
        {DAYS.map((d, k) => (
          <span key={d} aria-hidden className="self-center font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-ink-3)]" style={{ gridColumn: 1, gridRow: k + 1, visibility: k % 2 ? "hidden" : undefined }}>
            {d}
          </span>
        ))}
        {weeks.map((wk, w) =>
          wk.map((v, d) => {
            const l = level(v);
            const on = cur?.[0] === w && cur[1] === d;
            return (
              <i
                key={`${w}-${d}`}
                aria-hidden
                onPointerEnter={() => v != null && !empty && setCur([w, d])}
                className={cn("block rounded-[3px]", l < 0 ? "opacity-50 shadow-[inset_0_0_0_1px_var(--ns-line-soft)]" : l === 0 ? "bg-[var(--ns-well)] shadow-[inset_0_0_0_1px_var(--ns-line-soft)]" : "", on && "shadow-[0_0_0_1.5px_var(--ns-ink)]")}
                style={{ gridColumn: w + 2, gridRow: d + 1, ...fill(l) }}
              />
            );
          }),
        )}
        {cur && at != null && <ChartPill x={30 + cur[0] * (cell + 3) + cell / 2} y={cur[1] * (cell + 3)} width={W} on value={unit(at)} detail={labels[cur[0]]?.[cur[1]]} />}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        {/* the longest unbroken run of working days with something done, as a small chip */}
        <span data-slot="streak" className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[var(--ns-ink-2)] shadow-[inset_0_0_0_1px_var(--ns-line)]">
          <i aria-hidden className="block size-2 rounded-[2px]" style={fill(3)} />
          Longest streak · <b className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] tabular-nums">{streak} {streak === 1 ? "day" : "days"}</b>
        </span>
        <span aria-hidden className="flex items-center gap-[3px]">
        <span className="mr-1">Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} className={cn("block size-2.5 rounded-[3px]", l === 0 && "bg-[var(--ns-well)] shadow-[inset_0_0_0_1px_var(--ns-line-soft)]")} style={fill(l)} />
        ))}
        <span className="ml-1">More</span>
        </span>
      </div>
      <ChartTable caption={label} head={["Day", "Count"]} rows={weeks.flatMap((wk, w) => wk.flatMap((v, d) => (v == null ? [] : [[labels[w]?.[d] ?? "", v]])))} />
    </div>
  );
}

export { ActivityHeatmap, type ActivityHeatmapProps };
