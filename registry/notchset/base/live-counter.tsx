"use client"

/**
 * Live Counter (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/live-counter
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { ChartRoot, fmtNum, useInView } from "@/lib/notchset/chart"
import { useComposedRefs } from "@/lib/notchset/shared"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Live Counter: a large running total fed by your events. Bursts float up as green chips, a strip of 24
 * one-second buckets shows the rate (the current second in --chart-1), and Live pauses the feed. The
 * counter keeps its own state, so a busy feed never re-renders the page, and its clock pauses off screen.
 */

/** Sends `n` new events; `burst` floats a "+n" chip. */
type LiveEmit = (n: number, options?: { burst?: boolean | undefined }) => void

interface LiveCounterProps extends Omit<React.ComponentPropsWithoutRef<"figure">, "title"> {
  label: React.ReactNode
  /** The total to start from. */
  initial?: number | undefined
  /** Connects your feed: call emit as events arrive; return an unsubscribe. Runs while Live is on. */
  subscribe: (emit: LiveEmit) => () => void
  live?: boolean | undefined
  defaultLive?: boolean | undefined
  onLiveChange?: ((live: boolean) => void) | undefined
  formatValue?: ((n: number) => string) | undefined
  /** The rate line's unit. */
  rateLabel?: string | undefined
  /** Extra controls on the bottom row. */
  actions?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const BUCKETS = 24

const LiveCounter = React.forwardRef<HTMLElement, LiveCounterProps>(function LiveCounter(
  { label, initial = 0, subscribe, live, defaultLive = true, onLiveChange, formatValue = fmtNum, rateLabel = "/ min", actions, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [innerLive, setInnerLive] = React.useState(defaultLive)
  const on = live ?? innerLive
  const [total, setTotal] = React.useState(initial)
  const [buckets, setBuckets] = React.useState(() => Array.from({ length: BUCKETS }, () => 0))
  const [chip, setChip] = React.useState({ n: 0, key: 0 })
  const rootRef = React.useRef<HTMLElement>(null)
  const inView = useInView(rootRef)
  const refs = useComposedRefs(ref, rootRef)
  const sfxRef = React.useRef(sfx)
  React.useEffect(() => {
    sfxRef.current = sfx
  })

  React.useEffect(() => {
    if (!on) return
    return subscribe((n, options) => {
      if (!(n > 0)) return
      setTotal((t) => t + n)
      setBuckets((b) => [...b.slice(0, -1), b[BUCKETS - 1]! + n])
      if (options?.burst) {
        sfxRef.current.burst(n)
        setChip((c) => ({ n, key: c.key + 1 }))
      } else sfxRef.current.tone(1800 + Math.random() * 400, 0.01, "triangle", 0.008)
    })
  }, [on, subscribe])

  // One bucket per second, only while the counter is on screen.
  React.useEffect(() => {
    if (!inView) return
    const id = setInterval(() => setBuckets((b) => [...b.slice(1), 0]), 1000)
    return () => clearInterval(id)
  }, [inView])

  const max = Math.max(10, ...buckets)
  const perMin = buckets.reduce((a, b) => a + b, 0) * 2.5

  return (
    <ChartRoot
      ref={refs}
      data-slot="live-counter"
      summary={`${typeof label === "string" ? label : "Total"}: ${formatValue(total)}, about ${formatValue(perMin)} ${rateLabel}.`}
      className={cn("max-w-[480px]", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <figcaption className="text-[length:var(--ns-type-label)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{label}</figcaption>
        <button
          type="button"
          aria-pressed={on}
          onClick={() => {
            sfx.tick()
            if (live === undefined) setInnerLive(!on)
            onLiveChange?.(!on)
          }}
          className="inline-flex h-7 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-2.5 text-[length:var(--ns-type-note)] font-medium outline-none [transition:scale_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95"
        >
          <span aria-hidden="true" className="relative size-[7px]">
            <span className={cn("absolute inset-0 rounded-full", on ? "bg-[var(--success,var(--foreground))]" : "bg-[var(--muted-foreground)]")} />
            {on && <span className="absolute inset-0 animate-[ns-live_1.4s_ease-out_infinite] rounded-full bg-[var(--success,var(--foreground))] motion-reduce:hidden" />}
          </span>
          {on ? "Live" : "Paused"}
        </button>
      </div>
      <div className="relative flex items-end gap-3">
        <NumberFlow value={formatValue(total)} className="text-[56px] leading-none font-medium tracking-[-0.05em]" />
        <span aria-hidden="true" className="relative h-14 flex-1">
          {chip.key > 0 && (
            <span
              key={chip.key}
              className={cn(
                "absolute start-0 bottom-1.5 rounded-full bg-[color-mix(in_oklab,var(--success,var(--foreground))_16%,transparent)] px-2 py-0.5 text-[length:var(--ns-type-note)] whitespace-nowrap text-[color-mix(in_oklab,var(--success,var(--foreground))_72%,var(--foreground))] [--r:0deg] motion-reduce:hidden",
                chip.key % 2 ? "animate-[ns-float_1.4s_cubic-bezier(.2,.8,.2,1)_both]" : "animate-[ns-float-b_1.4s_cubic-bezier(.2,.8,.2,1)_both]"
              )}
            >
              +{formatValue(chip.n)}
            </span>
          )}
        </span>
      </div>
      <div aria-hidden="true" className="flex h-9 items-end gap-[3px]">
        {buckets.map((v, i) => (
          <span
            key={i}
            className={cn("min-h-0.5 flex-1 rounded-[2px] [transition:height_.5s_cubic-bezier(.2,1.4,.3,1),background-color_.3s]", i === BUCKETS - 1 ? "bg-[var(--c1)]" : "bg-[color-mix(in_oklab,var(--foreground)_18%,transparent)]")}
            style={{ height: `${(v / max) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
          ≈ <NumberFlow value={formatValue(perMin)} /> {rateLabel}
        </span>
        {actions && <span className="flex gap-1.5">{actions}</span>}
      </div>
    </ChartRoot>
  )
})

export { LiveCounter, type LiveCounterProps, type LiveEmit }
