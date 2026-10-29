// Notchset inline-bar 2.1.0 · https://notchset.dev/changelog
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * InlineBar: a thin bar inside a table cell, with its number beside it, so rows compare at a glance and the
 * number still answers. The bar takes the cell's spare width up to a short limit, and the figure keeps one
 * column edge so the numbers line up down the table. The series violet by default, a stage colour only for a stage,
 * in the chart family's finish (rounded, fading back toward its start). In a
 * cell too narrow for both (a phone), only the number shows. It sizes from its own width, so in a table that
 * fits columns to their content, give it one (className="w-36").
 */
type InlineBarProps = {
  value: number;
  max: number;
  /** The number, as it should read ("71%", "12 days"). */
  figure: React.ReactNode;
  /** Read out in place of the bar ("5 of 7 deals moved on"). */
  label?: string | undefined;
  color?: string | undefined;
  className?: string | undefined;
};

function InlineBar({ value, max, figure, label, color, className }: InlineBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    /* a block, not inline: an inline box would sit its empty bar on the text baseline and drop the figure below the
       row's other numbers; in a narrow cell the bar steps aside and the number stays */
    <span data-slot="inline-bar" className={cn("@container flex w-full min-w-0 items-center justify-end gap-2.5", className)} title={label}>
      <span aria-hidden className="block h-1 w-full max-w-24 min-w-8 rounded-full bg-[var(--ns-line-soft)] @max-[7.5rem]:hidden">
        <i data-ns-glide="" data-ns-fill="" className="block h-full rounded-full [transition:width_var(--ns-time-dialog)_var(--ns-ease)]" style={{ width: `${pct}%`, "--ns-fill": color ?? "var(--ns-series)" } as React.CSSProperties} />
      </span>
      <span className="min-w-[4.5ch] shrink-0 text-end tabular-nums">
        {figure}
        {label && <span className="sr-only">, {label}</span>}
      </span>
    </span>
  );
}

export { InlineBar, type InlineBarProps };
