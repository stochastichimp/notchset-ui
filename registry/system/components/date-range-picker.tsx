// Notchset date-range-picker 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar, type Range } from "@/components/ui/notchset/calendar";
import { DEFAULT_LOCALE, type Day, formatRange, today as todayOf } from "@/lib/notchset/dates";
import { shortcutItem } from "@/components/ui/notchset/date-picker";
import { popupPositioner, popupSurface } from "@/lib/notchset/popup";
import { useReturnFocus } from "@/lib/notchset/return-focus";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Date range picker: a report's period. Presets first (This quarter, Last quarter, This year), each with its
 * dates written out; or press a start and an end on the calendar, with the days between washed as you hover.
 * The trigger says the range in words ("Oct 1 – Dec 31") or the preset's name; dates you picked yourself show in
 * the list as a ticked Custom row. Esc mid-pick keeps the old range.
 */
type Preset = { label: string; start: Day; end: Day };
type DateRange = { start: Day; end: Day };
type DateRangePickerProps = {
  value: DateRange | null;
  onValueChange: (value: DateRange) => void;
  presets?: Preset[] | undefined;
  "aria-label"?: string | undefined;
  placeholder?: string | undefined;
  min?: Day | undefined;
  max?: Day | undefined;
  /** BCP 47 locale for every date and time label; fixed so server and client render the same. Default "en-US". */
  locale?: string | undefined;
  today?: Day | undefined;
  className?: string | undefined;
};

/** a range is allowed when it runs forward and sits wholly inside min/max */
const validRange = (r: { start: Day; end: Day }, min?: Day, max?: Day) => r.start <= r.end && !(min && r.start < min) && !(max && r.end > max);

function DateRangePicker({ value, onValueChange, presets = [], placeholder = "Pick dates", min, max, locale = DEFAULT_LOCALE, today, className, ...aria }: DateRangePickerProps) {
  const portalContainer = usePortalContainer();
  const now = today ?? todayOf();
  const [open, setOpen] = React.useState(false);
  const returnFocus = useReturnFocus();
  const preset = value && presets.find((p) => p.start === value.start && p.end === value.end);
  const done = (r: DateRange) => {
    if (!validRange(r, min, max)) return;
    onValueChange(r);
    setOpen(false);
  };
  return (
    <Popover.Root open={open} onOpenChange={(o) => setOpen(o)}>
      <Popover.Trigger
        data-slot="date-range-picker"
        {...aria}
        className={cn(
          "inline-flex h-[var(--ns-control-sm)] cursor-pointer items-center gap-1.5 rounded-[var(--ns-radius)] bg-[var(--ns-raised)] px-2.5 text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] shadow-[var(--ns-bezel)] outline-hidden hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] pointer-coarse:h-9 max-[960px]:h-9 [&_svg]:size-3.5 [&_svg]:text-[var(--ns-ink-3)]",
          className,
        )}
      >
        <CalendarRange />
        {value ? (
          <span className="tabular-nums">
            {preset ? <>{preset.label} <span className="ml-1 font-[number:var(--ns-weight-regular)] text-[var(--ns-ink-3)]">{formatRange(value.start, value.end, locale)}</span></> : formatRange(value.start, value.end, locale)}
          </span>
        ) : (
          <span className="text-[var(--ns-ink-3)]">{placeholder}</span>
        )}
      </Popover.Trigger>
      <Popover.Portal container={portalContainer}>
        <Popover.Positioner sideOffset={4} collisionPadding={8} align="end" className={popupPositioner}>
          <Popover.Popup data-slot="date-range-popup" data-ns-layer="" data-ns-moves="" finalFocus={returnFocus} className={cn(popupSurface, "flex gap-2 p-2 max-[600px]:flex-col")}>
            <Popover.Title className="sr-only">{aria["aria-label"] ?? "Pick a date range"}</Popover.Title>
            <RangeBody locale={locale} key={value ? `${value.start}:${value.end}` : "none"} value={value} presets={presets} now={now} min={min} max={max} onDone={done} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function RangeBody({ locale, value, presets, now, min, max, onDone }: { locale: string; value: DateRange | null; presets: Preset[]; now: Day; min?: Day | undefined; max?: Day | undefined; onDone: (r: DateRange) => void }) {
  const [draft, setDraft] = React.useState<Range>(value ?? { start: null, end: null });
  return (
    <>
      {presets.length > 0 && (
        <>
          <div className="flex w-[200px] shrink-0 flex-col gap-0.5 max-[600px]:w-full">
            {presets.map((p) => (
              <button key={p.label} type="button" disabled={!validRange(p, min, max)} aria-pressed={value?.start === p.start && value?.end === p.end} onClick={() => onDone({ start: p.start, end: p.end })} className={cn(shortcutItem, "py-1.5 disabled:opacity-45")}>
                <span className="flex min-w-0 flex-col gap-px">
                  <span className="font-[number:var(--ns-weight-medium)]">{p.label}</span>
                  <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">{formatRange(p.start, p.end, locale)}</span>
                </span>
              </button>
            ))}
            {value && !presets.some((p) => p.start === value.start && p.end === value.end) && (
              // your own dates show as a ticked Custom row, so it is clear you are not on a preset
              <div aria-current="true" className={cn(shortcutItem, "cursor-default bg-[var(--ns-selected)] py-1.5 hover:bg-[var(--ns-selected)]")}>
                <span className="flex min-w-0 flex-col gap-px">
                  <span className="font-[number:var(--ns-weight-medium)]">Custom</span>
                  <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">{formatRange(value.start, value.end, locale)}</span>
                </span>
              </div>
            )}
          </div>
          <div className="w-px shrink-0 self-stretch bg-[var(--ns-line-soft)] max-[600px]:h-px max-[600px]:w-auto" />
        </>
      )}
      <div className="flex flex-col gap-1">
        <Calendar
          range={draft}
          locale={locale}
          today={now}
          min={min}
          max={max}
          onRangeChange={(r) => {
            setDraft(r);
            if (r.start && r.end) onDone({ start: r.start, end: r.end });
          }}
          className="p-1"
        />
        <span aria-live="polite" className="px-1.5 pb-1 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
          {draft.start && !draft.end ? "Now pick the last day" : "Pick the first day"}
        </span>
      </div>
    </>
  );
}

export { DateRangePicker, type DateRange, type DateRangePickerProps, type Preset };
