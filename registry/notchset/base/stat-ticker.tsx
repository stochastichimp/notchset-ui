"use client"

/**
 * Stat Ticker (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/stat-ticker
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { RollingLabel } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Stat Ticker: one headline number with its delta and comparison. Switching the period rolls every
 * digit on its own column, the delta chip turns green or red with its arrow flipping, the comparison
 * line rolls, and a short marker rides the top edge to the tab, with a tone that rises or falls with
 * the number.
 */

interface StatPeriod {
  /** The tab: "7d". */
  label: string
  value: number
  /** Change against the previous period, in percent. */
  delta: number
  /** The comparison line: "vs previous 7 days". */
  comparison: string
}

interface StatTickerProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title" | "defaultValue" | "onChange"> {
  title: React.ReactNode
  periods: readonly StatPeriod[]
  value?: number | undefined
  defaultValue?: number | undefined
  onValueChange?: ((index: number) => void) | undefined
  format?: ((n: number) => string) | undefined
  formatDelta?: ((n: number) => string) | undefined
  sound?: boolean | undefined
}

const StatTicker = React.forwardRef<HTMLDivElement, StatTickerProps>(function StatTicker(
  {
    title,
    periods,
    value,
    defaultValue = 0,
    onValueChange,
    format = (n) => `$${Math.round(n).toLocaleString("en-US")}`,
    formatDelta = (n) => `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(1)}%`,
    sound = true,
    className,
    ...props
  },
  ref
) {
  const { sfx } = useSound(sound)
  const [inner, setInner] = React.useState(defaultValue)
  const at = Math.max(0, Math.min(periods.length - 1, value ?? inner))
  const p = periods[at]
  const up = (p?.delta ?? 0) >= 0
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([])

  const pick = (i: number) => {
    if (i === at || !periods[i]) return
    const rising = periods[i]!.value > (p?.value ?? 0)
    sfx.tone(rising ? 640 : 900, 0.08, "triangle", 0.04, 0, rising ? 980 : 600)
    if (value === undefined) setInner(i)
    onValueChange?.(i)
  }
  const tone = up ? "var(--success,var(--foreground))" : "var(--destructive)"

  return (
    <div ref={ref} data-slot="stat-ticker" data-notchset="" className={cn("flex w-full max-w-[380px] flex-col gap-[18px] rounded-[24px] border border-[var(--border)] bg-[var(--background)] px-[22px] pt-[22px] pb-1.5 text-[var(--foreground)]", className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[length:var(--ns-type-copy)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
          <span aria-hidden="true" className="size-2 rounded-[2px] bg-[var(--chart-1)]" />
          {title}
        </span>
        <span
          className="inline-flex h-6 items-center gap-[3px] rounded-full ps-1.5 pe-2 font-mono text-[length:var(--ns-type-note)] font-medium [transition:background-color_.35s,color_.35s]"
          style={{ background: `color-mix(in oklab, ${tone} 14%, transparent)`, color: `color-mix(in oklab, ${tone} 72%, var(--foreground))` }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-3 [transition:rotate_.5s_var(--ns-ease-pop)]", !up && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
          <NumberFlow value={formatDelta(p?.delta ?? 0)} />
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <span aria-live="polite" className="text-[52px] leading-none font-medium tracking-[-0.045em] tabular-nums">
          <NumberFlow value={format(p?.value ?? 0)} />
        </span>
        <RollingLabel index={at} size="sm" align="start" className="text-[length:var(--ns-type-label)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]" rows={periods.map((x) => <React.Fragment key={x.label}>{x.comparison}</React.Fragment>)} />
      </div>
      <div
        role="tablist"
        aria-label="Period"
        onKeyDown={(event) => {
          const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
          const d = event.key === "ArrowRight" ? (rtl ? -1 : 1) : event.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0
          if (!d) return
          event.preventDefault()
          const next = (at + d + periods.length) % periods.length
          pick(next)
          tabs.current[next]?.focus()
        }}
        className="relative -mx-[22px] grid border-t border-[var(--border)] px-2.5"
        style={{ gridTemplateColumns: `repeat(${periods.length},minmax(0,1fr))` }}
      >
        <span
          aria-hidden="true"
          className="absolute start-2.5 -top-px flex h-0.5 justify-center [--sx:1] [transition:translate_.5s_cubic-bezier(.2,1.25,.3,1)] motion-reduce:transition-none rtl:[--sx:-1]"
          style={{ width: `calc((100% - 20px) / ${periods.length})`, translate: `calc(${at * 100}% * var(--sx)) 0` }}
        >
          <span className="h-0.5 w-7 rounded-[1px] bg-[var(--foreground)]" />
        </span>
        {periods.map((x, i) => (
          <button
            key={x.label}
            ref={(el) => {
              tabs.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={i === at}
            tabIndex={i === at ? 0 : -1}
            onClick={() => pick(i)}
            className={cn("h-11 cursor-pointer font-mono text-[length:var(--ns-type-note)] outline-none [transition:color_var(--ns-time-color)] hover:text-[var(--foreground)] focus-visible:rounded-[6px] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-inset", i === at ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
          >
            {x.label}
          </button>
        ))}
      </div>
    </div>
  )
})

export { StatTicker, type StatPeriod, type StatTickerProps }
