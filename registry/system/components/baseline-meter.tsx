// Notchset baseline-meter 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { RangeBar } from "@/components/ui/notchset/range-bar";
import { formatReading } from "@/lib/notchset/standing";

/*
 * Baseline meter: the honest "learning your baseline". A row of nights in ink (14 by default) fills with the series as
 * each night is measured, with the count written ("9 of 14 nights") and what's left ("5 more nights"). Until it's
 * full nothing is said against your usual, because there isn't one yet. Full, it becomes your band: the range bar of
 * your usual with today's value on it. A night added while you watch pops in once; with less motion it simply shows.
 *
 *   <BaselineMeter metric="Skin temperature" nights={9} />
 *   <BaselineMeter metric="HRV" unit="ms" nights={14} band={{ low: 46, high: 58 }} value={61} />
 */
type BaselineMeterProps = {
  /** what's being learned: "Skin temperature" */
  metric: string;
  /** nights measured so far */
  nights: number;
  /** nights it needs */
  of?: number | undefined;
  unit?: string | undefined;
  /** your usual range, once learned */
  band?: { low: number; high: number } | undefined;
  /** today's value, drawn on the band once it's learned */
  value?: number | null | undefined;
  format?: ((n: number) => string) | undefined;
  className?: string | undefined;
};

/** "skin temperature" in a sentence, "HRV" kept as it is */
const inSentence = (s: string) => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

function BaselineMeter({ metric, nights, of = 14, unit = "", band, value = null, format = (n) => formatReading(n), className }: BaselineMeterProps) {
  const have = Math.max(0, Math.min(of, Math.floor(nights)));
  const done = have >= of && band != null;
  const left = of - have;
  /* a night that arrives while it's on screen pops in; on arrival every dot is simply there */
  const seen = React.useRef(have);
  const [fresh, setFresh] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (have > seen.current) setFresh(have - 1);
    seen.current = have;
  }, [have]);

  if (done)
    return (
      <div data-slot="baseline-meter" data-state="learned" className={cn("flex min-w-0 flex-col gap-1.5", className)}>
        <div className="flex items-baseline justify-between gap-3 text-[length:var(--ns-text-small)]">
          <span className="text-[var(--ns-ink-2)]">Your usual {inSentence(metric)}</span>
          <span className="text-[var(--ns-ink)] tabular-nums">
            {format(band.low)}–{format(band.high)}
            {unit && ` ${unit}`}
          </span>
        </div>
        <div data-ns-moves="" className="[animation:ns-fade_var(--ns-time-page)_var(--ns-ease)_both]">
          <RangeBar size="card" name={metric} value={value} unit={unit} format={format} range={{ low: band.low, high: band.high, kind: "baseline", source: `Your last ${of} nights` }} />
        </div>
      </div>
    );

  return (
    <div data-slot="baseline-meter" data-state="learning" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3 text-[length:var(--ns-text-small)]">
        <span className="text-[var(--ns-ink-2)]">Learning your baseline</span>
        <span className="text-[var(--ns-ink)] tabular-nums">
          {have} of {of} nights
        </span>
      </div>
      <div
        role="meter"
        aria-label={`${metric}: learning your baseline`}
        aria-valuemin={0}
        aria-valuemax={of}
        aria-valuenow={have}
        aria-valuetext={`${have} of ${of} nights`}
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${of}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: of }, (_, i) => (
          <i
            key={i}
            aria-hidden
            data-on={i < have || undefined}
            data-ns-still={i === fresh ? "" : undefined}
            className={cn(
              "mx-auto block aspect-square w-full max-w-[10px] rounded-full",
              i < have ? "bg-[var(--ns-series)]" : "shadow-[inset_0_0_0_1.5px_var(--ns-line)]",
              i === fresh && "[animation:ns-pop_360ms_var(--ns-ease-pop)]",
            )}
          />
        ))}
      </div>
      <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        {left === 1 ? "1 more night" : `${left} more nights`} before {inSentence(metric)} is read against your usual
      </span>
    </div>
  );
}

export { BaselineMeter, type BaselineMeterProps };
