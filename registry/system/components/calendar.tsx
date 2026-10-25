// Notchset calendar 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, addMonths, type Day, formatDay, makeDay, monthGrid, monthName, partsOf, sameMonth, today as todayOf, weekday, weekdayNames } from "@/lib/notchset/dates";

/*
 * Calendar: the grid the date pickers share (the prototype's .dpg). Days, then months, then years: press the
 * title ("November 2026") for the 12 months, press the year for 12 years, and picking steps back down, so a far
 * date needs no run of ‹ ›. Today has a hairline; the chosen day is ink. In range
 * mode the first press starts the range, the second ends it, and the days between are washed as you hover.
 *
 * Keyboard: arrows move a day or a week, Page Up/Down a month (with Shift, a year), Home/End the week's ends,
 * Enter picks. Only the focused day is in the tab order.
 */
type Range = { start: Day | null; end: Day | null };
type CalendarProps = {
  /** Single mode: the chosen day. */
  value?: Day | null | undefined;
  /** Range mode: the chosen range (end may be null while picking). */
  range?: Range | undefined;
  onPick?: ((day: Day) => void) | undefined;
  onRangeChange?: ((range: Range) => void) | undefined;
  min?: Day | undefined;
  max?: Day | undefined;
  weekStartsOn?: number | undefined;
  /** For tests and demos; defaults to the reader's today. */
  today?: Day | undefined;
  className?: string | undefined;
};

const cell =
  "relative grid h-8 w-full cursor-pointer place-items-center rounded-[var(--ns-radius)] font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] tabular-nums outline-hidden [transition:background-color_var(--ns-time-color)] hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ns-signal)] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent pointer-coarse:h-10";
const chosen = "bg-[var(--ns-ink)] text-[var(--ns-canvas)] hover:bg-[var(--ns-ink)]";
const navBtn =
  "grid size-7 cursor-pointer place-items-center rounded-[7px] text-[var(--ns-ink-2)] shadow-[var(--ns-bezel)] bg-[var(--ns-raised)] outline-hidden hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] pointer-coarse:size-9 [&_svg]:size-3.5";

function Calendar({ value = null, range, onPick, onRangeChange, min, max, weekStartsOn = 1, today, className }: CalendarProps) {
  const now = today ?? todayOf();
  const anchor = (range ? range.end ?? range.start : value) ?? now;
  const [cursor, setCursor] = React.useState<Day>(anchor);
  const [view, setView] = React.useState<"days" | "months" | "years">("days");
  const [hover, setHover] = React.useState<Day | null>(null);
  const grid = React.useRef<HTMLDivElement>(null);
  const moved = React.useRef(false);
  const { y, m } = partsOf(cursor);
  const out = (d: Day) => Boolean((min && d < min) || (max && d > max));

  React.useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLElement>("[tabindex='0']")?.focus();
  });

  const pick = (d: Day) => {
    if (out(d)) return;
    setCursor(d);
    if (range && onRangeChange) {
      if (!range.start || range.end) onRangeChange({ start: d, end: null });
      else onRangeChange(d < range.start ? { start: d, end: range.start } : { start: range.start, end: d });
    } else onPick?.(d);
  };
  const move = (d: Day) => {
    moved.current = true;
    setCursor(min && d < min ? min : max && d > max ? max : d);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    const wk = (weekday(cursor) - weekStartsOn + 7) % 7;
    const to =
      k === "ArrowLeft" ? addDays(cursor, -1) : k === "ArrowRight" ? addDays(cursor, 1) : k === "ArrowUp" ? addDays(cursor, -7) : k === "ArrowDown" ? addDays(cursor, 7)
      : k === "PageUp" ? addMonths(cursor, e.shiftKey ? -12 : -1) : k === "PageDown" ? addMonths(cursor, e.shiftKey ? 12 : 1)
      : k === "Home" ? addDays(cursor, -wk) : k === "End" ? addDays(cursor, 6 - wk) : null;
    if (to) {
      e.preventDefault();
      move(to);
    }
  };

  const lo = range?.start ?? null;
  const hi = range ? range.end ?? (lo && hover ? hover : null) : null;
  const [a, b] = lo && hi ? (lo < hi ? [lo, hi] : [hi, lo]) : [lo, lo];

  return (
    <div data-slot="calendar" className={cn("flex w-[252px] flex-col gap-1.5 max-[600px]:w-full", className)}>
      <div className="flex items-center justify-between gap-2 px-0.5 pt-1 pb-2">
        {view === "days" ? (
          <button type="button" onClick={() => setView("months")} aria-label={`${monthName(m)} ${y}. Choose month and year`} className="inline-flex cursor-pointer items-center gap-1 rounded-[6px] px-1.5 py-1 text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-strong)] outline-hidden hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]">
            {`${monthName(m)} ${y}`}
            <ChevronDown className="size-3 text-[var(--ns-ink-3)]" aria-hidden />
          </button>
        ) : (
          <button type="button" onClick={() => setView(view === "months" ? "years" : "days")} aria-label={view === "months" ? `${y}. Choose a year` : "Back to days"} className="inline-flex cursor-pointer items-center gap-1 rounded-[6px] px-1.5 py-1 text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-strong)] tabular-nums outline-hidden hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]">
            {view === "months" ? y : `${y - (y % 12)} – ${y - (y % 12) + 11}`}
            <ChevronDown className={cn("size-3 text-[var(--ns-ink-3)]", view === "years" && "rotate-180")} aria-hidden />
          </button>
        )}
        <span className="flex gap-1">
          <button type="button" className={navBtn} aria-label={view === "days" ? "Previous month" : view === "months" ? "Previous year" : "Previous 12 years"} onClick={() => setCursor(addMonths(cursor, view === "days" ? -1 : view === "months" ? -12 : -144))}>
            <ChevronLeft />
          </button>
          <button type="button" className={navBtn} aria-label={view === "days" ? "Next month" : view === "months" ? "Next year" : "Next 12 years"} onClick={() => setCursor(addMonths(cursor, view === "days" ? 1 : view === "months" ? 12 : 144))}>
            <ChevronRight />
          </button>
        </span>
      </div>

      {view === "days" && (
        <div ref={grid} role="grid" aria-label={`${monthName(m)} ${y}`} onKeyDown={onKey} onMouseLeave={() => setHover(null)} className="flex flex-col gap-0.5">
          <div role="row" className="grid grid-cols-7 gap-0.5">
            {weekdayNames(weekStartsOn).map((w) => (
              <span key={w.long} role="columnheader" aria-label={w.long} className="text-center text-[length:var(--ns-text-meta)] leading-6 font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-3)]">
                {w.short}
              </span>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, r) => monthGrid(y, m, weekStartsOn).slice(r * 7, r * 7 + 7)).map((week) => (
            <div key={week[0]} role="row" className={cn("grid grid-cols-7", range ? "gap-x-0" : "gap-0.5")}>
              {week.map((d, col) => {
                const isOn = range ? d === a || d === b : d === value;
                const between = Boolean(range && a && b && d > a && d < b);
                // a range is one band: the days between are washed edge to edge, and each end joins it on its inner half
                const band = between ? "bg-[var(--ns-range)]" : range && a && b && a !== b ? (d === a ? "bg-[linear-gradient(to_right,transparent_50%,var(--ns-range)_50%)]" : d === b ? "bg-[linear-gradient(to_left,transparent_50%,var(--ns-range)_50%)]" : "") : "";
                return (
                  <span key={d} role="gridcell" aria-selected={isOn || between} className={cn(band, band && col === 0 && "rounded-l-[var(--ns-radius)]", band && col === 6 && "rounded-r-[var(--ns-radius)]")}>
                    <button
                      type="button"
                      tabIndex={d === cursor ? 0 : -1}
                      disabled={out(d)}
                      aria-label={formatDay(d, "long")}
                      aria-current={d === now ? "date" : undefined}
                      onClick={() => pick(d)}
                      onMouseEnter={() => setHover(d)}
                      onFocus={() => setCursor(d)}
                      className={cn(
                        cell,
                        !sameMonth(d, cursor) && (between ? "text-[var(--ns-ink-2)]" : "text-[var(--ns-ink-3)]"),
                        d === now && !isOn && "shadow-[inset_0_0_0_1px_var(--ns-line)]",
                        between && "rounded-none hover:bg-[color-mix(in_oklab,var(--ns-ink)_8%,transparent)]",
                        isOn && chosen,
                      )}
                    >
                      {partsOf(d).d}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {view === "months" && (
        <div role="group" aria-label={`Months of ${y}`} className="grid grid-cols-3 gap-1.5 pb-1">
          {Array.from({ length: 12 }, (_, i) => {
            const first = makeDay(y, i, 1);
            const isOn = (value ?? range?.start ?? "").slice(0, 7) === first.slice(0, 7);
            return (
              <button key={i} type="button" onClick={() => (setCursor(makeDay(y, i, Math.min(partsOf(cursor).d, 28))), setView("days"))} aria-label={`${monthName(i)} ${y}`} className={cn(cell, "h-10", isOn && chosen, now.slice(0, 7) === first.slice(0, 7) && !isOn && "shadow-[inset_0_0_0_1px_var(--ns-line)]")}>
                {monthName(i, "short")}
              </button>
            );
          })}
        </div>
      )}

      {view === "years" && (
        <div role="group" aria-label="Years" className="grid grid-cols-3 gap-1.5 pb-1">
          {Array.from({ length: 12 }, (_, i) => y - (y % 12) + i).map((yr) => {
            const isOn = (value ?? range?.start ?? "").slice(0, 4) === String(yr);
            return (
              <button key={yr} type="button" onClick={() => (setCursor(makeDay(yr, m, Math.min(partsOf(cursor).d, 28))), setView("months"))} className={cn(cell, "h-10", isOn && chosen, now.startsWith(String(yr)) && !isOn && "shadow-[inset_0_0_0_1px_var(--ns-line)]")}>
                {yr}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { Calendar, type CalendarProps, type Range };
