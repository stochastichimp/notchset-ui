"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { addDays, CalendarGrid, diffDays, formatDay, fromIso, MONTHS, shiftView, todayIso, useToday, type DayInfo, type IsoDay } from "@/lib/notchset/calendar"
import { useSound } from "@/lib/notchset/sound"

/*
 * Date Picker's shared parts (both builds wrap them in their own popover): the calendar panel with its
 * Month and Year jumps, quick picks on one line, and three views in one box (days, months, years); the
 * day cell; and the trigger's relative hint ("in 7 days", "tomorrow", "3 days ago").
 */

interface QuickPick {
  label: string
  /** Days from today. */
  days: number
}

const QUICK: readonly QuickPick[] = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "Next Mon", days: -1 },
  { label: "+2 weeks", days: 14 },
]

/** "Next Mon" is the coming Monday; every other pick is a day offset. */
function quickDay(today: IsoDay, pick: QuickPick) {
  if (pick.days >= 0) return addDays(today, pick.days)
  const dow = fromIso(today).getDay()
  return addDays(today, ((8 - dow) % 7) || 7)
}

function relative(today: IsoDay | null, iso: IsoDay) {
  if (!today) return ""
  const d = diffDays(today, iso)
  return d === 0 ? "today" : d === 1 ? "tomorrow" : d === -1 ? "yesterday" : d > 0 ? `in ${d} days` : `${-d} days ago`
}

/** The day as Date Picker draws it: a filled pick, a blue ring and dot for today, muted weekends. */
function DateCell({ info }: { info: DayInfo }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-[3px] inset-y-0.5 rounded-[min(var(--radius),12px)] [transition:background-color_.2s,transform_.35s_var(--ns-ease-rebound),scale_.35s_var(--ns-ease-rebound),translate_.35s_var(--ns-ease-rebound),rotate_.35s_var(--ns-ease-rebound)]",
          info.selected ? "scale-100 bg-[var(--foreground)]" : "scale-90 group-hover/day:bg-[var(--accent)] group-focus-visible/day:bg-[var(--accent)]",
          info.today && !info.selected && "shadow-[inset_0_0_0_1.5px_var(--chart-1,var(--ring))]",
          !info.inMonth && "group-hover/day:bg-transparent"
        )}
      />
      <span
        className={cn(
          "relative text-[length:var(--ns-type-label)] tabular-nums",
          info.selected || info.today ? "font-semibold" : "font-normal",
          info.selected && "text-[var(--background)]",
          !info.selected && !info.inMonth && "text-[color-mix(in_oklab,var(--muted-foreground)_45%,transparent)]",
          !info.selected && info.inMonth && info.weekend && "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]",
          !info.selected && info.inMonth && !info.weekend && "text-[var(--foreground)]"
        )}
      >
        {info.day}
      </span>
      {info.today && <span aria-hidden="true" className={cn("absolute bottom-[5px] left-1/2 size-1 -translate-x-1/2 rounded-full", info.selected ? "bg-[var(--background)]" : "bg-[var(--chart-1,var(--ring))]")} />}
    </>
  )
}

interface DatePanelProps {
  value: IsoDay | null
  onPick: (iso: IsoDay) => void
  quickPicks?: readonly QuickPick[] | false | undefined
  isDisabled?: ((iso: IsoDay) => boolean) | undefined
  sound?: boolean | undefined
}

/** The popover's contents. Mount it fresh on every open (a key), so it opens on the chosen month. */
function DatePanel({ value, onPick, quickPicks = QUICK, isDisabled, sound = true }: DatePanelProps) {
  const { sfx } = useSound(sound)
  const today = useToday()
  const start = value ?? today ?? todayIso()
  const [view, setView] = React.useState<[number, number]>(() => [fromIso(start).getFullYear(), fromIso(start).getMonth()])
  const [mode, setMode] = React.useState<"days" | "months" | "years">("days")
  const [slide, setSlide] = React.useState({ key: 0, dir: 1 as 1 | -1 })
  const [focusIso, setFocusIso] = React.useState(start)

  const go = (dir: 1 | -1) => {
    sfx.turn(dir)
    setView((v) => shiftView(v, dir))
    setSlide((s) => ({ key: s.key + 1, dir }))
  }
  const toView = (iso: IsoDay) => {
    const d = fromIso(iso)
    const next: [number, number] = [d.getFullYear(), d.getMonth()]
    if (next[0] !== view[0] || next[1] !== view[1]) {
      const dir = next[0] * 12 + next[1] > view[0] * 12 + view[1] ? 1 : -1
      setView(next)
      setSlide((s) => ({ key: s.key + 1, dir }))
    }
  }
  const pick = (iso: IsoDay) => {
    sfx.pop()
    toView(iso)
    onPick(iso)
  }
  const yearsFrom = view[0] - 5

  return (
    <div data-slot="date-panel" className="flex flex-col">
      <div className="flex items-center justify-between px-0.5 pt-0.5 pb-2">
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            aria-expanded={mode === "months"}
            onClick={() => {
              sfx.tick()
              setMode((m) => (m === "months" ? "days" : "months"))
            }}
            className={cn("flex h-[30px] cursor-pointer items-center gap-1 rounded-[8px] px-2 text-[15px] font-semibold tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", mode === "months" && "bg-[var(--accent)]")}
          >
            {MONTHS[view[1]]}
            <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-3.5 [transition:transform_.3s_var(--ns-ease-pop),scale_.3s_var(--ns-ease-pop),translate_.3s_var(--ns-ease-pop),rotate_.3s_var(--ns-ease-pop)]", mode === "months" && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-expanded={mode === "years"}
            onClick={() => {
              sfx.tick()
              setMode((m) => (m === "years" ? "days" : "years"))
            }}
            className={cn(
              "flex h-[30px] cursor-pointer items-center gap-1 rounded-[8px] px-2 font-mono text-[length:var(--ns-type-label)] outline-none hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]",
              mode === "years" ? "bg-[var(--accent)] text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
            )}
          >
            {view[0]}
            <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-3 [transition:transform_.3s_var(--ns-ease-pop),scale_.3s_var(--ns-ease-pop),translate_.3s_var(--ns-ease-pop),rotate_.3s_var(--ns-ease-pop)]", mode === "years" && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </span>
        {mode === "days" && (
          <span className="flex items-center">
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                aria-label={dir < 0 ? "Previous month" : "Next month"}
                onClick={() => go(dir)}
                className="grid size-7 cursor-pointer place-items-center rounded-[8px] text-[var(--foreground)] outline-none hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.9]"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={dir < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
                </svg>
              </button>
            ))}
          </span>
        )}
      </div>
      {quickPicks && today && (
        <div className="mb-1.5 flex gap-1 border-b border-[var(--border)] pb-2.5">
          {quickPicks.map((q) => {
            const iso = quickDay(today, q)
            const on = iso === value
            return (
              <button
                key={q.label}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setFocusIso(iso)
                  setMode("days")
                  pick(iso)
                }}
                className={cn(
                  "inline-flex h-[26px] min-w-0 flex-[1_1_auto] cursor-pointer items-center justify-center truncate rounded-[var(--radius)] border border-[var(--border)] px-2 text-[11px] font-medium outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s,color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.95]",
                  on ? "bg-[var(--foreground)] text-[var(--background)]" : "bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                )}
              >
                {q.label}
              </button>
            )
          })}
        </div>
      )}
      {mode === "days" && (
        <CalendarGrid
          year={view[0]}
          month={view[1]}
          slideKey={slide.key}
          dir={slide.dir}
          focusIso={focusIso}
          onFocusIso={(iso) => {
            setFocusIso(iso)
            toView(iso)
          }}
          onPick={pick}
          isSelected={(iso) => iso === value}
          isDisabled={isDisabled}
          renderDay={(info) => <DateCell info={info} />}
          label={`${MONTHS[view[1]]} ${view[0]}`}
        />
      )}
      {mode !== "days" && (
        <div key={mode} className="grid animate-[ns-reveal_.3s_cubic-bezier(.2,.8,.2,1)_both] grid-cols-3 gap-1.5 pt-1.5 pb-0.5">
          {Array.from({ length: 12 }, (_, i) => {
            const isMonths = mode === "months"
            const on = isMonths ? i === view[1] : yearsFrom + i === view[0]
            const now = today ? (isMonths ? view[0] === fromIso(today).getFullYear() && i === fromIso(today).getMonth() : yearsFrom + i === fromIso(today).getFullYear()) : false
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  sfx.tone(800 + i * 40, 0.03, "triangle", 0.035)
                  if (isMonths) {
                    const dir = i >= view[1] ? 1 : -1
                    setView([view[0], i])
                    setSlide((s) => ({ key: s.key + 1, dir }))
                    setMode("days")
                  } else {
                    setView([yearsFrom + i, view[1]])
                    setMode("months")
                  }
                }}
                className={cn(
                  "h-[42px] cursor-pointer rounded-[min(var(--radius),12px)] text-[length:var(--ns-type-label)] outline-none [transition:background-color_.2s,transform_.15s,scale_.15s,translate_.15s,rotate_.15s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.95]",
                  on ? "bg-[var(--foreground)] font-semibold text-[var(--background)]" : "font-normal text-[var(--foreground)] hover:bg-[var(--accent)]",
                  now && !on && "shadow-[inset_0_0_0_1.5px_var(--chart-1,var(--ring))]",
                  !isMonths && "font-mono"
                )}
              >
                {isMonths ? MONTHS[i]!.slice(0, 3) : yearsFrom + i}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { DateCell, DatePanel, formatDay, relative, type DatePanelProps, type QuickPick }
