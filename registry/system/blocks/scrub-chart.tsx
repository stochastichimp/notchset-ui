// Notchset scrub-chart 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { RollingNumber } from "@/components/ui/notchset/rolling-number";
import { ChartPill, InkArea, smoothPath, useChartWidth } from "@/components/ui/notchset/chart";

/*
 * Scrub chart: one figure over time against a target. Drag across it (or use the arrow keys) and the headline
 * rolls to that point, with how far it sits from the target in words. One line, one dashed target, a hairline
 * cursor; the number is always written, so colour is never the only signal. The last point is where it rests.
 *
 *   <ScrubChart title="Revenue won" points={[{ label: "Jan", value: 42000 }, …]} target={60000} format={money} />
 *
 * Data: values may be negative (the scale runs from the lowest of the values, the target and zero to the highest, and
 * the area fills to zero); a value that isn't a finite number is left out. With no points it says so instead of
 * drawing. The cursor rests on the newest point; a point you pick stays picked (by its label) while the points
 * change, and when it's gone the cursor goes back to the newest.
 */
type ScrubPoint = { label: string; value: number };
type ScrubChartProps = {
  title: string;
  points: ScrubPoint[];
  /** one target for every point, drawn as a dashed line */
  target?: number | undefined;
  format: (v: number) => string;
  className?: string | undefined;
};

const W = 600, H = 200, PAD = 8;

function ScrubChart({ title, points: given, target, format, className }: ScrubChartProps) {
  const points = given.filter((q) => Number.isFinite(q.value));
  const last = points.length - 1;
  /* the label picked, or null to rest on the newest point */
  const [picked, setPicked] = React.useState<string | null>(null);
  const found = picked == null ? -1 : points.findIndex((q) => q.label === picked);
  const at = found >= 0 ? found : last;
  const setAt = (i: number | null) => setPicked(i == null || i === last ? null : (points[i]?.label ?? null));
  const [box, BW, boxEl] = useChartWidth<HTMLDivElement>(600);
  const [reading, setReading] = React.useState(false);
  const t = target != null && Number.isFinite(target) ? target : undefined;
  /* a signed scale: zero, the target and every value sit inside the plot */
  const vals = [...points.map((q) => q.value), t ?? 0, 0];
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = (hi - lo) * 1.08 || 1, base = lo < 0 ? lo - (hi - lo) * 0.04 : 0;
  const x = (i: number) => PAD + (i / Math.max(1, last)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - base) / span) * (H - PAD * 2);
  if (!points.length)
    return (
      <div data-slot="scrub-chart" className={cn("flex w-full flex-col gap-2", className)}>
        <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">{title}</span>
        <p className="m-0 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">Nothing to show yet. Each period&rsquo;s figure appears here as it comes in.</p>
      </div>
    );
  const line = smoothPath(points.map((q, i) => [x(i), y(q.value)]));
  const area = `${line}L${x(last)} ${y(0).toFixed(1)}L${x(0)} ${y(0).toFixed(1)}Z`;
  const p = points[at]!;
  const gap = t != null ? p.value - t : null;
  const pick = (clientX: number) => {
    const r = boxEl?.getBoundingClientRect();
    if (!r || !r.width) return;
    setAt(Math.round(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * last));
  };
  const words = `${p.label}: ${format(p.value)}${gap != null ? `, ${format(Math.abs(gap))} ${gap >= 0 ? "above" : "below"} target` : ""}`;
  return (
    <div data-slot="scrub-chart" className={cn("flex w-full flex-col gap-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">
            {title} · {p.label}
          </span>
          <RollingNumber value={format(p.value)} className="font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-figure)] leading-none font-[number:var(--ns-weight-strong)] text-[var(--ns-ink)]" />
        </div>
        {gap != null && (
          <span className={cn("text-[length:var(--ns-text-small)] tabular-nums", gap >= 0 ? "text-[var(--ns-ok-ink)]" : "text-[var(--ns-ink-2)]")}>
            {gap >= 0 ? "+" : "−"}
            {format(Math.abs(gap))} {gap >= 0 ? "above" : "below"} target
          </span>
        )}
      </div>
      <div
        ref={box}
        role="slider"
        tabIndex={0}
        aria-label={`${title}, scrub through the period`}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={at}
        aria-valuetext={words}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setReading(true);
          pick(e.clientX);
        }}
        onPointerMove={(e) => (e.buttons || e.pointerType === "mouse" ? (setReading(true), pick(e.clientX)) : undefined)}
        onPointerLeave={(e) => {
          setReading(false);
          if (e.pointerType === "mouse") setAt(null);
        }}
        onFocus={() => setReading(true)}
        onBlur={() => setReading(false)}
        onKeyDown={(e) => {
          const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "Home" ? -last : e.key === "End" ? last : 0;
          if (!step) return;
          e.preventDefault();
          setAt(Math.min(last, Math.max(0, at + step)));
        }}
        className="relative w-full cursor-crosshair touch-none rounded-[10px] outline-hidden select-none focus-visible:shadow-[0_0_0_2px_var(--ns-signal)]"
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className="block h-[180px] w-full overflow-visible">
          <InkArea d={area} top={0} bottom={H} />
          <path d={line} fill="none" stroke="var(--ns-series)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {t != null && <line x1={0} x2={W} y1={y(t)} y2={y(t)} stroke="var(--ns-ink-3)" strokeWidth={1.5} strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />}
          <line x1={x(at)} x2={x(at)} y1={0} y2={H} stroke="var(--ns-ink)" strokeOpacity={reading ? 0.26 : 0} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
        {/* the point as an HTML halo, so it stays round however the chart stretches */}
        <i
          aria-hidden
          data-ns-glide=""
          className="pointer-events-none absolute size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ns-series)] shadow-[0_0_0_2.5px_var(--ns-panel),0_0_0_9px_color-mix(in_oklab,var(--ns-series)_16%,transparent),0_0_18px_8px_color-mix(in_oklab,var(--ns-series)_14%,transparent)] [transition:left_90ms_linear,top_90ms_linear]"
          style={{ left: `${(x(at) / W) * 100}%`, top: `${(y(p.value) / H) * 180}px` }}
        />
        <ChartPill x={(x(at) / W) * BW} y={(y(p.value) / H) * 180} width={BW} on={reading} value={format(p.value)} detail={p.label} />
        <div aria-hidden className="mt-2 flex justify-between font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">
          <span>{points[0]?.label}</span>
          {t != null && <span>Target {format(t)}</span>}
          <span>{points[last]?.label}</span>
        </div>
      </div>
    </div>
  );
}

export { ScrubChart, type ScrubChartProps, type ScrubPoint };
