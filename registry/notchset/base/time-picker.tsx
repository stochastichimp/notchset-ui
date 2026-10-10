"use client"

/**
 * Time Picker (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/time-picker
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"
import { useWheel } from "@/lib/notchset/wheel"

/*
 * Time Picker: a large mono readout whose digits roll, a sliding AM/PM switch, and hour and minute
 * wheels under a fixed slab. Scroll, drag (the list follows your finger, then springs to the slot), tap
 * a row or use the arrow keys; each value passed is a soft detent. Quick picks move everything together,
 * and the time zone is always on show.
 */

const ROW = 36
const SLAB_TOP = 69

interface WheelProps {
  label: string
  count: number
  index: number
  onIndex: (i: number) => void
  format: (i: number) => string
  kind: "h" | "m"
  sound: boolean
}

function Wheel({ label, count, index, onIndex, format, kind, sound }: WheelProps) {
  const { sfx } = useSound(sound)
  const wheel = useWheel({ count, index, onIndex, row: ROW, slabTop: SLAB_TOP, onDetent: (i) => sfx.wheel(i, kind) })
  const drag = wheel.dragging
  const ty = wheel.offset

  return (
    <div className="flex flex-col gap-1">
      <span aria-hidden="true" className="px-1.5 py-0.5 font-mono text-[10px] tracking-[.07em] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] uppercase">
        {label}
      </span>
      <div
        {...wheel.props}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={count - 1}
        aria-valuenow={index}
        aria-valuetext={format(index)}
        className={cn(
          "relative h-[172px] touch-none overflow-hidden rounded-[min(var(--radius),12px)] outline-none select-none [mask-image:linear-gradient(transparent,#000_30%,#000_70%,transparent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]",
          drag ? "cursor-grabbing" : "cursor-grab"
        )}
      >
        <span aria-hidden="true" className="absolute inset-x-0.5 h-[34px] rounded-[min(var(--radius),10px)] bg-[var(--foreground)]" style={{ top: SLAB_TOP }} />
        {/* The rows are drawn as decoration (their text is CSS content): the spinbutton carries the value. */}
        <div
          aria-hidden="true"
          className={cn("absolute inset-x-0 top-0 flex flex-col gap-0.5 px-0.5", !drag && "[transition:transform_.5s_var(--ns-ease-settle),scale_.5s_var(--ns-ease-settle),translate_.5s_var(--ns-ease-settle),rotate_.5s_var(--ns-ease-settle)] motion-reduce:transition-none")}
          style={{ transform: `translateY(${ty}px)` }}
        >
          {Array.from({ length: count }, (_, i) => {
            const d = Math.abs(i - index)
            return (
              <span
                key={i}
                data-v={format(i)}
                className={cn("relative grid h-[34px] shrink-0 place-items-center font-mono text-[length:var(--ns-type-label)] tabular-nums [transition:color_.2s,opacity_var(--ns-time-state)] before:content-[attr(data-v)]", d === 0 ? "font-semibold text-[var(--background)]" : "font-normal text-[var(--foreground)]")}
                style={{ opacity: d === 0 ? 1 : Math.max(0.2, 0.75 - d * 0.16) }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface TimePickerProps extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  /** "HH:MM", 24-hour. */
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  label?: React.ReactNode | undefined
  /** Quick picks; "End of day" sets this time. Default "17:00". */
  endOfDay?: string | undefined
  sound?: boolean | undefined
}

const two = (n: number) => String(n).padStart(2, "0")
const parse = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5))
const format = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440
  return `${two(Math.floor(m / 60))}:${two(m % 60)}`
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(function TimePicker(
  { value, defaultValue = "09:30", onValueChange, label = "Time", endOfDay = "17:00", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [inner, setInner] = React.useState(defaultValue)
  const time = value ?? inner
  const total = parse(time)
  const h24 = Math.floor(total / 60)
  const minute = total % 60
  const pm = h24 >= 12
  const h12 = h24 % 12 || 12
  // Local minus UTC in minutes, read in the browser (0 while server rendering).
  const offset = React.useSyncExternalStore(
    () => () => {},
    () => -new Date().getTimezoneOffset(),
    () => 0
  )
  const gmt = `GMT${offset >= 0 ? "+" : "−"}${Math.floor(Math.abs(offset) / 60)}${Math.abs(offset) % 60 ? `:${two(Math.abs(offset) % 60)}` : ""}`

  const set = (mins: number) => {
    const next = format(mins)
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }
  const setParts = (h: number, m: number, isPm: boolean) => set(((h % 12) + (isPm ? 12 : 0)) * 60 + m)

  return (
    <div ref={ref} data-slot="time-picker" data-notchset="" className={cn("flex w-full max-w-[320px] flex-col gap-3 text-[var(--foreground)]", className)} {...props}>
      <div className="flex items-center justify-between gap-2.5 rounded-[min(var(--radius),18px)] border border-[var(--border)] bg-[var(--background)] px-4 py-3.5">
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {label}
          </span>
          <NumberFlow value={`${two(h12)}:${two(minute)}`} className="font-mono text-[34px] leading-[1.1] font-medium tracking-[-0.03em]" />
          <span className="font-mono text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
            Local · {gmt} · {format(total - offset)} UTC
          </span>
        </span>
        <div role="radiogroup" aria-label="AM or PM" className="relative flex flex-col rounded-[min(var(--radius),12px)] border border-[var(--border)] bg-[var(--muted)] p-[3px]">
          <span aria-hidden="true" className="absolute inset-x-[3px] top-[3px] h-[30px] rounded-[min(var(--radius),9px)] bg-[var(--background)] shadow-[0_1px_2px_rgba(0,0,0,.08),0_0_0_1px_var(--border)] [transition:transform_.4s_cubic-bezier(.2,1.25,.3,1),scale_.4s_cubic-bezier(.2,1.25,.3,1),translate_.4s_cubic-bezier(.2,1.25,.3,1),rotate_.4s_cubic-bezier(.2,1.25,.3,1)]" style={{ transform: `translateY(${pm ? 30 : 0}px)` }} />
          {(["AM", "PM"] as const).map((v, i) => {
            const on = (i === 1) === pm
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  if (on) return
                  sfx.tone(i ? 880 : 660, 0.04, "triangle", 0.04)
                  setParts(h12, minute, i === 1)
                }}
                className={cn(
                  "relative h-[30px] w-11 cursor-pointer rounded-[min(var(--radius),9px)] font-mono text-[length:var(--ns-type-note)] font-semibold outline-none [transition:color_var(--ns-time-color)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]",
                  on ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
                )}
              >
                {v}
              </button>
            )
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-[min(var(--radius),18px)] border border-[var(--border)] bg-[var(--background)] p-2">
        <Wheel label="Hour" count={12} index={h12 - 1} onIndex={(i) => setParts(i + 1, minute, pm)} format={(i) => two(i + 1)} kind="h" sound={sound} />
        <Wheel label="Minute" count={60} index={minute} onIndex={(i) => setParts(h12, i, pm)} format={two} kind="m" sound={sound} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: "Now", to: () => new Date().getHours() * 60 + new Date().getMinutes() },
          { label: "+30m", to: () => total + 30 },
          { label: "+1h", to: () => total + 60 },
          { label: "End of day", to: () => parse(endOfDay) },
        ].map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => {
              sfx.tick()
              set(q.to())
            }}
            className="inline-flex h-7 cursor-pointer items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-2.5 text-[11.5px] font-medium outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)]"
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  )
})

export { TimePicker, type TimePickerProps }
