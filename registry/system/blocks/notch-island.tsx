// Notchset notch-island 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Notch island: a small dark island at the top of a screen that reshapes to hold what just happened: a call
 * coming in, a file going up, a thing done. Its size follows its content (rest, wide, tall); the shape changes
 * first and the words arrive a beat after, so the eye follows the shape and then reads. Pressing it shows the next
 * moment. One live region says what the island now holds. Reduced motion lands each shape at once.
 *
 * The host owns the value. A value that names no moment (or no moments yet, while they load) leaves the island at
 * rest with no chip picked, saying "Nothing selected" (or "Nothing happening"): it never shows another moment as if
 * the host had chosen it. Pressing it then asks for the first moment; with no moments it can't be pressed.
 *
 *   <NotchIsland moments={[{ key: "rest", label: "Quiet", size: "rest" }, { key: "call", label: "Call", size: "wide",
 *     lead: <Avatar …/>, title: "Ana Ruiz", detail: "Discovery call · Raycast" }]} value={k} onValueChange={setK} />
 */
type IslandMoment = {
  key: string;
  /** what the moment is, in a word (the chip under the island, and what a screen reader hears) */
  label: string;
  size: "rest" | "wide" | "tall";
  lead?: React.ReactNode;
  title?: React.ReactNode;
  detail?: React.ReactNode;
  trail?: React.ReactNode;
  /** 0–1: a progress line along the island's lower edge */
  progress?: number | undefined;
};
type NotchIslandProps = {
  moments: IslandMoment[];
  value: string;
  onValueChange: (key: string) => void;
  /** the chips under the island that pick a moment; on by default */
  picker?: boolean;
  className?: string | undefined;
};

const SIZE: Record<IslandMoment["size"], string> = {
  rest: "w-[7.5rem] h-[2.125rem] rounded-[1.0625rem]",
  wide: "w-[min(100%,22.5rem)] h-14 rounded-[1.75rem]",
  tall: "w-[min(100%,22.5rem)] h-[7.5rem] rounded-[1.875rem]",
};

function NotchIsland({ moments, value, onValueChange, picker = true, className }: NotchIslandProps) {
  const i = moments.findIndex((x) => x.key === value);
  const m: IslandMoment = moments[i] ?? { key: "", label: moments.length ? "Nothing selected" : "Nothing happening", size: "rest" };
  const next = moments.length ? moments[(i + 1) % moments.length]! : null;
  const group = React.useRef<HTMLDivElement>(null);
  /* a radio group's keys: one tab stop (the chosen moment), arrows and Home/End choose and move focus with it */
  const onKey = (e: React.KeyboardEvent) => {
    if (!moments.length) return;
    const cur = Math.max(0, i);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? moments.length - 1 : step ? (cur + step + moments.length) % moments.length : -1;
    if (to < 0) return;
    e.preventDefault();
    onValueChange(moments[to]!.key);
    group.current?.querySelectorAll<HTMLElement>("[role=radio]")[to]?.focus();
  };
  return (
    <div data-slot="notch-island" className={cn("flex w-full flex-col items-center gap-4", className)}>
      <button
        type="button"
        onClick={() => next && onValueChange(next.key)}
        disabled={!next}
        aria-label={next ? `${m.label}. Show ${next.label.toLowerCase()}` : m.label}
        data-ns-glide=""
        className={cn(
          "relative flex cursor-pointer items-center disabled:cursor-default overflow-hidden bg-[#08080a] text-left text-white shadow-[0_0_0_1px_rgb(255_255_255/0.06),0_18px_40px_-16px_rgb(0_0_0/0.55)] outline-hidden [transition:width_var(--ns-time-page)_var(--ns-ease-panel),height_var(--ns-time-page)_var(--ns-ease-panel),border-radius_var(--ns-time-page)_var(--ns-ease-panel)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ns-signal)]",
          SIZE[m.size],
        )}
      >
        {/* the content arrives a beat after the shape, so the change reads as one movement */}
        <span key={m.key} data-ns-moves="" className={cn("flex min-w-0 flex-1 gap-3 px-4 [animation:ns-island-in_var(--ns-time-dialog)_var(--ns-ease)_120ms_both]", m.size === "tall" ? "flex-col justify-center py-4" : "items-center")}>
          {m.size === "rest" ? (
            <span aria-hidden className="mx-auto flex items-center gap-1.5">
              <i className="size-1.5 rounded-full bg-white/80" />
              <i className="h-1.5 w-8 rounded-full bg-white/20" />
            </span>
          ) : (
            <>
              <span className="flex min-w-0 items-center gap-3">
                {m.lead && <span className="shrink-0">{m.lead}</span>}
                <span className="flex min-w-0 flex-1 flex-col">
                  {m.title && <span className="truncate text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-medium)]">{m.title}</span>}
                  {m.detail && <span className="truncate text-[length:var(--ns-text-small)] text-white/60">{m.detail}</span>}
                </span>
                {m.trail && <span className="shrink-0">{m.trail}</span>}
              </span>
            </>
          )}
        </span>
        {m.progress != null && (
          <span aria-hidden className="absolute inset-x-5 bottom-2 h-[3px] overflow-hidden rounded-full bg-white/15">
            <i data-ns-glide="" className="block h-full rounded-full bg-white [transition:width_var(--ns-time-dialog)_var(--ns-ease)]" style={{ width: `${Math.round(m.progress * 100)}%` }} />
          </span>
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {m.label}
        {m.progress != null ? `, ${Math.round(m.progress * 100)}%` : ""}
      </span>
      {picker && (
        <div ref={group} role="radiogroup" aria-label="Island moments" onKeyDown={onKey} className="flex flex-wrap justify-center gap-1">
          {moments.map((x) => (
            <button
              key={x.key}
              type="button"
              role="radio"
              data-value={x.key}
              aria-checked={i >= 0 && x.key === m.key}
              tabIndex={x.key === (i >= 0 ? m.key : moments[0]?.key) ? 0 : -1}
              onClick={() => onValueChange(x.key)}
              className="cursor-pointer rounded-full px-2.5 py-1 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)] outline-hidden [transition:background-color_var(--ns-time-color),color_var(--ns-time-color)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] aria-checked:bg-[var(--ns-panel)] aria-checked:text-[var(--ns-ink)] aria-checked:shadow-[0_0_0_1px_var(--ns-line)]"
            >
              {x.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { NotchIsland, type IslandMoment, type NotchIslandProps };
