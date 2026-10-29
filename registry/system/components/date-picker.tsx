// Notchset date-picker 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/notchset/calendar";
import { DEFAULT_LOCALE, addDays, type Day, formatDay, parseDay, today as todayOf, weekday } from "@/lib/notchset/dates";
import { fieldSurface } from "@/components/ui/notchset/field";
import { popupPositioner, popupSurface } from "@/lib/notchset/popup";
import { useReturnFocus } from "@/lib/notchset/return-focus";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Date picker: a due date, a close date. Opens to the shortcuts people mostly want (Today, Tomorrow, Next
 * week) beside a calendar, so it fits the window instead of scrolling. A far date is a few presses away (the
 * title for months, the year for years), or type it: "nov 3", "3 Nov 2023", "next fri", "in 2 weeks". What you typed is read back as a
 * date before Enter takes it. Numeric dates (11/03) are refused, because half the world reads them the other
 * way round. A phone gets the same as a bottom sheet.
 */
type Shortcut = { label: string; day: Day };
type DatePickerProps = {
  value: Day | null;
  onValueChange: (value: Day | null) => void;
  /** Names the field for screen readers when no label is tied to it ("Due date"). */
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  placeholder?: string | undefined;
  /** Defaults to Today, Tomorrow, Next week and In 2 weeks; apps add their own (End of quarter). */
  shortcuts?: Shortcut[] | undefined;
  min?: Day | undefined;
  max?: Day | undefined;
  /** A value can be taken off (an optional date). */
  clearable?: boolean | undefined;
  /** A typed month and day with no year means the next time it comes round ("jan 15" in October is next
      January). On by default when the earliest allowed date is today or later. */
  ahead?: boolean | undefined;
  kind?: "field" | "property" | undefined;
  /** BCP 47 locale for every date and time label; fixed so server and client render the same. Default "en-US". */
  locale?: string | undefined;
  today?: Day | undefined;
  /** How the chosen date reads on the trigger ("Yesterday", "Fri"), when the app has its own words for dates. */
  display?: ((value: Day) => React.ReactNode) | undefined;
  /** The chosen date is a problem (overdue): the trigger says it in the error colour. */
  tone?: "bad" | undefined;
  className?: string | undefined;
};

export function defaultShortcuts(now: Day): Shortcut[] {
  const monday = addDays(now, ((8 - weekday(now)) % 7) || 7);
  return [
    { label: "Today", day: now },
    { label: "Tomorrow", day: addDays(now, 1) },
    { label: "Next week", day: monday },
    { label: "In 2 weeks", day: addDays(now, 14) },
  ];
}

export const shortcutItem =
  "flex min-h-[var(--ns-menu-row)] w-full cursor-pointer items-center gap-3 rounded-[7px] px-[9px] text-left text-[length:var(--ns-text-body)] text-[var(--ns-ink)] outline-hidden hover:bg-[var(--ns-hover)] focus-visible:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ns-signal)] aria-pressed:bg-[var(--ns-selected)]";

function DatePicker({ value, onValueChange, placeholder = "Add a date", shortcuts, min, max, clearable, ahead: aheadProp, kind = "field", locale = DEFAULT_LOCALE, today, display, tone, className, ...aria }: DatePickerProps) {
  const portalContainer = usePortalContainer();
  const now = today ?? todayOf();
  const ahead = aheadProp ?? (min !== undefined && min >= now);
  const [open, setOpen] = React.useState(false);
  const returnFocus = useReturnFocus();
  const pick = (d: Day | null) => {
    onValueChange(d);
    setOpen(false);
  };
  return (
    <Popover.Root open={open} onOpenChange={(o) => setOpen(o)}>
      <span className={cn("inline-flex min-w-0 items-center gap-1", kind === "field" && "w-full", className)}>
        <Popover.Trigger
          data-slot="date-picker"
          {...aria}
          className={cn(
            "group inline-flex min-w-0 cursor-pointer items-center gap-2 text-left outline-hidden [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-[var(--ns-ink-3)]",
            kind === "field"
              ? cn(fieldSurface, "h-[var(--ns-field)] hover:shadow-[inset_0_0_0_1px_var(--ns-ink-3)] focus-visible:shadow-[inset_0_0_0_1px_var(--ns-ink-2),0_0_0_3px_color-mix(in_oklab,var(--ns-ink)_10%,transparent)] data-popup-open:shadow-[inset_0_0_0_1px_var(--ns-ink-2),0_0_0_3px_color-mix(in_oklab,var(--ns-ink)_10%,transparent)]")
              : "h-6 rounded-[7px] bg-[var(--ns-raised)] px-2 text-[length:var(--ns-text-body)] text-[var(--ns-ink)] shadow-[var(--ns-bezel)] hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] pointer-coarse:h-9 max-[960px]:h-9",
            tone === "bad" && "text-[var(--ns-bad-ink)] [&_svg]:text-[var(--ns-bad-ink)]",
          )}
        >
          <CalendarDays />
          <span className={cn("truncate", !value && "text-[var(--ns-ink-3)]")}>{value ? (display ? display(value) : formatDay(value, "medium", locale)) : placeholder}</span>
        </Popover.Trigger>
        {clearable && value && (
          <button type="button" aria-label="Clear the date" onClick={() => onValueChange(null)} className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-[5px] text-[var(--ns-ink-3)] outline-hidden hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] pointer-coarse:size-9">
            <X className="size-3.5" />
          </button>
        )}
      </span>
      <Popover.Portal container={portalContainer}>
        <Popover.Positioner sideOffset={4} collisionPadding={8} align="start" className={popupPositioner}>
          <Popover.Popup data-slot="date-picker-popup" data-ns-layer="" data-ns-moves="" finalFocus={returnFocus} initialFocus={false} className={cn(popupSurface, "flex gap-2 p-2 max-[600px]:flex-col")}>
            <Popover.Title className="sr-only">{aria["aria-label"] ?? "Pick a date"}</Popover.Title>
            <DateBody locale={locale} key={value ?? "none"} value={value} now={now} shortcuts={shortcuts ?? defaultShortcuts(now)} min={min} max={max} ahead={ahead} onPick={pick} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Mounted only while open, so the typed text starts empty each time. */
function DateBody({ value, locale, now, shortcuts, min, max, ahead, onPick }: { value: Day | null; locale: string; now: Day; shortcuts: Shortcut[]; min?: Day | undefined; max?: Day | undefined; ahead: boolean; onPick: (d: Day) => void }) {
  const [typed, setTyped] = React.useState("");
  const parsed = typed.trim() ? parseDay(typed, now, { ahead }) : null;
  const allowed = parsed && !(min && parsed < min) && !(max && parsed > max) ? parsed : null;
  const readId = React.useId();
  return (
    <>
      <div className="flex w-[180px] shrink-0 flex-col gap-0.5 max-[600px]:w-full">
        <input
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            /* Enter is the field's whatever it holds: a date it can't use stays typed for correcting, and never reaches a dialog's verb */
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              if (allowed) onPick(allowed);
            }
          }}
          aria-label="Type a date"
          aria-describedby={readId}
          placeholder="Type a date…"
          className={cn(fieldSurface, "mb-1 h-[var(--ns-field)]")}
        />
        <span id={readId} aria-live="polite" className="min-h-4 px-[9px] pb-1 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
          {!typed.trim() ? 'Like "nov 3" or "next fri"' : allowed ? <>↵ {formatDay(allowed, "long", locale)}</> : parsed ? "Outside the dates you can pick" : "Not a date yet"}
        </span>
        {shortcuts.map((s) => (
          <button key={s.label} type="button" aria-pressed={s.day === value} disabled={Boolean((min && s.day < min) || (max && s.day > max))} onClick={() => onPick(s.day)} className={cn(shortcutItem, "disabled:opacity-45")}>
            <span className="flex-1">{s.label}</span>
            <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">{formatDay(s.day, "short", locale)}</span>
          </button>
        ))}
      </div>
      <div className="w-px shrink-0 self-stretch bg-[var(--ns-line-soft)] max-[600px]:h-px max-[600px]:w-auto" />
      <Calendar value={value} locale={locale} today={now} min={min} max={max} onPick={onPick} className="p-1" />
    </>
  );
}

export { DatePicker, type DatePickerProps, type Shortcut };
