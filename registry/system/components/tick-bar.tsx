// Notchset tick-bar 2.1.0 · https://notchset.dev/changelog
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * TickBar: how far toward a target, as a row of thin ticks filled up to the value. Calmer than a fat bar, and it
 * reads as "how far, out of how much" at a glance. Filled ticks are the series violet in the chart family's finish
 * (rounded, fading toward the base); `done` draws its share of the fill in the ok colour (won, against won + commit); `target` raises one tick where the goal sits when the bar's scale runs past it. The number is
 * always written: pass `figure` to write it beside the ticks, or write it nearby yourself. The ticks spread across
 * whatever width the bar is given, so it sits in a tile, a table cell or a header alike.
 */
type TickBarProps = {
  value: number;
  max: number;
  /** What it measures, read out with the value ("Won and committed against target"). */
  label: string;
  /** The part of value that is already done, drawn in the ok colour from the start. */
  done?: number | undefined;
  /** Where the goal sits on the scale, when the scale runs past it. */
  target?: number | undefined;
  /** How the value is read out ("$1.4M of $2M"); defaults to the percent of max. */
  valueText?: string | undefined;
  /** The number, written after the ticks. */
  figure?: React.ReactNode;
  ticks?: number | undefined;
  className?: string | undefined;
};

function TickBar({ value, max, label, done = 0, target, valueText, figure, ticks = 40, className }: TickBarProps) {
  const per = max > 0 ? max / ticks : Infinity;
  /* a tick is filled once the value covers half of it; and an endpoint means exactly that: anything above zero fills
     at least one tick, anything short of max leaves at least one empty (1% never shows as nothing, 99% never full) */
  const fill = (v: number) => (ticks < 2 ? Math.min(ticks, Math.round(v / per)) : v <= 0 ? 0 : v >= max ? ticks : Math.min(ticks - 1, Math.max(1, Math.round(v / per))));
  const filled = fill(value);
  const won = Math.min(filled, fill(done));
  const goal = target != null && max > 0 && target < max ? Math.min(ticks - 1, Math.round(target / per) - 1) : -1;
  return (
    <span data-slot="tick-bar" className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={valueText ?? `${max > 0 ? Math.round((value / max) * 100) : 0}%`}
        className="flex h-3 min-w-0 flex-1 items-end justify-between gap-px"
      >
        {Array.from({ length: ticks }, (_, i) => (
          <i
            key={i}
            className={cn(
              "block w-0.5 shrink-0 rounded-full [transition:background-color_var(--ns-time-color)]",
              i === goal ? "h-3" : "h-2.5",
              i < won ? "bg-[var(--ns-ok)]" : i < filled ? "bg-[var(--ns-series)]" : i === goal ? "bg-[var(--ns-ink-3)]" : "bg-[var(--ns-line)]",
            )}
            {...(i < filled ? { "data-ns-veil": "column" } : {})}
          />
        ))}
      </span>
      {figure != null && <span className="shrink-0 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] tabular-nums">{figure}</span>}
    </span>
  );
}

export { TickBar, type TickBarProps };
