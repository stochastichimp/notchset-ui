// Notchset glucose-day 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChartHalo, ChartTable, ChartTableToggle, InkLine, useChartWidth } from "@/components/ui/notchset/chart";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/*
 * Glucose day: a sensor's day, every 5 minutes, as one luminous line over the target band (a quiet wash, its edges
 * written at the left). Each meal is a grey dot on the line at the time it was eaten, its peak a series dot with the
 * meal and its rise written above ("Lunch +46", or "+46" alone where it would run into the tag before it); a dose is a small grey diamond at the top with its name. Gaps where the sensor lost
 * signal stay open; a day still running stops at now, haloed. The table carries every hour and every meal.
 *
 *   <GlucoseDay label="Glucose, today" values={readings} band={{ low: 70, high: 140 }} format={(v) => `${Math.round(v)} mg/dL`}
 *     meals={[{ at: 98, label: "Breakfast", peak: { at: 104, value: 105, rise: "+19" } }]} doses={[{ at: 96, label: "Semaglutide 0.5 mg" }]} />
 */
type GlucoseDayMeal = { at: number; label: string; peak?: { at: number; value: number; rise: string } | undefined; back?: string | undefined };
type GlucoseDayProps = {
  /** one value per step from midnight (288 for 5 minutes), null where nothing was read */
  values: (number | null)[];
  /** the target band, in the values' unit */
  band: { low: number; high: number };
  format?: ((v: number) => string) | undefined;
  /** meals at their slot, each with its peak (slot, value, the rise in words) and when it came back */
  meals?: GlucoseDayMeal[] | undefined;
  /** doses at their slot, named as logged */
  doses?: { at: number; label: string }[] | undefined;
  /** minutes per value */
  step?: number | undefined;
  label: string;
  height?: number | undefined;
  className?: string | undefined;
};

const clock = (slot: number, step: number) => {
  const m = slot * step;
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

function GlucoseDay({ values, band, format = (v) => String(Math.round(v * 10) / 10), meals = [], doses = [], step = 5, label, height = 240, className }: GlucoseDayProps) {
  const [box, W] = useChartWidth<HTMLDivElement>(720);
  const [table, setTable] = React.useState(false);
  const n = Math.round((24 * 60) / step);
  const known = values.flatMap((v, i) => (v == null ? [] : [i]));
  const vs = known.map((i) => values[i]!);
  const lo = Math.min(band.low - (band.high - band.low) * 0.3, ...vs) * 0.98;
  const hi = Math.max(band.high + (band.high - band.low) * 0.15, ...vs) * 1.02;
  const T = doses.length ? 30 : 14,
    B = height - 28,
    L = 34;
  const X = (i: number) => L + (i / n) * (W - L - 6);
  const Y = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T);
  let d = "";
  let pen = false;
  values.forEach((v, i) => {
    if (v == null) return void (pen = false);
    d += `${pen ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`;
    pen = true;
  });
  const lastI = known.at(-1) ?? -1;
  const at = (i: number) => values[i] ?? values[known.find((k) => k >= i) ?? lastI] ?? null;
  const tir = vs.length ? Math.round((vs.filter((v) => v >= band.low && v <= band.high).length / vs.length) * 100) : null;
  const summary = vs.length
    ? `${label}: ${vs.length} readings, ${tir}% inside the target ${format(band.low)} to ${format(band.high)}, lowest ${format(Math.min(...vs))}, highest ${format(Math.max(...vs))}${meals.length ? `; ${meals.map((m) => `${m.label} at ${clock(m.at, step)}${m.peak ? `, peak ${format(m.peak.value)} (${m.peak.rise}) at ${clock(m.peak.at, step)}` : ""}`).join("; ")}` : ""}${doses.length ? `; ${doses.map((x) => `${x.label} at ${clock(x.at, step)}`).join("; ")}` : ""}.`
    : `${label}: no readings.`;
  const hours = Array.from({ length: 24 }, (_, h) => {
    const i = Math.round((h * 60) / step);
    const v = values.slice(i, i + Math.round(60 / step)).filter((x): x is number => x != null);
    return [`${String(h).padStart(2, "0")}:00`, v.length ? format(v.reduce((a, b) => a + b, 0) / v.length) : "—", [...meals.filter((m) => Math.floor((m.at * step) / 60) === h).map((m) => m.label), ...doses.filter((x) => Math.floor((x.at * step) / 60) === h).map((x) => x.label)].join(", ") || ""];
  });
  const clampX = (x: number) => Math.min(W - 48, Math.max(L + 24, x));
  /* peak tags that would run into the one before them (two meals close together on a phone) say their rise alone
     ("+26"); the meal is still its grey dot, and the summary and the table name it. Widths come from the tags' mono
     advance, measured once it's drawn. */
  const tags = React.useRef<HTMLDivElement>(null);
  const [advance, setAdvance] = React.useState(7.2);
  const measure = React.useCallback(() => {
    const s = tags.current?.querySelector<HTMLElement>("[data-peak]");
    const a = s && s.textContent ? (s.getBoundingClientRect().width - 8) / s.textContent.length : 0;
    if (a > 0) setAdvance((was) => (Math.abs(a - was) > 0.05 ? a : was));
  }, []);
  useIsomorphicLayoutEffect(measure);
  /* the mono face can land after the first paint, and it sets the advance */
  React.useEffect(() => {
    document.fonts?.addEventListener?.("loadingdone", measure);
    return () => document.fonts?.removeEventListener?.("loadingdone", measure);
  }, [measure]);
  const riseOnly = new Set<number>();
  let prev: { right: number; top: number } | null = null;
  for (const m of [...meals].filter((x) => x.peak).sort((a, b) => a.peak!.at - b.peak!.at)) {
    const cx = clampX(X(m.peak!.at));
    const top = Y(m.peak!.value) - 20;
    const width = (text: string) => text.length * advance + 8;
    let w = width(`${m.label} ${m.peak!.rise}`);
    if (prev && Math.abs(top - prev.top) < 18 && cx - w / 2 < prev.right + 4) {
      riseOnly.add(m.at);
      w = width(m.peak!.rise);
    }
    prev = { right: cx + w / 2, top };
  }
  return (
    <div data-slot="glucose-day" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div ref={box} role="img" aria-label={summary} className="relative min-w-0" style={{ height }}>
        <svg width={W} height={height} className="block overflow-visible" aria-hidden>
          <rect x={L} width={W - L} y={Y(band.high)} height={Math.max(1, Y(band.low) - Y(band.high))} rx={6} fill="var(--ns-band-grade)" />
          <line x1={L} x2={W} y1={B + 0.5} y2={B + 0.5} stroke="var(--ns-line-soft)" strokeWidth={1} />
          {meals.map((m) => {
            const v = at(m.at);
            return v == null ? null : <line key={`h${m.at}`} x1={X(m.at)} x2={X(m.at)} y1={Y(v) + 5} y2={B} stroke="var(--ns-ink-3)" strokeWidth={1} strokeDasharray="1 3" opacity={0.6} />;
          })}
          <InkLine d={d} width={2.25} core="var(--ns-series-core)" />
          {meals.map((m) => {
            const v = at(m.at);
            return (
              <g key={`m${m.at}`}>
                {v != null && <circle cx={X(m.at)} cy={Y(v)} r={3.5} fill="var(--ns-ink-2)" stroke="var(--ns-canvas)" strokeWidth={2} />}
                {m.peak && <circle cx={X(m.peak.at)} cy={Y(m.peak.value)} r={3.5} fill="var(--ns-series)" stroke="var(--ns-canvas)" strokeWidth={2} />}
              </g>
            );
          })}
          {doses.map((x) => (
            <rect key={`d${x.at}`} x={X(x.at) - 4} y={8} width={8} height={8} transform={`rotate(45 ${X(x.at)} 12)`} fill="none" stroke="var(--ns-ink-2)" strokeWidth={1.5} />
          ))}
        </svg>
        {lastI >= 0 && lastI < n - 1 && <ChartHalo x={X(lastI)} y={Y(values[lastI]!)} />}
        <div ref={tags} aria-hidden className="font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-ink-3)]">
          {[band.high, band.low].map((v) => (
            <span key={v} className="absolute left-0 -translate-y-1/2 tabular-nums" style={{ top: Y(v) }}>
              {v}
            </span>
          ))}
          {meals.map(
            (m) =>
              m.peak && (
                <span key={`p${m.at}`} data-peak="" className="absolute -translate-x-1/2 rounded-[4px] bg-[var(--ns-canvas)] px-1 whitespace-nowrap text-[var(--ns-ink-2)]" style={{ left: clampX(X(m.peak.at)), top: Y(m.peak.value) - 20 }}>
                  {riseOnly.has(m.at) ? m.peak.rise : `${m.label} ${m.peak.rise}`}
                </span>
              ),
          )}
          {doses.map((x) => (
            <span key={`dl${x.at}`} className="absolute whitespace-nowrap text-[var(--ns-ink-2)]" style={{ left: Math.min(W - 140, X(x.at) + 9), top: 6 }}>
              {x.label}
            </span>
          ))}
          {[0, 6, 12, 18].map((h) => (
              <span key={h} className={cn("absolute", h ? "-translate-x-1/2" : "")} style={{ left: X((h * 60) / step), top: B + 8 }}>
                {`${String(h).padStart(2, "0")}:00`}
              </span>
            ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        <span className="flex items-center gap-1.5">
          <i aria-hidden className="block h-2 w-3 rounded-[2px] bg-[var(--ns-band-grade)] shadow-[inset_0_0_0_0.5px_var(--ns-line)]" />
          Target {band.low}–{band.high}
        </span>
        {meals.length > 0 && (
          <span className="flex items-center gap-1.5">
            <i aria-hidden className="block size-[7px] rounded-full bg-[var(--ns-ink-2)]" />
            Meal
            <i aria-hidden className="ml-1.5 block size-[7px] rounded-full bg-[var(--ns-series)]" />
            Its peak
          </span>
        )}
        {doses.length > 0 && (
          <span className="flex items-center gap-1.5">
            <i aria-hidden className="block size-[7px] rotate-45 border-[1.5px] border-[var(--ns-ink-2)]" />
            Dose
          </span>
        )}
        <ChartTableToggle open={table} onToggle={() => setTable(!table)} className="ml-auto" />
      </div>
      <ChartTable open={table} caption={label} head={["Hour", "Average", "Logged"]} rows={hours} />
    </div>
  );
}

export { GlucoseDay, type GlucoseDayMeal, type GlucoseDayProps };
