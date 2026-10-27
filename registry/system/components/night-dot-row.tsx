// Notchset night-dot-row 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Night dot row: seven nights as dots, each with its day and figure. A night below your usual is hollow; the chosen
 * night is ringed and lit, and choosing one changes the whole page (the host listens). It is a radio group: arrow
 * keys move and choose, Home and End jump, and each dot says its night in words, so the row is its own table.
 *
 *   <NightDotRow nights={[{ id: "19", day: "Mon 19", value: "7:04", below: false }, …]} value="25" onValueChange={setNight} />
 */
type Night = {
  id: string;
  /** "Mon 19" */
  day: string;
  /** "7:04", or null when nothing was recorded */
  value: string | null;
  /** below your usual: drawn hollow */
  below?: boolean | undefined;
};
type NightDotRowProps = {
  nights: Night[];
  value: string;
  onValueChange: (id: string) => void;
  label?: string | undefined;
  className?: string | undefined;
};

function NightDotRow({ nights, value, onValueChange, label = "Choose a night", className }: NightDotRowProps) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const at = Math.max(0, nights.findIndex((n) => n.id === value));
  const go = (i: number) => {
    const n = nights[(i + nights.length) % nights.length];
    if (!n) return;
    onValueChange(n.id);
    refs.current[(i + nights.length) % nights.length]?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown") go(at + 1);
    else if (k === "ArrowLeft" || k === "ArrowUp") go(at - 1);
    else if (k === "Home") go(0);
    else if (k === "End") go(nights.length - 1);
    else return;
    e.preventDefault();
  };
  return (
    <div data-slot="night-dot-row" role="radiogroup" aria-label={label} onKeyDown={onKey} className={cn("grid min-w-0 gap-1", className)} style={{ gridTemplateColumns: `repeat(${nights.length}, minmax(0, 1fr))` }}>
      {nights.map((n, i) => {
        const on = i === at;
        const none = n.value == null;
        return (
          <button
            key={n.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            aria-label={`${n.day}: ${none ? "nothing recorded" : `${n.value}${n.below ? ", below your usual" : ""}`}`}
            onClick={() => onValueChange(n.id)}
            data-state={on ? "on" : "off"}
            className={cn(
              "flex min-w-0 cursor-pointer flex-col items-center gap-1.5 group/night relative rounded-[10px] py-2 outline-hidden focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]",
            )}
          >
            <span className={cn("truncate text-[length:var(--ns-text-meta)] [transition:color_var(--ns-time-color)]", on ? "font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]" : "text-[var(--ns-ink-3)] group-hover/night:text-[var(--ns-ink-2)]")}>{n.day}</span>
            <i
              aria-hidden
              data-slot="night-dot"
              data-below={n.below ? "" : undefined}
              className={cn(
                "block size-3 rounded-full",
                none ? "border border-dashed border-[var(--ns-ink-3)]" : n.below ? "border-[1.5px] border-[var(--ns-series)] bg-transparent" : "bg-[var(--ns-series)] opacity-80",
                on && !none && "opacity-100 shadow-[0_0_0_2.5px_var(--ns-canvas),0_0_0_4px_var(--ns-series),0_0_14px_4px_color-mix(in_oklab,var(--ns-series)_var(--ns-glow),transparent)]",
              )}
            />
            <span className={cn("font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] tabular-nums", on ? "text-[var(--ns-ink)]" : "text-[var(--ns-ink-3)]")}>{n.value ?? "–"}</span>
            {/* the chosen night: a short notch under its figure, no box */}
            <i aria-hidden className={cn("block h-0.5 w-4 rounded-full bg-[var(--ns-series)] [transition:opacity_var(--ns-time-color),transform_var(--ns-time-color)]", on ? "opacity-100" : "scale-x-50 opacity-0")} />
          </button>
        );
      })}
    </div>
  );
}

export { NightDotRow, type Night, type NightDotRowProps };
