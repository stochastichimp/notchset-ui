"use client"

/**
 * Date Picker (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/date-picker
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"
import { Popover } from "radix-ui"

import { cn } from "@/lib/utils"
import { formatDay, useToday, type IsoDay } from "@/lib/notchset/calendar"
import { DatePanel, relative, type QuickPick } from "@/lib/notchset/date-panel"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useTimeline, usePortal } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Date Picker (Radix build): a field that opens a calendar with quick picks. Click the month or the
 * year to jump straight there; months slide in from the side you travel to, today has a blue ring, and
 * the field says how far away the date is. Picking pops, fills the day and closes.
 */

interface DatePickerProps extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  /** The day as "yyyy-mm-dd". */
  value?: IsoDay | null | undefined
  defaultValue?: IsoDay | null | undefined
  onValueChange?: ((value: IsoDay) => void) | undefined
  label?: React.ReactNode | undefined
  /** Under the field; a function gets the chosen day. */
  helper?: React.ReactNode | ((value: IsoDay) => React.ReactNode) | undefined
  placeholder?: string | undefined
  quickPicks?: readonly QuickPick[] | false | undefined
  /** Days that can't be picked. */
  isDisabled?: ((iso: IsoDay) => boolean) | undefined
  sound?: boolean | undefined
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(function DatePicker(
  { value, defaultValue = null, onValueChange, label = "Date", helper, placeholder = "Pick a date", quickPicks, isDisabled, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const container = usePortal()
  const today = useToday()
  const [inner, setInner] = React.useState<IsoDay | null>(defaultValue)
  const day = value === undefined ? inner : value
  const [open, setOpen] = React.useState(false)
  const [opens, setOpens] = React.useState(0)
  const id = React.useId()

  const pick = (iso: IsoDay) => {
    if (value === undefined) setInner(iso)
    onValueChange?.(iso)
    timeline.after(260, () => setOpen(false))
  }

  return (
    <div ref={ref} data-slot="date-picker" data-notchset="" className={cn("flex w-full max-w-[320px] flex-col gap-2", className)} {...props}>
      <span id={`${id}-label`} className="text-[length:var(--ns-type-label)] font-medium text-[var(--foreground)]">
        {label}
      </span>
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          sfx.tick()
          setOpen(next)
          if (next) setOpens((n) => n + 1)
        }}
      >
        <Popover.Trigger
          aria-labelledby={`${id}-label ${id}-value`}
          className={cn(
            "flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-[var(--radius)] border bg-[var(--background)] px-3.5 text-[length:var(--ns-type-copy)] text-[var(--foreground)] outline-none [transition:border-color_.2s,box-shadow_var(--ns-time-state)] focus-visible:border-[color-mix(in_oklab,var(--foreground)_55%,var(--input))] focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]",
            open ? "border-[color-mix(in_oklab,var(--foreground)_55%,var(--input))] shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]" : "border-[var(--input)]"
          )}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
          </svg>
          <span id={`${id}-value`} className={cn("font-medium", !day && "font-normal text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>
            {day ? <NumberFlow value={formatDay(day, { weekday: "short", month: "short", day: "numeric" })} /> : placeholder}
          </span>
          {day && today && <NumberFlow aria-hidden="true" value={relative(today, day)} className="ms-auto shrink-0 font-mono text-[11px] text-[color-mix(in_oklab,var(--chart-1,var(--foreground))_80%,var(--foreground))]" />}
        </Popover.Trigger>
        <Popover.Portal container={container}>
          <Popover.Content
            data-slot="date-picker-popup"
            aria-label="Choose a date"
            side="bottom"
            align="start"
            sideOffset={8}
            className="z-50 w-[300px] origin-top-left animate-[ns-menu-fade_.16s,ns-menu-pop_.34s_var(--ns-ease-reshape)] rounded-[calc(min(var(--radius),16px)+4px)] border border-[var(--border)] bg-[var(--background)] p-3 text-[var(--foreground)] shadow-[0_20px_44px_-18px_rgba(0,0,0,.28)] outline-none rtl:origin-top-right"
          >
            <DatePanel key={opens} value={day} onPick={pick} quickPicks={quickPicks} isDisabled={isDisabled} sound={sound} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {helper && day && <span className="text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{typeof helper === "function" ? helper(day) : helper}</span>}
    </div>
  )
})

export { DatePicker, type DatePickerProps }
