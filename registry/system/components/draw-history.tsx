// Notchset draw-history 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChartHalo, ChartTable, ChartTableToggle, useChartWidth } from "@/components/ui/notchset/chart";

/*
 * Draw history: where a lab value stands and how it got there. On top, one segmented standing bar (low, in range,
 * optimal, in range, high), the latest value a haloed dot on it and the draw before a hollow ring. Under it the draws
 * themselves: large dated dots on a calm line, each with its value, over the optimal band and the lab's lower limit;
 * a planned retest waits as a dotted ring at its date. Few points, so every one is named; the table carries them too.
 *
 *   <DrawHistory label="Vitamin D" unit="ng/mL" segments={[{ from: 10, to: 30, label: "Low", tone: "out" }, …]}
 *     draws={[{ t: 0, date: "25 Mar", value: 23 }, { t: 205, date: "16 Oct", value: 41 }]}
 *     band={{ low: 40, high: 60, label: "Optimal" }} floor={{ value: 30, label: "Low" }} next={{ t: 325, date: "13 Feb" }} />
 */
type DrawSegment = { from: number; to: number; label: string; tone: "out" | "in" | "optimal" };
type Draw = { t: number; date: string; value: number };
type DrawHistoryProps = {
  label: string;
  unit: string;
  segments: DrawSegment[];
  /** oldest first; `t` is any time unit (days), for spacing */
  draws: Draw[];
  band?: { low: number; high: number; label: string } | undefined;
  floor?: { value: number; label: string } | undefined;
  next?: { t: number; date: string } | undefined;
  format?: ((v: number) => string) | undefined;
  className?: string | undefined;
};

const SEG_FILL = { out: "var(--ns-warn)", in: "var(--ns-ink-3)", optimal: "var(--ns-ok)" } as const;
const SEG_ALPHA = { out: 0.5, in: 0.35, optimal: 0.6 } as const;

function DrawHistory({ label, unit, segments, draws, band, floor, next, format = String, className }: DrawHistoryProps) {
  const [box, W] = useChartWidth<HTMLDivElement>(720);
  const [table, setTable] = React.useState(false);
  const lo = segments[0]?.from ?? 0,
    hi = segments.at(-1)?.to ?? 1;
  const SX = (v: number) => 4 + ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (W - 8);
  const latest = draws.at(-1);
  const prev = draws.at(-2);
  /* the history: time across, value up */
  const L = W < 520 ? 44 : 72,
    R = W < 520 ? 24 : 72;
  const t0 = draws[0]?.t ?? 0,
    t1 = Math.max(next?.t ?? 0, latest?.t ?? 1, t0 + 1);
  const TX = (t: number) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const vals = [...draws.map((d) => d.value), ...(band ? [band.low, band.high] : []), ...(floor ? [floor.value] : [])];
  const vlo = Math.min(...vals),
    vhi = Math.max(...vals);
  const pad = (vhi - vlo || 1) * 0.16;
  const H = 300,
    top = 96,
    base = H - 34;
  const VY = (v: number) => base - ((v - (vlo - pad)) / (vhi - vlo + 2 * pad)) * (base - top);
  const pts = draws.map((d) => [TX(d.t), VY(d.value)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const gid = `dh${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const where = latest ? segments.find((s) => latest.value >= s.from && latest.value <= s.to) : undefined;
  const summary = `${label}: ${latest ? `latest ${format(latest.value)} ${unit} on ${latest.date}${where ? `, ${where.label.toLowerCase()}` : ""}` : "no draws yet"}${draws.length > 1 ? `; earlier ${draws.slice(0, -1).map((d) => `${format(d.value)} on ${d.date}`).join(", ")}` : ""}${next ? `; retest ${next.date}` : ""}.`;
  return (
    <div data-slot="draw-history" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div ref={box} role="img" aria-label={summary} className="relative min-w-0" style={{ height: H }}>
        <svg width={W} height={H} className="block overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={`${gid}l`} x1="0" x2="1">
              <stop offset="0" stopColor="var(--ns-series)" stopOpacity={0.35} />
              <stop offset="1" stopColor="var(--ns-series)" />
            </linearGradient>
          </defs>
          {segments.map((s) => (
            <rect key={`${s.from}-${s.to}`} x={SX(s.from) + 1.5} y={22} width={Math.max(1, SX(s.to) - SX(s.from) - 3)} height={8} rx={4} fill={SEG_FILL[s.tone]} fillOpacity={SEG_ALPHA[s.tone]} />
          ))}
          {prev && <circle cx={SX(prev.value)} cy={26} r={4.5} fill="var(--ns-canvas)" stroke="var(--ns-ink-3)" strokeWidth={1.25} />}
          {band && <rect x={L} y={VY(band.high)} width={W - L - R} height={Math.max(1, VY(band.low) - VY(band.high))} rx={4} fill="var(--ns-ok)" fillOpacity={0.08} />}
          {band && <line x1={L} x2={W - R} y1={VY(band.low)} y2={VY(band.low)} stroke="var(--ns-ok)" strokeOpacity={0.35} />}
          {floor && <line x1={L} x2={W - R} y1={VY(floor.value)} y2={VY(floor.value)} stroke="var(--ns-ink-3)" strokeOpacity={0.5} strokeDasharray="2 4" />}
          {pts.length > 1 && <path d={line} fill="none" stroke={`url(#${gid}l)`} strokeWidth={1.5} />}
          {latest && next && <line x1={pts.at(-1)![0] + 12} x2={TX(next.t) - 10} y1={pts.at(-1)![1]} y2={pts.at(-1)![1]} stroke="var(--ns-ink-3)" strokeDasharray="2 4" />}
          {next && latest && <circle cx={TX(next.t)} cy={pts.at(-1)![1]} r={8} fill="none" stroke="var(--ns-ink-3)" strokeDasharray="2 2.4" />}
          {pts.slice(0, -1).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={5.5} fill="var(--ns-canvas)" stroke="var(--ns-series)" strokeWidth={2} />
          ))}
        </svg>
        {latest && <ChartHalo x={SX(latest.value)} y={26} />}
        {latest && <ChartHalo x={pts.at(-1)![0]} y={pts.at(-1)![1]} />}
        <div aria-hidden className="font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-ink-3)]">
          {segments.slice(1).map((s) => (
            <span key={s.from} className="absolute -translate-x-1/2" style={{ left: SX(s.from), top: 2 }}>
              {format(s.from)}
            </span>
          ))}
          {segments.map((s) =>
            SX(s.to) - SX(s.from) > 44 ? (
              <span key={`l${s.from}`} className={cn("absolute -translate-x-1/2 whitespace-nowrap", s.tone === "optimal" && "font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]")} style={{ left: (SX(s.from) + SX(s.to)) / 2, top: 40 }}>
                {s.label}
              </span>
            ) : null,
          )}
          {band && L >= 60 && (
            <span className="absolute left-0" style={{ top: VY((band.low + band.high) / 2) - 6 }}>
              {band.label}
            </span>
          )}
          {floor && L >= 60 && (
            <span className="absolute left-0" style={{ top: VY(floor.value) - 6 }}>
              {`${floor.label} ${format(floor.value)}`}
            </span>
          )}
          {draws.map((d, i) => (
            <React.Fragment key={d.t}>
              <span className={cn("absolute -translate-x-1/2 font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-strong)] tabular-nums", i === draws.length - 1 ? "text-[var(--ns-ink)]" : "text-[var(--ns-ink-2)]")} style={{ left: pts[i]![0], top: d.value < (vlo + vhi) / 2 && i < draws.length - 1 ? pts[i]![1] + 12 : pts[i]![1] - 30 }}>
                {format(d.value)}
              </span>
              <span className={cn("absolute -translate-x-1/2 whitespace-nowrap", i === draws.length - 1 && "text-[var(--ns-ink)]")} style={{ left: pts[i]![0], top: base + 16 }}>
                {d.date}
              </span>
            </React.Fragment>
          ))}
          {next && latest && (
            <span className={cn("absolute whitespace-nowrap", TX(next.t) > W - 60 ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: TX(next.t) > W - 60 ? W : TX(next.t), top: pts.at(-1)![1] + 16 }}>
              {`Retest ${next.date}`}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        <span>{`${draws.length} ${draws.length === 1 ? "draw" : "draws"} · ${unit}`}</span>
        <ChartTableToggle open={table} onToggle={() => setTable(!table)} className="ml-auto" />
      </div>
      <ChartTable open={table} caption={label} head={["Drawn", label]} rows={[...draws].reverse().map((d) => [d.date, `${format(d.value)} ${unit}`])} />
    </div>
  );
}

export { DrawHistory, type Draw, type DrawHistoryProps, type DrawSegment };
