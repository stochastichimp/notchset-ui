// Notchset meter 2.1.0 · https://notchset.dev/changelog
import type * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Meter: how much of something is used or done, as a thin bar beside the number that says it. The number is
 * always written next to it; the bar is the glance. kind="progress" fills in ink (or the ok colour when it is
 * an achievement); kind="usage" warns from 75% and turns bad when full, so a limit is seen before it is hit.
 */
type MeterProps = {
  value: number;
  max: number;
  /** What it measures, read out with the value ("Seats used"). */
  label: string;
  kind?: "progress" | "usage" | undefined;
  /** Progress that is good news (won against target) fills in the ok colour. */
  good?: boolean | undefined;
  size?: "sm" | "md" | undefined;
  className?: string | undefined;
};

function Meter({ value, max, label, kind = "progress", good = false, size = "sm", className }: MeterProps) {
  const pct = max === Infinity || max <= 0 ? 0 : Math.min(100, (value / max) * 100);
  const state = kind === "usage" ? (pct >= 100 ? "full" : pct >= 75 ? "near" : "ok") : good ? "good" : "plain";
  /* what it means keeps its colour (full, near, good); a plain amount takes the series violet; every fill has the
     chart family's finish (rounded, fading back toward its start) */
  const fill = { full: "var(--ns-bad)", near: "var(--ns-warn)", ok: "var(--ns-series)", good: "var(--ns-ok)", plain: "var(--ns-series)" }[state];
  return (
    <span
      data-slot="meter"
      data-state={state}
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max === Infinity ? undefined : max}
      className={cn(
        "inline-block shrink-0 rounded-full bg-[var(--ns-line-soft)]",
        size === "sm" ? "h-1 w-14" : "h-1.5 w-[120px] max-[600px]:w-20",
        className,
      )}
    >
      <i data-ns-glide="" data-ns-fill="" className="block h-full rounded-full [transition:width_500ms_var(--ns-ease)]" style={{ width: `${pct}%`, "--ns-fill": fill } as React.CSSProperties} />
    </span>
  );
}

export { Meter, type MeterProps };
