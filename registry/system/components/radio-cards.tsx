// Notchset radio-cards 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Radio cards: one choice from a few, where each option needs a line to explain it (where your pipeline comes
 * from, why you're cancelling). An icon, the option, its line, and the radio dot on the right; the chosen card
 * gets an ink edge. Arrow keys move the choice, like any radio group. One or two columns.
 */
type RadioCard<V extends string> = { value: V; label: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode };
type RadioCardsProps<V extends string> = {
  options: RadioCard<V>[];
  value: V | null;
  onValueChange: (v: V) => void;
  /** Names the group for screen readers ("Where your pipeline comes from"). */
  label: string;
  columns?: 1 | 2 | undefined;
  className?: string | undefined;
};

function RadioCards<V extends string>({ options, value, onValueChange, label, columns = 1, className }: RadioCardsProps<V>) {
  const ref = React.useRef<HTMLDivElement>(null);
  /* the cards by position, so a value is never built into a selector */
  const cards = React.useRef<(HTMLButtonElement | null)[]>([]);
  const move = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    /* with nothing chosen the first card is the one in the tab order, so that is where a key starts */
    const i = Math.max(0, options.findIndex((o) => o.value === value));
    const k = (i + d + options.length) % options.length;
    onValueChange(options[k]!.value);
    cards.current[k]?.focus();
  };
  return (
    <div ref={ref} role="radiogroup" aria-label={label} onKeyDown={move} data-slot="radio-cards" className={cn("grid gap-2", columns === 2 ? "grid-cols-2 max-[480px]:grid-cols-1" : "grid-cols-1", className)}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => void (cards.current[i] = el)}
            type="button"
            role="radio"
            data-value={o.value}
            aria-checked={on}
            tabIndex={on || (value == null && i === 0) ? 0 : -1}
            onClick={() => onValueChange(o.value)}
            className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--ns-radius-lg)] bg-[var(--ns-panel)] p-3 text-left shadow-[inset_0_0_0_1px_var(--ns-line)] outline-hidden [transition:box-shadow_var(--ns-time-color),background-color_var(--ns-time-color)] hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] aria-checked:bg-[var(--ns-raised)] aria-checked:shadow-[inset_0_0_0_1.5px_var(--ns-ink)]"
          >
            {o.icon && (
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[var(--ns-raised)] text-[var(--ns-ink-2)] shadow-[var(--ns-bezel)] [&>svg]:size-4">
                {o.icon}
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{o.label}</span>
              {o.hint && <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{o.hint}</span>}
            </span>
            <span aria-hidden className={cn("size-4 shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_var(--ns-line)] [transition:box-shadow_var(--ns-time-color)]", on && "shadow-[inset_0_0_0_5px_var(--ns-ink)]")} />
          </button>
        );
      })}
    </div>
  );
}

export { RadioCards, type RadioCard, type RadioCardsProps };
