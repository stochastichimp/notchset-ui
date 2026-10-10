"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * Calendar parts shared by Date Picker, Range Picker and Agenda Calendar: ISO day helpers (yyyy-mm-dd,
 * local time) and a month grid. The grid starts weeks on Monday, rings today in --chart-1, slides in
 * from the direction you travel, and follows the grid keyboard pattern: arrows move a day, PageUp and
 * PageDown a month, Home and End to the ends of the week. Days outside the month are shown but inactive
 * (moving onto one by keyboard turns the month). Each picker draws its own day (renderDay).
 */

/** A day as "yyyy-mm-dd". */
type IsoDay = string

const two = (n: number) => String(n).padStart(2, "0")
const toIso = (d: Date): IsoDay => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`
/** Noon, so daylight-saving shifts never move the day. */
const fromIso = (iso: IsoDay) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y!, m! - 1, d!, 12)
}
const todayIso = () => toIso(new Date())
const noSubscribe = () => () => {}
/** Today in the visitor's own time zone; null while server rendering, so the server never guesses it. */
function useToday(): IsoDay | null {
  return React.useSyncExternalStore(noSubscribe, todayIso, () => null)
}
const addDays = (iso: IsoDay, n: number) => {
  const d = fromIso(iso)
  d.setDate(d.getDate() + n)
  return toIso(d)
}
const addMonths = (iso: IsoDay, n: number) => {
  const d = fromIso(iso)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()))
  return toIso(d)
}
const diffDays = (a: IsoDay, b: IsoDay) => Math.round((fromIso(b).getTime() - fromIso(a).getTime()) / 86400000)
/** The month after (n = 1) or before (n = -1) a [year, month] view. */
const shiftView = ([y, m]: readonly [number, number], n: number): [number, number] => {
  const d = new Date(y, m + n, 1)
  return [d.getFullYear(), d.getMonth()]
}
/** `count` days from the Monday on or before the 1st. */
function monthDays(year: number, month: number, count = 42): IsoDay[] {
  const first = new Date(year, month, 1, 12)
  const start = new Date(first)
  start.setDate(1 - ((first.getDay() + 6) % 7))
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return toIso(d)
  })
}
const formatDay = (iso: IsoDay, options: Intl.DateTimeFormatOptions, locale = "en-US") => fromIso(iso).toLocaleDateString(locale, options)
const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1).toLocaleDateString("en-US", { month: "long" }))
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

interface DayInfo {
  iso: IsoDay
  day: number
  inMonth: boolean
  today: boolean
  weekend: boolean
  selected: boolean
  disabled: boolean
}

interface CalendarGridProps {
  year: number
  /** 0–11. */
  month: number
  /** Cells shown: 42 (six weeks) or 35. */
  count?: number | undefined
  /** Changes on every month change, so the grid slides in; `dir` is the direction of travel. */
  slideKey?: number | string | undefined
  dir?: 1 | -1 | undefined
  /** The day that holds keyboard focus (roving tabindex). */
  focusIso: IsoDay
  onFocusIso: (iso: IsoDay) => void
  onPick: (iso: IsoDay) => void
  onHoverIso?: ((iso: IsoDay | null) => void) | undefined
  isSelected?: ((iso: IsoDay) => boolean) | undefined
  isDisabled?: ((iso: IsoDay) => boolean) | undefined
  renderDay: (info: DayInfo) => React.ReactNode
  /** Cell height in px. Default 36. */
  cellHeight?: number | undefined
  label: string
  className?: string | undefined
}

function CalendarGrid({ year, month, count = 42, slideKey, dir = 1, focusIso, onFocusIso, onPick, onHoverIso, isSelected, isDisabled, renderDay, cellHeight = 36, label, className }: CalendarGridProps) {
  const days = monthDays(year, month, count)
  const today = useToday()
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const moved = React.useRef(false)
  const tabIso = days.includes(focusIso) ? focusIso : (days.find((d) => isSelected?.(d)) ?? days.find((d) => fromIso(d).getMonth() === month)!)

  // After a keyboard move, the day that took focus gets it (also after the month slides).
  React.useEffect(() => {
    if (!moved.current) return
    moved.current = false
    bodyRef.current?.querySelector<HTMLElement>(`[data-iso="${focusIso}"]`)?.focus()
  }, [focusIso, slideKey])

  const onKey = (event: React.KeyboardEvent, iso: IsoDay) => {
    const rtl = (event.currentTarget as HTMLElement).closest("[dir=rtl]") != null
    const dow = (fromIso(iso).getDay() + 6) % 7
    let next: IsoDay | null = null
    if (event.key === "ArrowRight") next = addDays(iso, rtl ? -1 : 1)
    else if (event.key === "ArrowLeft") next = addDays(iso, rtl ? 1 : -1)
    else if (event.key === "ArrowDown") next = addDays(iso, 7)
    else if (event.key === "ArrowUp") next = addDays(iso, -7)
    else if (event.key === "PageDown") next = addMonths(iso, event.shiftKey ? 12 : 1)
    else if (event.key === "PageUp") next = addMonths(iso, event.shiftKey ? -12 : -1)
    else if (event.key === "Home") next = addDays(iso, -dow)
    else if (event.key === "End") next = addDays(iso, 6 - dow)
    if (!next) return
    event.preventDefault()
    moved.current = true
    onFocusIso(next)
  }

  const weeks = Array.from({ length: count / 7 }, (_, w) => days.slice(w * 7, w * 7 + 7))

  return (
    <div role="grid" aria-label={label} className={cn("w-full", className)}>
      <div role="row" className="grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <span key={w} role="columnheader" className="grid h-[26px] place-items-center font-mono text-[10.5px] tracking-[.05em] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] uppercase">
            {w}
          </span>
        ))}
      </div>
      <div className="overflow-hidden">
        <div
          key={slideKey}
          ref={bodyRef}
          className={cn(
            "flex flex-col gap-0.5 motion-reduce:animate-none",
            slideKey != null && slideKey !== 0 && dir > 0 && "animate-[ns-slide-l_.4s_var(--ns-ease-settle)_both] rtl:animate-[ns-slide-r_.4s_var(--ns-ease-settle)_both]",
            slideKey != null && slideKey !== 0 && dir < 0 && "animate-[ns-slide-r_.4s_var(--ns-ease-settle)_both] rtl:animate-[ns-slide-l_.4s_var(--ns-ease-settle)_both]"
          )}
          onMouseLeave={() => onHoverIso?.(null)}
        >
          {weeks.map((week) => (
            <div key={week[0]} role="row" className="grid grid-cols-7">
              {week.map((iso) => {
                const d = fromIso(iso)
                const info: DayInfo = {
                  iso,
                  day: d.getDate(),
                  inMonth: d.getMonth() === month,
                  today: iso === today,
                  weekend: d.getDay() === 0 || d.getDay() === 6,
                  selected: isSelected?.(iso) ?? false,
                  disabled: isDisabled?.(iso) ?? false,
                }
                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    data-iso={iso}
                    tabIndex={iso === tabIso ? 0 : -1}
                    disabled={!info.inMonth}
                    aria-selected={info.selected}
                    aria-current={info.today ? "date" : undefined}
                    aria-disabled={info.disabled || undefined}
                    aria-label={formatDay(iso, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    onClick={() => {
                      if (info.disabled) return
                      onFocusIso(iso)
                      onPick(iso)
                    }}
                    onKeyDown={(event) => onKey(event, iso)}
                    onMouseEnter={() => onHoverIso?.(iso)}
                    className={cn("group/day relative cursor-pointer outline-none focus-visible:z-10 disabled:cursor-default", info.disabled && "cursor-not-allowed")}
                    style={{ height: cellHeight }}
                  >
                    {renderDay(info)}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { addDays, addMonths, CalendarGrid, useToday, diffDays, formatDay, fromIso, monthDays, MONTHS, shiftView, toIso, todayIso, WEEKDAYS, type CalendarGridProps, type DayInfo, type IsoDay }
