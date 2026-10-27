// Notchset ruler 2.0.0 · https://notchset.dev/changelog
"use client";
import { cn } from "@/lib/utils";
import { formatReading } from "@/lib/notchset/standing";

/*
 * Ruler: an instrument's scale under a reading. Hairline ticks at an even step (every fifth taller), your usual band
 * drawn as the solid stretch along its foot, and the value as one taller ink mark. The limits of your usual are
 * written in mono at its ends; nothing else. It sits under a hero number, so the number reads as a measurement.
 *
 *   <Ruler value={61} low={47} high={55} />
 */
type RulerProps = {
  value: number;
  /** your usual (or the range the value is read against) */
  low: number;
  high: number;
  format?: ((n: number) => string) | undefined;
  className?: string | undefined;
};

function Ruler({ value, low, high, format = (n) => formatReading(n), className }: RulerProps) {
  const span = high - low || 1;
  const lo = Math.min(low - span * 0.9, value - span * 0.3), hi = Math.max(high + span * 0.9, value + span * 0.3);
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const N = 60;
  return (
    <div data-slot="ruler" aria-hidden className={cn("relative h-[30px] w-full", className)}>
      {Array.from({ length: N + 1 }, (_, i) => (
        <i key={i} className="absolute top-[6px] w-px bg-[var(--ns-ink)]" style={{ left: `${(i / N) * 100}%`, height: i % 5 === 0 ? 9 : 5, opacity: i % 5 === 0 ? 0.28 : 0.16 }} />
      ))}
      <i className="absolute top-[17px] h-[2px] rounded-full bg-[var(--ns-ink)] opacity-70" style={{ left: `${pct(low)}%`, width: `${pct(high) - pct(low)}%` }} />
      <i className="absolute top-0 h-[19px] w-[2px] -translate-x-1/2 rounded-full bg-[var(--ns-series)]" style={{ left: `${pct(value)}%` }} />
      {[low, high].map((l, i) => (
        <span key={i} className="absolute top-[21px] -translate-x-1/2 font-[family-name:var(--ns-font-mono)] text-[10px] leading-none text-[var(--ns-ink-3)] tabular-nums" style={{ left: `${pct(l)}%` }}>
          {format(l)}
        </span>
      ))}
    </div>
  );
}

export { Ruler, type RulerProps };
