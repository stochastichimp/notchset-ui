// Notchset standing-arc 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { formatReading } from "@/lib/notchset/standing";

/*
 * Standing arc: one value against your own usual. A single hairline arc with fine ticks runs from Lower to Higher,
 * your usual is the solid segment on it, and the value is a glass bead sitting on the arc at its place, carrying the
 * number; how far it sits from your usual is the line under it ("+6 ms above your usual"). For a "vs your baseline"
 * reading (HRV against your last 21 nights). A screen reader hears one sentence.
 *
 *   <StandingArc name="HRV" value={61} unit="ms" low={47} high={55} />
 */
type StandingArcProps = {
  name: string;
  value: number;
  unit: string;
  /** your usual range */
  low: number;
  high: number;
  format?: ((n: number) => string) | undefined;
  /** the line under it ("+6 ms above your usual"); off when the host already says it (a delta chip) */
  caption?: boolean | undefined;
  className?: string | undefined;
};

const W = 320, H = 118, R = 240, CY = R + 34, BEAD = 23;

function StandingArc({ name, value, unit, low, high, format = (n) => formatReading(n), caption = true, className }: StandingArcProps) {
  const span = high - low || 1;
  const lo = low - span * 1.3, hi = high + span * 1.3;
  /* ±34° about the top of a large circle: shallow, like a horizon */
  const SWEEP = (34 * Math.PI) / 180;
  const angleOf = (v: number) => -Math.PI / 2 - SWEEP + ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * SWEEP * 2;
  const pt = (a: number, r = R) => [W / 2 + Math.cos(a) * r, CY + Math.sin(a) * r] as const;
  const arc = (a: number, b: number) => {
    const [x1, y1] = pt(a), [x2, y2] = pt(b);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const [bx, by] = pt(angleOf(value));
  const off = value > high ? value - high : value < low ? value - low : 0;
  const where = off === 0 ? "inside your usual" : `${off > 0 ? "+" : "−"}${format(Math.abs(off))} ${unit} ${off > 0 ? "above" : "below"} your usual`;
  const TICKS = 41;
  const [lx, ly] = pt(angleOf(lo)), [rx, ry] = pt(angleOf(hi));
  const [ux, uy] = pt(angleOf((low + high) / 2), R - 14);
  const gid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <figure data-slot="standing-arc" role="img" aria-label={`${name} ${format(value)} ${unit}, ${where}, your usual ${format(low)} to ${format(high)}`} className={cn("m-0 flex w-full max-w-[360px] flex-col items-center gap-1", className)}>
      <div className="relative w-full">
        <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className="block w-full overflow-visible">
          <defs>
            <radialGradient id={`glass${gid}`} cx="36%" cy="28%" r="85%">
              <stop offset="0" stopColor="var(--ns-raised)" stopOpacity="0.95" />
              <stop offset="0.6" stopColor="var(--ns-raised)" stopOpacity="0.62" />
              <stop offset="1" stopColor="var(--ns-raised)" stopOpacity="0.4" />
            </radialGradient>
          </defs>
          {/* the hairline and its fine ticks, outward from it */}
          <path d={arc(angleOf(lo), angleOf(hi))} fill="none" stroke="var(--ns-ink)" strokeOpacity={0.28} strokeWidth={1} />
          {Array.from({ length: TICKS }, (_, i) => {
            const a = -Math.PI / 2 - SWEEP + (i / (TICKS - 1)) * SWEEP * 2;
            const [x1, y1] = pt(a, R + 3), [x2, y2] = pt(a, R + (i % 5 === 0 ? 9 : 6));
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ns-ink)" strokeOpacity={i % 5 === 0 ? 0.32 : 0.18} strokeWidth={1} />;
          })}
          {/* your usual: the solid segment */}
          <path d={arc(angleOf(low), angleOf(high))} fill="none" stroke="var(--ns-ink)" strokeOpacity={0.85} strokeWidth={2.5} strokeLinecap="round" />
          {/* the bead, on the arc, at the value */}
          <circle cx={bx} cy={by + 3} r={BEAD} fill="var(--ns-ink)" opacity={0.06} />
          <circle cx={bx} cy={by} r={BEAD} fill={`url(#glass${gid})`} stroke="var(--ns-ink)" strokeOpacity={0.14} />
          <circle cx={bx} cy={by} r={BEAD - 1} fill="none" stroke="white" strokeOpacity={0.7} />
        </svg>
        <span aria-hidden className="absolute -translate-x-1/2 -translate-y-1/2 font-[family-name:var(--ns-font-display)] text-[17px] font-[number:var(--ns-weight-medium)] tracking-[var(--ns-tracking-display)] text-[var(--ns-ink)] tabular-nums" style={{ left: `${(bx / W) * 100}%`, top: `${(by / H) * 100}%` }}>
          {format(value)}
        </span>
        <span aria-hidden className="absolute -translate-x-1/2 text-[length:var(--ns-text-meta)] whitespace-nowrap text-[var(--ns-ink-3)] tabular-nums" style={{ left: `${(ux / W) * 100}%`, top: `${(uy / H) * 100}%` }}>
          Your usual {format(low)}–{format(high)}
        </span>
        <span aria-hidden className="absolute text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]" style={{ left: `${(lx / W) * 100}%`, top: `${(ly / H) * 100 + 6}%` }}>
          Lower
        </span>
        <span aria-hidden className="absolute -translate-x-full text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]" style={{ left: `${(rx / W) * 100}%`, top: `${(ry / H) * 100 + 6}%` }}>
          Higher
        </span>
      </div>
      {caption && <figcaption aria-hidden className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)] tabular-nums">
        {where.charAt(0).toUpperCase() + where.slice(1)}
      </figcaption>}
    </figure>
  );
}

export { StandingArc, type StandingArcProps };
