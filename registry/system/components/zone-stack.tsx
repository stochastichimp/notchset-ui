// Notchset zone-stack 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChartTable, ChartTableToggle, useChartWidth } from "@/components/ui/notchset/chart";

/*
 * Zone stack: minutes in each heart-rate zone per day, stacked in one tonal ramp of the series hue (zone 1 the
 * lightest, zone 5 the full colour), the day's total over each bar. One hue, so it reads as effort, never as five
 * categories; in Graphite the ramp is grey. Days still to come stay empty.
 *
 *   <ZoneStack label="Minutes by zone, this week" days={[{ label: "Mon", zones: [38, 14, 6, 2, 0] }, …]} />
 */
type ZoneStackDay = { label: string; zones: number[] | null };
type ZoneStackProps = {
  days: ZoneStackDay[];
  label: string;
  /** the day to mark as today (its label in ink) */
  current?: number | undefined;
  height?: number | undefined;
  className?: string | undefined;
};

/** Zone n's fill: the series hue mixed into the surface, lightest first. */
const ZONE_MIX = [22, 38, 58, 80, 100];
const zoneFill = (z: number) => (ZONE_MIX[z] === 100 ? "var(--ns-series)" : `color-mix(in oklab, var(--ns-series) ${ZONE_MIX[z]}%, var(--ns-canvas))`);

function ZoneStack({ days, label, current, height = 200, className }: ZoneStackProps) {
  const [box, W] = useChartWidth<HTMLDivElement>(540);
  const [table, setTable] = React.useState(false);
  const totals = days.map((d) => (d.zones ? d.zones.reduce((a, b) => a + b, 0) : null));
  const max = Math.max(1, ...totals.map((t) => t ?? 0)) * 1.08;
  const gap = W < 400 ? 8 : 14;
  const bw = (W - gap * (days.length - 1)) / days.length;
  const T = 22,
    B = height - 24;
  const k = (B - T) / max;
  const summary = `${label}: ${days.map((d, i) => `${d.label} ${totals[i] == null ? "no data yet" : `${totals[i]} minutes`}`).join(", ")}.`;
  return (
    <div data-slot="zone-stack" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div ref={box} role="img" aria-label={summary} className="relative min-w-0" style={{ height }}>
        <svg width={W} height={height} className="block" aria-hidden>
          {days.map((d, i) => {
            if (!d.zones) return <rect key={i} x={i * (bw + gap)} y={B - 2} width={bw} height={2} rx={1} fill="var(--ns-line)" />;
            let y = B;
            const lastZ = d.zones.reduce((a: number, m, i) => (m > 0 ? i : a), -1);
            return (
              <g key={i}>
                {d.zones.map((m, z) => {
                  if (!m) return null;
                  const h = m * k;
                  y -= h;
                  return <rect key={z} x={i * (bw + gap)} y={y + (z ? 0.75 : 0)} width={bw} height={Math.max(1, h - (z ? 0.75 : 0))} rx={z === lastZ ? Math.min(5, h / 2) : 1.5} fill={zoneFill(z)} />;
                })}
              </g>
            );
          })}
        </svg>
        <div aria-hidden className="font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-ink-3)]">
          {days.map((d, i) => (
            <React.Fragment key={i}>
              {totals[i] != null && (
                <span className={cn("absolute -translate-x-1/2", i === current ? "text-[var(--ns-ink)]" : "text-[var(--ns-ink-2)]")} style={{ left: i * (bw + gap) + bw / 2, top: B - totals[i]! * k - 16 }}>
                  {totals[i]}
                </span>
              )}
              <span className={cn("absolute -translate-x-1/2", i === current && "font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]")} style={{ left: i * (bw + gap) + bw / 2, top: B + 10 }}>
                {d.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        <span>Zone</span>
        {ZONE_MIX.map((_, z) => (
          <span key={z} className="flex items-center gap-1">
            <i aria-hidden className="block size-2 rounded-[2px]" style={{ background: zoneFill(z) }} />
            {z + 1}
          </span>
        ))}
        <ChartTableToggle open={table} onToggle={() => setTable(!table)} className="ml-auto" />
      </div>
      <ChartTable open={table} caption={`${label}, minutes in zones 1 to 5`} head={["Day", "1", "2", "3", "4", "5", "All"]} rows={days.map((d, i) => [d.label, ...(d.zones ?? [null, null, null, null, null]).map((m) => (m == null ? "—" : m)), totals[i] == null ? "—" : totals[i]!])} />
    </div>
  );
}

export { ZoneStack, zoneFill, type ZoneStackDay, type ZoneStackProps };
