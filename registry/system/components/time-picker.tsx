// Notchset time-picker 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Combobox as Base } from "@base-ui/react/combobox";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, parseTime } from "@/lib/notchset/dates";
import { fieldSurface } from "@/components/ui/notchset/field";
import { popupEmpty, popupItem, popupPositioner, popupSurface } from "@/lib/notchset/popup";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Time picker: a meeting's start. Type it any way ("2:30pm", "1430", "2p", "noon") and the list jumps to that
 * time and the quarter hours after it; or pick from the list. Suggestions (the prototype's common slots) sit
 * beside it as chips for one-press picks. 12 or 24 hours follows the reader's locale unless set.
 */
type TimePickerProps = {
  /** Minutes after midnight. */
  value: number | null;
  onValueChange: (value: number) => void;
  "aria-label"?: string | undefined;
  /** One-press times shown as chips (minutes after midnight). */
  suggestions?: number[] | undefined;
  hour12?: boolean | undefined;
  /** Minutes between listed times. */
  step?: number | undefined;
  className?: string | undefined;
};

type Slot = { minutes: number; label: string };

function TimePicker({ value, onValueChange, suggestions = [], hour12, step = 15, className, ...aria }: TimePickerProps) {
  const portalContainer = usePortalContainer();
  const twelve = hour12 ?? new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12 ?? false;
  const fmt = (m: number) => formatTime(m, twelve);
  const [query, setQuery] = React.useState<string | null>(null);
  const typed = query === null ? null : parseTime(query);
  const all = React.useMemo(() => Array.from({ length: (24 * 60) / step }, (_, i) => i * step), [step]);
  const from = typed ?? (query ? null : value ?? 9 * 60);
  const shown: Slot[] = (
    from === null
      ? all.filter((m) => fmt(m).toLowerCase().replace(/\s/g, "").startsWith((query ?? "").toLowerCase().replace(/\s/g, "")))
      : [...(typed !== null && typed % step ? [typed] : []), ...all.filter((m) => m >= from - (typed === null ? step * 2 : 0))]
  )
    .slice(0, 10)
    .map((m) => ({ minutes: m, label: fmt(m) }));
  const chosen = value === null ? null : { minutes: value, label: fmt(value) };

  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Base.Root
        items={shown}
        filter={null}
        value={chosen}
        onValueChange={(s) => {
          if (s) onValueChange((s as Slot).minutes);
          setQuery(null);
        }}
        inputValue={query ?? chosen?.label ?? ""}
        onInputValueChange={(q) => setQuery(q)}
        itemToStringLabel={(s: Slot) => s.label}
        isItemEqualToValue={(a: Slot, b: Slot) => a.minutes === b.minutes}
        autoHighlight
      >
        <Base.InputGroup data-slot="time-picker" className={cn(fieldSurface, "flex h-[var(--ns-field)] w-[128px] items-center gap-2 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-[var(--ns-ink-3)]")}>
          <Clock />
          <Base.Input placeholder={twelve ? "2:30 PM" : "14:30"} {...aria} onBlur={() => setQuery(null)} className="h-full min-w-0 flex-1 bg-transparent tabular-nums outline-hidden placeholder:text-[var(--ns-ink-3)]" />
        </Base.InputGroup>
        <Base.Portal container={portalContainer}>
          <Base.Positioner sideOffset={4} collisionPadding={8} align="start" className={popupPositioner}>
            <Base.Popup data-slot="time-popup" data-ns-moves="" className={cn(popupSurface, "min-w-[128px]")}>
              <Base.Empty className={popupEmpty}>Not a time yet</Base.Empty>
              <Base.List>
                {(s: Slot) => (
                  <Base.Item key={s.minutes} value={s} className={cn(popupItem, "tabular-nums")}>
                    {s.label}
                  </Base.Item>
                )}
              </Base.List>
            </Base.Popup>
          </Base.Positioner>
        </Base.Portal>
      </Base.Root>
      {suggestions.map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={m === value}
          onClick={() => onValueChange(m)}
          className="h-[var(--ns-segment)] cursor-pointer rounded-[var(--ns-radius)] px-2.5 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-2)] tabular-nums shadow-[inset_0_0_0_1px_var(--ns-line)] outline-hidden hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] aria-pressed:bg-[var(--ns-raised)] aria-pressed:text-[var(--ns-ink)] aria-pressed:shadow-[var(--ns-bezel)]"
        >
          {fmt(m)}
        </button>
      ))}
    </span>
  );
}

export { TimePicker, type TimePickerProps };
