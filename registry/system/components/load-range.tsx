// Notchset load-range 2.0.0 · https://notchset.dev/changelog
"use client";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui/notchset/status-pill";

/*
 * Load range: a week's training load against your own usual. The figure and its standing in words, then one track
 * from light to heavy with your usual as a soft band and today's load as a dot on it, then the few figures it comes
 * from as quiet rows (acute, chronic, their ratio). Your usual is yours, so the band moves with you.
 *
 *   <LoadRange value={64} low={55} high={72} domain={[30, 100]}
 *     rows={[{ label: "Acute, 7 days", value: "64" }, { label: "Chronic, 28 days", value: "61" }]} />
 */
type LoadRangeProps = {
  value: number;
  /** your usual */
  low: number;
  high: number;
  /** the track's ends; defaults to a little past the band and the value */
  domain?: [number, number] | undefined;
  lowWord?: string | undefined;
  highWord?: string | undefined;
  rows?: { label: string; value: string }[] | undefined;
  className?: string | undefined;
};

function LoadRange({ value, low, high, domain, lowWord = "light", highWord = "heavy", rows, className }: LoadRangeProps) {
  const lo = domain?.[0] ?? Math.floor(Math.min(low, value) * 0.6);
  const hi = domain?.[1] ?? Math.ceil(Math.max(high, value) * 1.35);
  const at = (v: number) => `${((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100}%`;
  const standing = value < low ? "Below your usual" : value > high ? "Above your usual" : "Inside your usual";
  return (
    <div data-slot="load-range" className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-[length:var(--ns-text-figure)] leading-none font-[number:var(--ns-weight-light)] tracking-[-0.02em] tabular-nums">{value}</span>
        <StatusPill tone={value > high ? "warn" : value < low ? "neutral" : "ok"}>{standing}</StatusPill>
        <span className="font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{`usual ${low}–${high}`}</span>
      </div>
      <div role="img" aria-label={`Load ${value}, ${standing.toLowerCase()} of ${low} to ${high}, on a scale from ${lo} ${lowWord} to ${hi} ${highWord}.`} className="relative mt-1 h-[22px]">
        <i aria-hidden className="absolute inset-x-0 top-1/2 block h-[6px] -translate-y-1/2 rounded-full bg-[var(--ns-line)]" />
        <i aria-hidden className="absolute top-1/2 block h-[14px] -translate-y-1/2 rounded-full bg-[var(--ns-band-grade)] shadow-[inset_0_0_0_0.5px_var(--ns-line)]" style={{ left: at(low), width: `calc(${at(high)} - ${at(low)})` }} />
        <i aria-hidden className="absolute top-1/2 block size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ns-series)] shadow-[0_0_0_2.5px_var(--ns-canvas),0_0_14px_4px_color-mix(in_oklab,var(--ns-series)_var(--ns-glow),transparent)]" style={{ left: at(value) }} />
      </div>
      <div aria-hidden className="relative h-4 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        <span className="absolute left-0">{`${lo} ${lowWord}`}</span>
        {(low - lo) / (hi - lo) > 0.16 && (
          <span className="absolute -translate-x-1/2" style={{ left: at(low) }}>
            {low}
          </span>
        )}
        {(hi - high) / (hi - lo) > 0.16 && (high - low) / (hi - lo) > 0.08 && (
          <span className="absolute -translate-x-1/2" style={{ left: at(high) }}>
            {high}
          </span>
        )}
        <span className="absolute right-0">{`${hi} ${highWord}`}</span>
      </div>
      {rows && rows.length > 0 && (
        <dl className="m-0 mt-2 flex flex-col">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-4 border-t-[0.5px] border-[var(--ns-line)] py-2">
              <dt className="text-[var(--ns-ink-2)]">{r.label}</dt>
              <dd className="m-0 tabular-nums">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export { LoadRange, type LoadRangeProps };
