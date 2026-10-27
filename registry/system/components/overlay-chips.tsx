// Notchset overlay-chips 2.0.0 · https://notchset.dev/changelog
"use client";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Overlay chips: add one second signal (resting HR, sleep, steps) to a trend's time axis. The one on shows its swatch,
 * name and latest value and takes it off again; the rest wait as quiet "+ name" chips. One at a time, so the chart
 * keeps one honest axis. Toggle buttons (aria-pressed) in a labelled group.
 *
 *   <OverlayChips options={[{ value: "rhr", label: "Resting HR", reading: "55 bpm" }, …]} value="rhr" onValueChange={set} />
 */
type OverlayOption = {
  value: string;
  label: string;
  reading?: string | undefined;
};
type OverlayChipsProps = {
  options: OverlayOption[];
  value: string | null;
  onValueChange: (v: string | null) => void;
  label?: string | undefined;
  className?: string | undefined;
};

const chip =
  "inline-flex h-[var(--ns-control-sm)] cursor-pointer items-center gap-1.5 rounded-full px-3 text-[length:var(--ns-text-small)] whitespace-nowrap outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)]";

function OverlayChips({ options, value, onValueChange, label = "On the same axis", className }: OverlayChipsProps) {
  return (
    <div role="group" aria-label={label} data-slot="overlay-chips" className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
      <span aria-hidden className="mr-1 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        {label}
      </span>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            aria-label={on ? `${o.label} on the chart. Take it off` : `Add ${o.label} to the chart`}
            onClick={() => onValueChange(on ? null : o.value)}
            className={cn(chip, on ? "bg-[var(--ns-hover)] text-[var(--ns-ink)] shadow-[inset_0_0_0_0.5px_var(--ns-line)]" : "text-[var(--ns-ink-2)] shadow-[inset_0_0_0_0.5px_var(--ns-line)] hover:text-[var(--ns-ink)]")}
          >
            {on ? <i aria-hidden className="block h-px w-3 bg-[var(--ns-ink-2)]" /> : <Plus aria-hidden className="size-3" strokeWidth={2} />}
            {o.label}
            {on && o.reading && <span className="font-[family-name:var(--ns-font-display)] text-[var(--ns-ink)] tabular-nums">{o.reading}</span>}
            {on && <X aria-hidden className="size-3 opacity-60" strokeWidth={2} />}
          </button>
        );
      })}
    </div>
  );
}

export { OverlayChips, type OverlayChipsProps, type OverlayOption };
