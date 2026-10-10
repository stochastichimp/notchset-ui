"use client"

/**
 * Sparkline (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/sparkline
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { ChartRoot, field, fmtNum, Gridlines, num, resample, Segmented, smooth, SrTable, XAxis, YAxis, type ChartRow } from "@/lib/notchset/chart"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Sparkline: a number, its trend and a small area chart. The line draws itself in, then morphs between
 * ranges; everything (line, fill, end dot and the arrow) turns green when the range ends up and red when
 * it ends down, and the end dot pings.
 */

interface SparklineRange {
  label: string
  /** Rows oldest first. */
  data: readonly ChartRow[]
  /** The x labels under the chart; default five values of xKey. */
  xLabels?: readonly string[] | undefined
}

interface SparklineProps extends Omit<React.ComponentPropsWithoutRef<"figure">, "title"> {
  title: React.ReactNode
  ranges: readonly SparklineRange[]
  defaultRange?: number | undefined
  valueKey?: string | undefined
  xKey?: string | undefined
  formatValue?: ((n: number) => string) | undefined
  sound?: boolean | undefined
}

const N = 24
const W = 400
const H = 120

const Sparkline = React.forwardRef<HTMLElement, SparklineProps>(function Sparkline(
  { title, ranges, defaultRange = 0, valueKey = "value", xKey = "date", formatValue = fmtNum, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [range, setRange] = React.useState(defaultRange)
  const current = ranges[range] ?? ranges[0]

  const view = React.useMemo(() => {
    const raw = (current?.data ?? []).map((r) => num(r, valueKey))
    const values = resample(raw, N)
    const max = Math.max(...values) * 1.04
    const min = Math.min(...values) * 0.92
    const span = max - min || 1
    const pts = values.map((v, i): [number, number] => [(i / (N - 1)) * W, H - ((v - min) / span) * 112])
    const line = smooth(pts)
    const first = raw[0] ?? 0
    const last = raw[raw.length - 1] ?? 0
    return { raw, line, area: `${line} L${W},${H} L0,${H} Z`, endY: pts[N - 1]![1], max, min, last, up: last >= first, delta: first ? ((last - first) / Math.abs(first)) * 100 : 0, peak: Math.max(...raw, 0) }
  }, [current, valueKey])

  const xLabels = current?.xLabels ?? [0, 1, 2, 3, 4].map((k) => String(field(current?.data[Math.round((k / 4) * Math.max(0, (current?.data.length ?? 1) - 1))], xKey) ?? ""))

  return (
    <ChartRoot ref={ref} data-slot="sparkline" summary={`${typeof title === "string" ? title : "Value"}: ${formatValue(view.last)}, ${view.up ? "up" : "down"} ${Math.abs(view.delta).toFixed(1)}% over ${current?.label ?? "the range"}.`} className={cn("max-w-[480px]", className)} {...props}>
      <div className="flex items-end justify-between gap-2.5">
        <figcaption className="flex flex-col gap-1">
          <span className="text-[length:var(--ns-type-label)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{title}</span>
          <NumberFlow value={formatValue(view.last)} className="text-[32px] leading-[1.1] font-medium tracking-[-0.04em]" />
        </figcaption>
        <span
          className={cn(
            "mb-1.5 inline-flex items-center gap-1 text-[12.5px] [transition:color_.3s]",
            view.up ? "text-[color-mix(in_oklab,var(--success,var(--foreground))_75%,var(--foreground))]" : "text-[color-mix(in_oklab,var(--destructive)_75%,var(--foreground))]"
          )}
        >
          <span aria-hidden="true" className={cn("grid [transition:rotate_.5s_cubic-bezier(.2,1.4,.4,1)] rtl:-scale-x-100", view.up ? "rotate-0" : "rotate-90")}>
            <svg viewBox="0 0 24 24" className="size-[13px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </span>
          <NumberFlow value={`${view.up ? "+" : "−"}${Math.abs(view.delta).toFixed(1)}%`} />
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2.5">
          <div className="relative h-[120px]" aria-hidden="true">
            <Gridlines />
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible rtl:-scale-x-100">
              <path
                className={cn("[transition:d_.8s_var(--ns-ease-settle),fill_.4s] motion-reduce:transition-none", view.up ? "fill-[color-mix(in_oklab,var(--success,var(--foreground))_13%,transparent)]" : "fill-[color-mix(in_oklab,var(--destructive)_13%,transparent)]")}
                style={{ d: `path('${view.area}')` }}
              />
              <path
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className={cn("animate-[ns-draw-x_1.4s_cubic-bezier(.6,0,.2,1)_both] [transition:d_.8s_var(--ns-ease-settle),stroke_.4s] motion-reduce:animate-none motion-reduce:transition-none", view.up ? "stroke-[var(--success,var(--foreground))]" : "stroke-[var(--destructive)]")}
                style={{ d: `path('${view.line}')` }}
              />
            </svg>
            <span className={cn("absolute end-0 -me-[4.5px] -mt-[4.5px] size-[9px] rounded-full [transition:top_.8s_var(--ns-ease-settle),background-color_.4s]", view.up ? "bg-[var(--success,var(--foreground))]" : "bg-[var(--destructive)]")} style={{ top: `${(view.endY / H) * 100}%` }} />
            <span className={cn("absolute end-0 -me-[4.5px] -mt-[4.5px] size-[9px] animate-[ns-live_1.6s_ease-out_infinite] rounded-full [transition:top_.8s_var(--ns-ease-settle)] motion-reduce:hidden", view.up ? "bg-[var(--success,var(--foreground))]" : "bg-[var(--destructive)]")} style={{ top: `${(view.endY / H) * 100}%` }} />
          </div>
          <YAxis labels={[formatValue(view.max), formatValue((view.max + view.min) / 2), formatValue(view.min)]} height={120} />
        </div>
        <XAxis labels={xLabels} className="pe-[54px]" />
      </div>
      <div className="flex items-center justify-between">
        <Segmented
          label="Range"
          options={ranges.map((r) => r.label)}
          value={range}
          width={52}
          sound={false}
          onValueChange={(i) => {
            const data = ranges[i]?.data ?? []
            const up = num(data[data.length - 1], valueKey) >= num(data[0], valueKey)
            if (sound) {
              sfx.morph()
              if (up) sfx.rise()
              else sfx.fall()
            }
            setRange(i)
          }}
        />
        <span className="text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
          peak <NumberFlow value={formatValue(view.peak)} />
        </span>
      </div>
      <SrTable caption={typeof title === "string" ? title : "Values"} columns={["Point", "Value"]} rows={(current?.data ?? []).map((r) => [String(field(r, xKey) ?? ""), num(r, valueKey)])} />
    </ChartRoot>
  )
})

export { Sparkline, type SparklineProps, type SparklineRange }
