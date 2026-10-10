"use client"

/**
 * Range Picker (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/range-picker
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { addDays, CalendarGrid, diffDays, formatDay, fromIso, MONTHS, shiftView, toIso, todayIso, useToday, type DayInfo, type IsoDay } from "@/lib/notchset/calendar"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { Announcer, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Range Picker: preset ranges on a rail with a sliding highlight, two months side by side, and a footer
 * with From, To, a live day count, Clear and Apply. After a start, hovering previews the band with a
 * note that rises with its length; clicking any day switches the preset to Custom.
 */

interface DateRange {
  from: IsoDay
  to: IsoDay
}

interface RangePreset {
  label: string
  /** The range for a given today; null for Custom. */
  range: ((today: IsoDay) => DateRange) | null
}

const startOfMonth = (iso: IsoDay) => `${iso.slice(0, 8)}01`
const endOfMonth = (iso: IsoDay) => {
  const d = fromIso(iso)
  return toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12))
}

const PRESETS: readonly RangePreset[] = [
  { label: "Today", range: (t) => ({ from: t, to: t }) },
  { label: "Yesterday", range: (t) => ({ from: addDays(t, -1), to: addDays(t, -1) }) },
  { label: "Last 7 days", range: (t) => ({ from: addDays(t, -6), to: t }) },
  { label: "Last 30 days", range: (t) => ({ from: addDays(t, -29), to: t }) },
  { label: "This month", range: (t) => ({ from: startOfMonth(t), to: t }) },
  {
    label: "Last month",
    range: (t) => {
      const last = addDays(startOfMonth(t), -1)
      return { from: startOfMonth(last), to: last }
    },
  },
  {
    label: "Last quarter",
    range: (t) => {
      const d = fromIso(t)
      const q = Math.floor(d.getMonth() / 3)
      const from = new Date(d.getFullYear(), q * 3 - 3, 1, 12)
      return { from: toIso(from), to: endOfMonth(toIso(new Date(from.getFullYear(), from.getMonth() + 2, 1, 12))) }
    },
  },
  { label: "Year to date", range: (t) => ({ from: `${t.slice(0, 4)}-01-01`, to: t }) },
  {
    label: "Last 12 months",
    range: (t) => {
      const d = fromIso(t)
      return { from: addDays(toIso(new Date(d.getFullYear() - 1, d.getMonth(), d.getDate(), 12)), 1), to: t }
    },
  },
  { label: "Custom", range: null },
]

interface RangePickerProps extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  value?: DateRange | null | undefined
  defaultValue?: DateRange | null | undefined
  /** Every change, as it happens (a start alone is not a range yet). */
  onValueChange?: ((value: DateRange | null) => void) | undefined
  /** Apply pressed with a full range. */
  onApply?: ((value: DateRange) => void) | undefined
  presets?: readonly RangePreset[] | undefined
  /** The preset shown as chosen at first (its index). Default "Last 30 days". */
  defaultPreset?: number | undefined
  /** Earliest and latest days that can be picked. */
  min?: IsoDay | undefined
  max?: IsoDay | undefined
  sound?: boolean | undefined
}

function RangeCell({ info, start, end, preview }: { info: DayInfo; start: IsoDay | null; end: IsoDay | null; preview: boolean }) {
  if (!info.inMonth) return null
  const isS = info.iso === start
  const isE = info.iso === end
  const inside = start != null && end != null && info.iso > start && info.iso < end
  const band = inside || ((isS || isE) && end != null && start !== end)
  const solid = isS || (isE && !preview)
  return (
    <>
      {band && (
        <span
          aria-hidden="true"
          className={cn("absolute inset-y-0.5 [transition:background-color_.15s]", preview ? "bg-[color-mix(in_oklab,var(--chart-1,var(--ring))_9%,transparent)]" : "bg-[color-mix(in_oklab,var(--chart-1,var(--ring))_15%,transparent)]")}
          style={{ insetInlineStart: isS ? "50%" : 0, insetInlineEnd: isE ? "50%" : 0 }}
        />
      )}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-[3px] inset-y-0.5 rounded-[min(var(--radius),11px)] [transition:transform_.35s_var(--ns-ease-rebound),scale_.35s_var(--ns-ease-rebound),translate_.35s_var(--ns-ease-rebound),rotate_.35s_var(--ns-ease-rebound),background-color_.2s]",
          isS || isE ? "scale-100" : "scale-[.7] group-hover/day:scale-100 group-hover/day:bg-[var(--accent)] group-focus-visible/day:scale-100 group-focus-visible/day:bg-[var(--accent)]",
          solid && "bg-[color-mix(in_oklab,var(--chart-1,var(--foreground))_80%,#000)]",
          isE && preview && "bg-[color-mix(in_oklab,var(--chart-1,var(--foreground))_35%,transparent)]",
          info.today && !solid && "shadow-[inset_0_0_0_1.5px_var(--chart-1,var(--ring))]"
        )}
      />
      <span
        className={cn(
          "relative text-[12.5px] tabular-nums",
          isS || isE || info.today ? "font-semibold" : "font-normal",
          solid && "text-white",
          !solid && info.disabled && "text-[color-mix(in_oklab,var(--muted-foreground)_70%,var(--background))]",
          !solid && !info.disabled && "text-[var(--foreground)]"
        )}
      >
        {info.day}
      </span>
    </>
  )
}

const RangePicker = React.forwardRef<HTMLDivElement, RangePickerProps>(function RangePicker(
  { value, defaultValue, onValueChange, onApply, presets = PRESETS, defaultPreset = 3, min, max, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const today = useToday()
  const [preset, setPreset] = React.useState(defaultPreset)
  const [inner, setInner] = React.useState<{ start: IsoDay | null; end: IsoDay | null }>(() => {
    if (defaultValue !== undefined) return { start: defaultValue?.from ?? null, end: defaultValue?.to ?? null }
    const r = presets[defaultPreset]?.range?.(todayIso())
    return { start: r?.from ?? null, end: r?.to ?? null }
  })
  const sel = value !== undefined ? { start: value?.from ?? null, end: value?.to ?? null } : inner
  const [hover, setHover] = React.useState<IsoDay | null>(null)
  const anchor = sel.end ?? sel.start ?? todayIso()
  const [view, setView] = React.useState<[number, number]>(() => shiftView([fromIso(anchor).getFullYear(), fromIso(anchor).getMonth()], -1))
  const [slide, setSlide] = React.useState({ key: 0, dir: 1 as 1 | -1 })
  const [focusIso, setFocusIso] = React.useState(anchor)
  const [applied, setApplied] = React.useState(false)
  const [shakes, setShakes] = React.useState(0)
  const second = shiftView(view, 1)
  const previewEnd = sel.end ?? (sel.start && hover && hover >= sel.start ? hover : null)
  const preview = sel.end == null
  const days = sel.start && previewEnd ? diffDays(sel.start, previewEnd) + 1 : 0

  const set = (start: IsoDay | null, end: IsoDay | null) => {
    if (value === undefined) setInner({ start, end })
    onValueChange?.(start && end ? { from: start, to: end } : null)
    setApplied(false)
  }
  const showEnd = (end: IsoDay, dir: 1 | -1) => {
    const next = shiftView([fromIso(end).getFullYear(), fromIso(end).getMonth()], -1)
    if (next[0] !== view[0] || next[1] !== view[1]) {
      setView(next)
      setSlide((s) => ({ key: s.key + 1, dir }))
    }
  }
  const go = (dir: 1 | -1) => {
    sfx.turn(dir)
    setView((v) => shiftView(v, dir))
    setSlide((s) => ({ key: s.key + 1, dir }))
  }
  const choosePreset = (i: number) => {
    const p = presets[i]
    if (!p) return
    sfx.tone(700 + i * 50, 0.03, "triangle", 0.035)
    setPreset(i)
    if (!p.range) {
      set(null, null)
      return
    }
    timeline.after(60, () => sfx.ding(Math.min(4, Math.floor(i / 2))))
    const r = p.range(today ?? todayIso())
    set(r.from, r.to)
    setFocusIso(r.to)
    showEnd(r.to, -1)
  }
  const pickDay = (iso: IsoDay) => {
    setPreset(presets.findIndex((p) => !p.range))
    if (!sel.start || sel.end || iso < sel.start) {
      sfx.tone(700, 0.04, "triangle", 0.04)
      set(iso, null)
      setHover(iso)
      return
    }
    sfx.pop()
    timeline.after(80, () => sfx.ding(2))
    set(sel.start, iso)
  }
  const isDisabled = (iso: IsoDay) => (min != null && iso < min) || (max != null && iso > max)
  const grid = (y: number, m: number) => (
    <div className="flex min-w-[236px] flex-1 flex-col gap-1">
      <span className="block py-1.5 text-center text-[length:var(--ns-type-label)] font-semibold text-[var(--foreground)]">
        {MONTHS[m]} {y}
      </span>
      <CalendarGrid
        year={y}
        month={m}
        slideKey={slide.key}
        dir={slide.dir}
        cellHeight={34}
        focusIso={focusIso}
        onFocusIso={(iso) => {
          setFocusIso(iso)
          const d = fromIso(iso)
          const idx = d.getFullYear() * 12 + d.getMonth()
          const first = view[0] * 12 + view[1]
          if (idx < first) go(-1)
          else if (idx > first + 1) go(1)
        }}
        onPick={pickDay}
        onHoverIso={(iso) => {
          if (!iso || !sel.start || sel.end || iso < sel.start || iso === hover) return
          sfx.hover(diffDays(sel.start, iso))
          setHover(iso)
        }}
        isSelected={(iso) => iso === sel.start || iso === sel.end}
        isDisabled={isDisabled}
        renderDay={(info) => <RangeCell info={info} start={sel.start} end={previewEnd} preview={preview} />}
        label={`${MONTHS[m]} ${y}`}
      />
    </div>
  )

  return (
    <div ref={ref} data-slot="range-picker" data-notchset="" className={cn("flex w-full max-w-[820px] flex-wrap overflow-hidden rounded-[min(var(--radius),18px)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]", className)} {...props}>
      <div className="flex shrink-0 basis-[190px] flex-col gap-0.5 border-e border-[var(--border)] p-2.5 max-sm:basis-full max-sm:border-e-0 max-sm:border-b">
        <span className="px-2.5 py-1.5 font-mono text-[10.5px] tracking-[.07em] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] uppercase">Ranges</span>
        <div role="radiogroup" aria-label="Preset ranges" className="relative flex flex-col">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[34px] rounded-[min(var(--radius),10px)] bg-[var(--accent)] [transition:transform_.4s_cubic-bezier(.2,1.25,.3,1),scale_.4s_cubic-bezier(.2,1.25,.3,1),translate_.4s_cubic-bezier(.2,1.25,.3,1),rotate_.4s_cubic-bezier(.2,1.25,.3,1)]" style={{ transform: `translateY(${preset * 34}px)` }} />
          {presets.map((p, i) => {
            const r = p.range && today ? p.range(today) : null
            return (
              <button
                key={p.label}
                type="button"
                role="radio"
                aria-checked={i === preset}
                onClick={() => choosePreset(i)}
                className={cn(
                  "relative flex h-[34px] cursor-pointer items-center justify-between rounded-[min(var(--radius),10px)] px-2.5 text-start text-[length:var(--ns-type-label)] outline-none [transition:color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-inset",
                  i === preset ? "font-semibold text-[var(--foreground)]" : "font-normal text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] hover:text-[var(--foreground)]"
                )}
              >
                {p.label}
                {r && <span className="font-mono text-[10.5px] font-normal text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{diffDays(r.from, r.to) + 1}d</span>}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex min-w-[280px] flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
          {([-1, 1] as const).map((dir) => (
            <React.Fragment key={dir}>
              {dir > 0 && <span className="font-mono text-[11px] whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{!sel.start ? "Pick a start date" : !sel.end ? "Now pick an end date" : (presets[preset]?.label ?? "Custom")}</span>}
              <button
                type="button"
                aria-label={dir < 0 ? "Previous month" : "Next month"}
                onClick={() => go(dir)}
                className="grid size-[30px] cursor-pointer place-items-center rounded-[8px] text-[var(--foreground)] outline-none hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.9]"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={dir < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
                </svg>
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-wrap gap-5 px-[18px] pb-3">
          {grid(view[0], view[1])}
          {grid(second[0], second[1])}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-[34px] items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 font-mono text-[length:var(--ns-type-note)] whitespace-nowrap">
              <span className="sr-only">From </span>
              {sel.start ? formatDay(sel.start, { month: "short", day: "numeric", year: "numeric" }) : "Start"}
            </span>
            <span aria-hidden="true" className="text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] rtl:-scale-x-100">
              →
            </span>
            <span className={cn("flex h-[34px] items-center rounded-[var(--radius)] border px-3 font-mono text-[length:var(--ns-type-note)] whitespace-nowrap [transition:border-color_.2s]", sel.start && !sel.end ? "border-[var(--chart-1,var(--ring))]" : "border-[var(--border)]")}>
              <span className="sr-only">To </span>
              {previewEnd ? formatDay(previewEnd, { month: "short", day: "numeric", year: "numeric" }) : "End"}
            </span>
            {days > 0 && <NumberFlow value={`${days} ${days === 1 ? "day" : "days"}${preview ? " · preview" : ""}`} className="font-mono text-[11px] text-[color-mix(in_oklab,var(--chart-1,var(--foreground))_80%,var(--foreground))]" />}
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                sfx.drop()
                setPreset(presets.findIndex((p) => !p.range))
                set(null, null)
                setHover(null)
              }}
              className="inline-flex h-[34px] cursor-pointer items-center rounded-[var(--radius)] px-3.5 text-[length:var(--ns-type-note)] font-medium text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] outline-none hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
            >
              Clear
            </button>
            <button
              type="button"
              aria-disabled={!sel.start || !sel.end}
              onClick={() => {
                if (!sel.start || !sel.end) {
                  sfx.buzz()
                  setShakes((n) => n + 1)
                  return
                }
                sfx.press()
                timeline.after(120, () => sfx.chime())
                setApplied(true)
                onApply?.({ from: sel.start, to: sel.end })
              }}
              className={cn(
                "inline-flex h-[34px] w-24 cursor-pointer items-center justify-center rounded-[var(--radius)] text-[length:var(--ns-type-note)] font-medium outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s,opacity_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                applied ? "bg-[var(--success,var(--primary))] text-[var(--success-foreground,var(--primary-foreground))]" : "bg-[var(--primary)] text-[var(--primary-foreground)]",
                (!sel.start || !sel.end) && "opacity-40",
                shakes > 0 && (shakes % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]")
              )}
            >
              <span className="block h-[18px] overflow-hidden">
                <span className="flex flex-col [transition:transform_.5s_var(--ns-ease-reshape),scale_.5s_var(--ns-ease-reshape),translate_.5s_var(--ns-ease-reshape),rotate_.5s_var(--ns-ease-reshape)]" style={{ transform: `translateY(${applied ? -18 : 0}px)` }}>
                  <span aria-hidden={applied || undefined} className="h-[18px] leading-[18px]">
                    Apply
                  </span>
                  <span aria-hidden={!applied || undefined} className="flex h-[18px] items-center gap-1">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Applied
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
      <Announcer message={!preview && days > 0 ? `${days} ${days === 1 ? "day" : "days"} selected` : sel.start && preview ? "Pick an end date" : ""} />
    </div>
  )
})

export { RangePicker, type DateRange, type RangePickerProps, type RangePreset }
