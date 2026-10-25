// Notchset sparkline 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { smoothPath } from "@/lib/notchset/curve";

/*
 * Sparkline: a trend at a glance, with no axes. kind="line" is the chart family's line in small (components/chart):
 * a smooth 1.5px line in the series hue over a wash that fades to the surface, ending in a dot (a figure's history
 * under a KPI); kind="bars" is one bar per period (a record's activity), in the series tint with the chart family's
 * finish (rounded tops, fading toward the base), where the last `recent` bars are the full series hue and a run of
 * silent periods turns the bars to the warning colour. The words beside
 * it carry the number; `label` says what the shape shows for screen readers.
 */
type SparklineProps = {
  values: number[];
  label: string;
  kind?: "line" | "bars" | undefined;
  /** bars: how many of the last periods count as recent (drawn stronger). */
  recent?: number | undefined;
  /** bars: this many silent periods at the end turn the bars to the warning colour. */
  quietAfter?: number | undefined;
  className?: string | undefined;
};

function Sparkline({ values, label, kind = "line", recent = 1, quietAfter = 6, className }: SparklineProps) {
  const wash = `ns-wash${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  if (kind === "bars") {
    const hi = Math.max(...values, 1);
    const quiet = values.length >= quietAfter && values.slice(-quietAfter).every((v) => !v);
    return (
      <span data-slot="sparkline" data-quiet={quiet || undefined} role="img" aria-label={label} className={cn("flex h-4 items-end gap-0.5", className)}>
        {values.map((v, i) => (
          <i
            key={i}
            data-ns-fill="column"
            style={{ height: `${v ? Math.max(18, Math.round((v / hi) * 100)) : 7}%`, "--ns-fill": quiet ? "var(--ns-warn)" : i >= values.length - recent ? "var(--ns-series)" : "color-mix(in oklab, var(--ns-series) calc(var(--ns-series-tint) * 1.6), var(--ns-panel))" } as React.CSSProperties}
            className={cn("block min-h-0.5 w-[3px] rounded-t-[1.5px]", quiet && (i >= values.length - recent ? "opacity-80" : "opacity-35"))}
          />
        ))}
      </span>
    );
  }
  const w = 220;
  const h = 28;
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  const pts = values.map((v, i) => [(i * w) / Math.max(1, values.length - 1), h - 3 - ((v - lo) / (hi - lo || 1)) * (h - 6)] as [number, number]);
  const d = smoothPath(pts);
  const last = pts.at(-1);
  return (
    <span data-slot="sparkline" role="img" aria-label={label} className={cn("relative block h-7 w-full", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden className="block h-full w-full overflow-visible">
        <defs>
          <linearGradient id={wash} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--ns-series)" stopOpacity="0.16" />
            <stop offset="1" stopColor="var(--ns-series)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d}L${w} ${h}L0 ${h}Z`} fill={`url(#${wash})`} />
        <path d={d} fill="none" stroke="var(--ns-series)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {last && <i aria-hidden className="absolute block size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ns-series)] shadow-[0_0_0_1.5px_var(--ns-panel)]" style={{ left: "100%", top: `${(last[1] / h) * 100}%` }} />}
    </span>
  );
}

export { Sparkline, type SparklineProps };
