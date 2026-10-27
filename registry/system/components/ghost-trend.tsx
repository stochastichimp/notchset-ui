// Notchset ghost-trend 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChartHalo, ChartTable, ChartTableToggle, InkLine, useChartWidth } from "@/components/ui/notchset/chart";

/*
 * Ghost trend: this period's line, luminous, over the period before as a dashed ghost, on your usual band, with the
 * period's average as a dashed hairline and the latest point haloed. A second signal (an overlay) joins as a quiet
 * ink trace on the same time axis, never a second axis: when there is one, the caller plots both as "% from your
 * usual" (pctFromUsual) so one honest axis carries them. Gaps stay gaps, or (`gaps="dotted"`, a day's readings) are
 * bridged by a quiet dotted segment; `pins` marks the lowest and highest values; `marks` are events on the time axis
 * (a logged dose) as small grey diamonds along the top, named in the key. The table carries every point.
 *
 *   <GhostTrend label="HRV, this month" points={[{ label: "26 Sep", value: 52 }, …]} ghost={[50, …]}
 *     band={{ low: 47, high: 55 }} avg={54} format={(v) => `${v} ms`} />
 */
type GhostTrendPoint = { label: string; value: number | null };
type GhostTrendProps = {
  points: GhostTrendPoint[];
  /** the period before, point for point */
  ghost?: (number | null)[] | undefined;
  /** your usual, drawn as a soft band */
  band?: { low: number; high: number } | undefined;
  avg?: number | null | undefined;
  /** a second signal on the same axis, as a quiet ink trace */
  overlay?: { name: string; values: (number | null)[] } | undefined;
  format?: ((v: number) => string) | undefined;
  /** the chart's name, "HRV, this month" */
  label: string;
  nowName?: string | undefined;
  ghostName?: string | undefined;
  height?: number | undefined;
  /** "dotted" bridges a gap inside the line with a quiet dotted segment (a day's ring readings); default leaves it open */
  gaps?: "open" | "dotted" | undefined;
  /** pin the lowest and the highest value on the line, each with its value and when */
  pins?: boolean | undefined;
  /** events at a point (a logged dose), drawn as small diamonds along the top; `marksName` names them in the key */
  marks?: { at: number; label: string }[] | undefined;
  marksName?: string | undefined;
  /** label every nth point on the time axis (default: about six labels) */
  labelEvery?: number | undefined;
  className?: string | undefined;
};

/** Values as their % difference from the middle of your usual, so two signals share one honest axis. */
function pctFromUsual(values: (number | null)[], usual: { low: number; high: number }): (number | null)[] {
  const mid = (usual.low + usual.high) / 2 || 1;
  return values.map((v) => (v == null ? null : Math.round(((v - mid) / mid) * 1000) / 10));
}

const pathOf = (vals: (number | null)[], X: (i: number) => number, Y: (v: number) => number) => {
  let d = "";
  let pen = false;
  vals.forEach((v, i) => {
    if (v == null) return void (pen = false);
    d += `${pen ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`;
    pen = true;
  });
  return d;
};

/** The dotted bridges over the gaps inside a line (never before its first value or after its last). */
const bridgesOf = (vals: (number | null)[], X: (i: number) => number, Y: (v: number) => number) => {
  let d = "";
  let last = -1;
  vals.forEach((v, i) => {
    if (v == null) return;
    if (last >= 0 && i - last > 1) d += `M${X(last).toFixed(1)} ${Y(vals[last]!).toFixed(1)}L${X(i).toFixed(1)} ${Y(v).toFixed(1)}`;
    last = i;
  });
  return d;
};

function GhostTrend({ points, ghost, band, avg, overlay, format = String, label, nowName = "This period", ghostName = "The period before", height = 260, gaps = "open", pins = false, marks = [], marksName = "Logged", labelEvery, className }: GhostTrendProps) {
  const [box, W] = useChartWidth<HTMLDivElement>(720);
  const [table, setTable] = React.useState(false);
  const vals = points.map((p) => p.value);
  const all = [...vals, ...(ghost ?? []), ...(overlay?.values ?? []), ...(band ? [band.low, band.high] : []), ...(avg != null ? [avg] : [])].filter((v): v is number => v != null);
  const lo0 = all.length ? Math.min(...all) : 0;
  const hi0 = all.length ? Math.max(...all) : 1;
  const pad = (hi0 - lo0 || 1) * 0.18;
  const lo = lo0 - pad,
    hi = hi0 + pad;
  const T = marks.length ? 30 : 18,
    B = height - 30;
  const n = Math.max(1, points.length - 1);
  const X = (i: number) => 6 + (i / n) * (W - 12);
  const Y = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T);
  const lastI = vals.reduce((a: number, v, i) => (v != null ? i : a), -1);
  /* a given step doubles until its labels sit at least 64px apart (a day's 3-hourly labels become 6-hourly on a phone) */
  let every = labelEvery ?? Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(W / 72))));
  while (labelEvery && every < points.length && (every / n) * (W - 12) < 64) every *= 2;
  const latest = lastI >= 0 ? vals[lastI]! : null;
  const known = vals.flatMap((v, i) => (v == null ? [] : [i]));
  const minI = pins && known.length > 1 ? known.reduce((a, i) => (vals[i]! < vals[a]! ? i : a)) : -1;
  const maxI = pins && known.length > 1 ? known.reduce((a, i) => (vals[i]! > vals[a]! ? i : a)) : -1;
  const hasGaps = gaps === "dotted" && known.some((i, j) => j > 0 && i - known[j - 1]! > 1);
  /* the average's label sits at the right edge, above its line unless a line passes there, then below */
  const avgSide = (() => {
    if (avg == null) return "above";
    const ya = Y(avg);
    const near = [vals, ghost ?? []].flatMap((vs) => vs.flatMap((v, i) => (v != null && X(i) > W - 96 ? [Y(v)] : [])));
    if (lastI >= 0 && X(lastI) > W - 96) near.push(Y(latest!) - 6, Y(latest!) + 6);
    const hits = (a: number, b: number) => near.filter((y) => y >= a && y <= b).length;
    return hits(ya - 20, ya - 1) <= hits(ya + 1, ya + 20) ? "above" : "below";
  })();
  const pinX = (i: number) => Math.min(W - 74, Math.max(74, X(i)));
  const summary = `${label}: ${latest != null ? `latest ${format(latest)}` : "no readings"}${avg != null ? `, average ${format(avg)}` : ""}${band ? `, your usual ${format(band.low)} to ${format(band.high)}` : ""}${ghost?.some((v) => v != null) ? `, ${ghostName.toLowerCase()} drawn as a dashed line` : ""}${overlay ? `, with ${overlay.name} on the same axis` : ""}${minI >= 0 ? `, lowest ${format(vals[minI]!)} at ${points[minI]!.label}, highest ${format(vals[maxI]!)} at ${points[maxI]!.label}` : ""}${hasGaps ? ", gaps where the ring was off drawn dotted" : ""}${marks.length ? `; ${marks.map((m) => `${m.label} at ${points[m.at]?.label ?? ""}`).join("; ")}` : ""}.`;
  return (
    <div data-slot="ghost-trend" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div ref={box} role="img" aria-label={summary} className="relative min-w-0" style={{ height }}>
        <svg width={W} height={height} className="block overflow-visible" aria-hidden>
          {band && <rect x={0} width={W} y={Y(band.high)} height={Math.max(1, Y(band.low) - Y(band.high))} rx={6} fill="var(--ns-band-grade)" />}
          {avg != null && <line x1={0} x2={W} y1={Y(avg)} y2={Y(avg)} stroke="var(--ns-ink-3)" strokeWidth={1} strokeDasharray="4 4" />}
          {ghost && <InkLine d={pathOf(ghost, X, Y)} tone="quiet" dashed width={1.5} glow={false} />}
          {overlay && <InkLine d={pathOf(overlay.values, X, Y)} tone="ink" width={1.25} glow={false} className="opacity-55" />}
          {hasGaps && <path d={bridgesOf(vals, X, Y)} fill="none" stroke="var(--ns-ink-3)" strokeWidth={1.25} strokeDasharray="0.5 4" strokeLinecap="round" />}
          <InkLine d={pathOf(vals, X, Y)} width={2.25} core="var(--ns-series-core)" />
          {marks.map((m, j) => (
            <rect key={`mk${j}`} x={X(m.at) - 4} y={8} width={8} height={8} transform={`rotate(45 ${X(m.at)} 12)`} fill="none" stroke="var(--ns-ink-2)" strokeWidth={1.5} />
          ))}
          {[minI, maxI].map((i) => i >= 0 && <circle key={i} cx={X(i)} cy={Y(vals[i]!)} r={3.5} fill="var(--ns-series)" stroke="var(--ns-canvas)" strokeWidth={2} />)}
        </svg>
        {[minI, maxI].map(
          (i, j) =>
            i >= 0 && (
              <span key={j} aria-hidden data-slot="ghost-trend-pin" className="absolute -translate-x-1/2 rounded-[4px] bg-[var(--ns-canvas)] px-1 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none whitespace-nowrap text-[var(--ns-ink-2)]" style={{ left: pinX(i), top: j ? Y(vals[i]!) - 22 : Y(vals[i]!) + 10 }}>
                {`${j ? "high" : "low"} ${format(vals[i]!)} · ${points[i]!.label}`}
              </span>
            ),
        )}
        {lastI >= 0 && <ChartHalo x={X(lastI)} y={Y(latest!)} />}
        {avg != null && (
          <span aria-hidden className="absolute right-0 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-ink-3)]" style={{ top: avgSide === "above" ? Y(avg) - 16 : Y(avg) + 6 }}>
            avg {format(avg)}
          </span>
        )}
        <div aria-hidden className="absolute inset-x-0 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]" style={{ top: B + 12 }}>
          {points.map((p, i) =>
            i % every === 0 || i === points.length - 1
              ? (i === points.length - 1 || X(points.length - 1) - X(i) >= 72) && (
                  <span key={i} className={cn("absolute whitespace-nowrap", i === 0 ? "" : i === points.length - 1 ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: X(i) }}>
                    {p.label}
                  </span>
                )
              : null,
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        <span className="flex items-center gap-1.5">
          <i aria-hidden className="block h-[2px] w-3 rounded-full bg-[var(--ns-series)]" />
          {nowName}
        </span>
        {ghost && (
          <span className="flex items-center gap-1.5">
            <i aria-hidden className="block w-3 border-t-[1.5px] border-dotted border-[var(--ns-ink-3)]" />
            {ghostName}
          </span>
        )}
        {hasGaps && (
          <span className="flex items-center gap-1.5">
            <i aria-hidden className="block w-3 border-t-[1.5px] border-dotted border-[var(--ns-ink-3)]" />
            Ring off
          </span>
        )}
        {marks.length > 0 && (
          <span className="flex items-center gap-1.5">
            <i aria-hidden className="block size-[7px] rotate-45 border-[1.5px] border-[var(--ns-ink-2)]" />
            {marksName}
          </span>
        )}
        {overlay && (
          <span className="flex items-center gap-1.5">
            <i aria-hidden className="block h-px w-3 bg-[var(--ns-ink-2)]" />
            {overlay.name}
          </span>
        )}
        {band && (
          <span className="flex items-center gap-1.5">
            <i aria-hidden className="block h-2 w-3 rounded-[2px] bg-[var(--ns-band-grade)] shadow-[inset_0_0_0_0.5px_var(--ns-line)]" />
            Your usual
          </span>
        )}
        <ChartTableToggle open={table} onToggle={() => setTable(!table)} className="ml-auto" />
      </div>
      <ChartTable
        open={table}
        caption={label}
        head={["When", nowName, ...(ghost ? [ghostName] : []), ...(overlay ? [overlay.name] : [])]}
        rows={points.map((p, i) => [p.label, p.value == null ? "—" : format(p.value), ...(ghost ? [ghost[i] == null ? "—" : format(ghost[i]!)] : []), ...(overlay ? [overlay.values[i] == null ? "—" : format(overlay.values[i]!)] : [])])}
      />
    </div>
  );
}

export { GhostTrend, pctFromUsual, type GhostTrendPoint, type GhostTrendProps };
