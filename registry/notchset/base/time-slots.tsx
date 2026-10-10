"use client"

/**
 * Time Slots (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/time-slots
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, RollingLabel, wait } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Time Slots: pick a meeting slot. A duration switch (30m or 60m) and a time-zone switch (Local or UTC)
 * relabel the grid; taken times are struck through; a 60-minute booking takes two slots, and the grid
 * shakes when the next one is taken. Book rolls to its confirmation once your booking resolves.
 */

interface TimeSlotsProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  /** Slot start times in local time, "HH:MM", 30 minutes apart. */
  slots: readonly string[]
  /** Starts that are already booked. */
  taken?: readonly string[] | undefined
  title?: React.ReactNode | undefined
  subtitle?: React.ReactNode | undefined
  /** The slot chosen at first. */
  defaultSlot?: string | undefined
  /** Books the chosen time ("HH:MM", local). Reject to shake and keep the choice. */
  onBook?: ((booking: { start: string; end: string; minutes: number }) => Promise<unknown> | void) | undefined
  /** Called as the booked state shows. */
  onSuccess?: (() => void) | undefined
  bookedLabel?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
const hhmm = (m: number) => `${String(Math.floor((((m % 1440) + 1440) % 1440) / 60)).padStart(2, "0")}:${String((((m % 1440) + 1440) % 1440) % 60).padStart(2, "0")}`

const TimeSlots = React.forwardRef<HTMLDivElement, TimeSlotsProps>(function TimeSlots(
  { slots, taken = [], title, subtitle, defaultSlot, onBook, onSuccess, bookedLabel = "Booked · invite sent", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [utc, setUtc] = React.useState(false)
  const [long, setLong] = React.useState(false)
  const [slot, setSlot] = React.useState(() => (defaultSlot ? slots.indexOf(defaultSlot) : -1))
  const [shakes, setShakes] = React.useState(0)
  const [state, setState] = React.useState<"idle" | "booking" | "booked">("idle")
  // Local minus UTC, in minutes, read in the browser (0 while server rendering).
  const offset = React.useSyncExternalStore(
    () => () => {},
    () => -new Date().getTimezoneOffset(),
    () => 0
  )
  const need = long ? 2 : 1
  const show = (t: string) => hhmm(minutes(t) - (utc ? offset : 0))
  const end = slot >= 0 ? (slots[slot + need] ?? hhmm(minutes(slots[slot]!) + need * 30)) : null

  const fits = (i: number, n: number) => Array.from({ length: n }, (_, k) => i + k).every((j) => j < slots.length && !taken.includes(slots[j]!))
  const pick = (i: number) => {
    if (!fits(i, need)) {
      sfx.buzz()
      setShakes((n) => n + 1)
      return
    }
    sfx.tone(900 + i * 25, 0.03, "triangle", 0.04)
    setSlot(i)
    setState("idle")
  }
  const book = async () => {
    if (slot < 0 || state !== "idle") return
    sfx.press()
    setState("booking")
    try {
      await Promise.all([onBook?.({ start: slots[slot]!, end: end!, minutes: need * 30 }), wait(500)])
    } catch {
      sfx.buzz()
      setShakes((n) => n + 1)
      setState("idle")
      return
    }
    sfx.chime()
    onSuccess?.()
    setState("booked")
  }

  const seg = (options: readonly string[], on: number, width: number, set: (i: number) => void, label: string) => (
    <div role="radiogroup" aria-label={label} className="relative inline-flex rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] p-[3px]">
      <span aria-hidden="true" className="absolute inset-y-[3px] rounded-[var(--radius)] bg-[var(--background)] shadow-[0_1px_2px_rgba(0,0,0,.08),0_0_0_1px_var(--border)] [transition:inset-inline-start_.45s_cubic-bezier(.2,1.25,.3,1)]" style={{ width, insetInlineStart: 3 + on * width }} />
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={on === i}
          onClick={() => {
            if (on === i) return
            sfx.tick()
            set(i)
          }}
          className={cn(
            "relative h-[26px] cursor-pointer rounded-[var(--radius)] text-[length:var(--ns-type-note)] font-medium outline-none [transition:color_var(--ns-time-color)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]",
            on === i ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
          )}
          style={{ width }}
        >
          {o}
        </button>
      ))}
    </div>
  )

  return (
    <div ref={ref} data-slot="time-slots" data-notchset="" className={cn("flex w-full max-w-[340px] flex-col gap-3.5 text-[var(--foreground)]", className)} {...props}>
      <div className="flex items-start justify-between gap-2.5">
        <span className="flex flex-col gap-0.5">
          {title && <span className="text-[15px] font-semibold">{title}</span>}
          {subtitle && <span className="text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{subtitle}</span>}
        </span>
        {seg(["Local", "UTC"], utc ? 1 : 0, 56, (i) => setUtc(i === 1), "Time zone")}
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] tracking-[.07em] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] uppercase">Duration</span>
        {seg(["30m", "60m"], long ? 1 : 0, 48, (i) => {
          const next = i === 1
          setLong(next)
          setState("idle")
          if (next && slot >= 0 && !fits(slot, 2)) setSlot(-1)
        }, "Duration")}
      </div>
      <div role="radiogroup" aria-label="Start time" className={cn("grid grid-cols-4 gap-1.5", shakes > 0 && (shakes % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]"))}>
        {slots.map((t, i) => {
          const isTaken = taken.includes(t)
          const on = slot >= 0 && i >= slot && i < slot + need
          const head = i === slot
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={head}
              disabled={isTaken}
              aria-label={`${show(t)}${isTaken ? ", taken" : ""}`}
              onClick={() => pick(i)}
              className={cn(
                "h-9 cursor-pointer rounded-[min(var(--radius),10px)] border font-mono text-[length:var(--ns-type-note)] tabular-nums outline-none [transition:background-color_.2s,color_.2s,border-color_.2s,transform_.15s,scale_.15s,translate_.15s,rotate_.15s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-1 active:scale-[.95] disabled:cursor-not-allowed",
                head && "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]",
                on && !head && "border-transparent bg-[color-mix(in_oklab,var(--primary)_70%,var(--background))] text-[var(--primary-foreground)]",
                !on && isTaken && "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] line-through",
                !on && !isTaken && "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)]"
              )}
            >
              {show(t)}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        aria-disabled={slot < 0 || state !== "idle"}
        onClick={book}
        className={cn(
          "inline-flex h-[var(--ns-control-regular)] cursor-pointer items-center justify-center rounded-[var(--radius)] px-3.5 text-[length:var(--ns-type-label)] font-medium outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s,opacity_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.97] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          state === "booked" ? "bg-[var(--success,var(--primary))] text-[var(--success-foreground,var(--primary-foreground))]" : "bg-[var(--primary)] text-[var(--primary-foreground)]",
          slot < 0 && "opacity-40"
        )}
      >
        <RollingLabel
          index={state === "booked" ? 1 : 0}
          rows={[
            slot >= 0 ? `Book ${show(slots[slot]!)}–${show(end!)}` : "Pick a time",
            <React.Fragment key="done">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {bookedLabel}
            </React.Fragment>,
          ]}
        />
      </button>
      <Announcer message={state === "booked" ? "Booked" : ""} />
    </div>
  )
})

export { TimeSlots, type TimeSlotsProps }
