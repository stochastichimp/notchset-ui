"use client"

/**
 * Goal Bars (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/goal-bars
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { ChartHeader, ChartRoot, ChartTooltip, field, fmtNum, Gridlines, LiveLine, niceMax, num, Segmented, SrTable, TooltipLabel, type ChartRow } from "@/lib/notchset/chart"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"
import { isRtl } from "@/lib/notchset/shared"

/*
 * Goal Bars: bars against a goal. Bars that meet it turn --chart-1, the dashed average slides to its new
 * level with an "avg" chip on the axis, and switching views (week, month, year) grows and collapses the
 * same bar slots in place, so bars never pop in or out.
 */

interface GoalBarsView {
  label: string
  /** Rows oldest first. */
  data: readonly ChartRow[]
  /** What one bar is, for the count line ("days", "months"). */
  unit: string
  subtitle?: React.ReactNode | undefined
  /** Formats this view's x values: short for the axis, long for the tooltip. */
  formatX?: ((x: unknown, long: boolean) => string) | undefined
}

interface GoalBarsProps extends Omit<React.ComponentPropsWithoutRef<"figure">, "title"> {
  title: React.ReactNode
  views: readonly GoalBarsView[]
  defaultView?: number | undefined
  /** The goal each bar is measured against. */
  goal: number
  valueKey?: string | undefined
  xKey?: string | undefined
  /** The unit after the headline, e.g. "min / day". */
  unitLabel?: React.ReactNode | undefined
  formatValue?: ((n: number) => string) | undefined
  sound?: boolean | undefined
}

const H = 180

const GoalBars = React.forwardRef<HTMLElement, GoalBarsProps>(function GoalBars(
  { title, views, defaultView = 0, goal, valueKey = "value", xKey = "date", unitLabel, formatValue = fmtNum, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [view, setView] = React.useState(defaultView)
  const [hover, setHover] = React.useState(-1)
  const slots = Math.max(1, ...views.map((v) => v.data.length))
  const current = views[view] ?? views[0]
  const rows = current?.data ?? []
  const formatX = current?.formatX ?? ((x: unknown) => String(x ?? ""))
  const n = rows.length
  const first = slots - n
  // The axis tops out at 1.5 × the goal (thirds fall on the goal), higher only if the data needs it.
  const yMax = React.useMemo(() => {
    const top = Math.max(0, ...views.flatMap((v) => v.data.map((r) => num(r, valueKey))))
    return top <= goal * 1.5 ? goal * 1.5 : niceMax(top)
  }, [views, goal, valueKey])
  const values = rows.map((r) => num(r, valueKey))
  const avg = n ? Math.round(values.reduce((a, b) => a + b, 0) / n) : 0
  const met = values.filter((v) => v >= goal).length
  const many = n > 14
  const pad = many ? 1.5 : n > 7 ? 4 : 6
  const hv = hover >= first ? values[hover - first]! : 0
  const ticks = [yMax, (yMax * 2) / 3, yMax / 3, 0]
  const pickLabel = (i: number) => {
    // Month view labels every 5th day; the others label every bar.
    if (!many) return true
    return (i - first) % 5 === 0 || i === slots - 1
  }

  const enter = (i: number) => {
    if (i < first || i === hover) return
    sfx.scrub(i - first)
    setHover(i)
  }

  return (
    <ChartRoot ref={ref} data-slot="goal-bars" summary={`${typeof title === "string" ? title : "Bars"}: average ${formatValue(avg)}, ${met} of ${n} ${current?.unit ?? ""} at the goal of ${formatValue(goal)}.`} className={cn("max-w-[480px]", className)} {...props}>
      <ChartHeader title={title} subtitle={current?.subtitle}>
        <Segmented
          label="View"
          options={views.map((v) => v.label)}
          value={view}
          width={64}
          onValueChange={(i) => {
            setHover(-1)
            setView(i)
          }}
          sound={sound}
        />
      </ChartHeader>
      <div className="flex items-end gap-3.5">
        <span className="text-[32px] leading-[1.1] font-medium tracking-[-0.04em]">
          <NumberFlow value={formatValue(avg)} />
          {unitLabel && <span className="ms-1 text-[length:var(--ns-type-copy)] font-normal tracking-normal text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{unitLabel}</span>}
        </span>
        <span className="mb-1.5 flex items-center gap-1.5 text-[12.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
          <span aria-hidden="true" className="size-2 rounded-[2px] bg-[var(--c1)]" />
          <NumberFlow value={`${met} of ${n} ${current?.unit ?? ""} at ${formatValue(goal)}`} />
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2">
        <div
          role="group"
          tabIndex={0}
          aria-label="Bars. Use the left and right arrow keys to read each bar."
          onPointerLeave={() => setHover(-1)}
          onBlur={() => setHover(-1)}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
            event.preventDefault()
            const fwd = (event.key === "ArrowRight") !== (isRtl(event.currentTarget as Element))
            enter(Math.max(first, Math.min(slots - 1, (hover < first ? slots : hover) + (fwd ? 1 : -1))))
          }}
          className="relative rounded-[4px] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-4"
          style={{ height: H }}
        >
          <Gridlines lines={4} />
          <div className="absolute inset-0 flex items-end">
            {Array.from({ length: slots }, (_, i) => {
              const shown = i >= first
              const v = shown ? values[i - first]! : 0
              return (
                <div
                  key={i}
                  onPointerEnter={() => enter(i)}
                  className="relative flex h-full min-w-0 basis-0 items-end [transition:flex-grow_.6s_var(--ns-ease-settle),padding_.6s_var(--ns-ease-settle)] motion-reduce:transition-none"
                  style={{ flexGrow: shown ? 1 : 0, paddingInline: shown ? pad : 0 }}
                >
                  <span
                    className={cn(
                      "block w-full rounded-b-[2px] [transition:height_.7s_cubic-bezier(.2,1.25,.3,1),background-color_.35s,opacity_.2s] motion-reduce:transition-none",
                      many ? "rounded-t-[3px]" : "rounded-t-[7px]",
                      v >= goal ? "bg-[var(--c1)]" : "bg-[color-mix(in_oklab,var(--foreground)_20%,transparent)]",
                      hover >= 0 && hover !== i ? "opacity-40" : "opacity-100"
                    )}
                    style={{ height: `${(v / yMax) * 100}%`, transitionDelay: `${Math.max(0, i - first) * (many ? 14 : 40)}ms, 0ms, 0ms` }}
                  />
                </div>
              )
            })}
          </div>
          <div aria-hidden="true" className="absolute inset-x-0 border-t-[1.5px] border-dashed border-[var(--foreground)] [transition:top_.7s_cubic-bezier(.2,1.2,.3,1)]" style={{ top: `${(1 - avg / yMax) * 100}%` }} />
          <ChartTooltip x={`${hover >= first ? ((hover - first + 0.5) / n) * 100 : 50}%`} y={`${(1 - hv / yMax) * H}px`} shown={hover >= first}>
            <TooltipLabel>{hover >= first ? formatX(field(rows[hover - first], xKey), true) : ""}</TooltipLabel>
            <NumberFlow value={formatValue(hv)} />
          </ChartTooltip>
        </div>
        <div aria-hidden="true" className="relative text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]" style={{ height: H }}>
          {ticks.map((t, i) => (
            <span key={i} className="absolute -translate-y-1/2" style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}>
              {formatValue(t)}
            </span>
          ))}
          <span className="absolute -translate-y-1/2 rounded-[5px] bg-[var(--foreground)] px-[5px] py-px whitespace-nowrap text-[var(--background)] [transition:top_.7s_cubic-bezier(.2,1.2,.3,1)]" style={{ top: `${(1 - avg / yMax) * 100}%` }}>
            avg
          </span>
        </div>
      </div>
      <div aria-hidden="true" className="-mt-1.5 flex pe-[52px]">
        {Array.from({ length: slots }, (_, i) => {
          const shown = i >= first
          return (
            <span
              key={i}
              className={cn(
                "min-w-0 basis-0 overflow-visible text-center text-[11px] whitespace-nowrap [transition:flex-grow_.6s_var(--ns-ease-settle),padding_.6s_var(--ns-ease-settle),opacity_var(--ns-time-state),color_.2s] motion-reduce:transition-none",
                hover === i ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]",
                shown && pickLabel(i) ? "opacity-100" : "opacity-0"
              )}
              style={{ flexGrow: shown ? 1 : 0, paddingInline: shown ? pad : 0 }}
            >
              {shown ? formatX(field(rows[i - first], xKey), false) : ""}
            </span>
          )
        })}
      </div>
      <LiveLine className="sr-only">{hover >= first ? `${formatX(field(rows[hover - first], xKey), true)}: ${formatValue(hv)}${hv >= goal ? ", goal met" : ""}` : ""}</LiveLine>
      <SrTable caption={typeof title === "string" ? title : "Bars"} columns={["Period", "Value"]} rows={rows.map((r) => [formatX(field(r, xKey), true), num(r, valueKey)])} />
    </ChartRoot>
  )
})

export { GoalBars, type GoalBarsProps, type GoalBarsView }
