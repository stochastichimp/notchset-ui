"use client"

/**
 * Metric Sparkline (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/metric-sparkline
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"
import { isRtl } from "@/lib/notchset/shared"

/*
 * Metric Sparkline: a number, its change and a small area chart. Switching range morphs the same thirty
 * points into the new shape; dragging (or the arrow keys) scrubs along the line, ticking at each point,
 * and the number and change follow the point you're on.
 */

interface SparkRange {
  id: string
  label: string
  /** The values for this range, oldest first (resampled to 30 points). */
  values: readonly number[]
  /** Days per point, for the "Nd ago" line. */
  daysPerPoint?: number | undefined
}

interface MetricSparklineProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  label: string
  ranges: readonly SparkRange[]
  defaultRange?: string | undefined
  format?: ((n: number) => string) | undefined
  sound?: boolean | undefined
}

const POINTS = 30
const W = 300
const H = 96

/** The series resampled to POINTS evenly spaced values. */
function resample(values: readonly number[]) {
  const src = values.filter((v) => Number.isFinite(v))
  if (src.length === 0) return Array.from({ length: POINTS }, () => 0)
  if (src.length === 1) return Array.from({ length: POINTS }, () => src[0]!)
  return Array.from({ length: POINTS }, (_, i) => {
    const t = (i / (POINTS - 1)) * (src.length - 1)
    const a = Math.floor(t)
    const b = Math.min(src.length - 1, a + 1)
    return src[a]! + (src[b]! - src[a]!) * (t - a)
  })
}

const MetricSparkline = React.forwardRef<HTMLDivElement, MetricSparklineProps>(function MetricSparkline(
  { label, ranges, defaultRange, format = (n) => Math.round(n).toLocaleString(), sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [rangeId, setRangeId] = React.useState(defaultRange ?? ranges[0]?.id ?? "")
  const [scrub, setScrub] = React.useState<number | null>(null)
  const range = ranges.find((r) => r.id === rangeId) ?? ranges[0]
  const series = resample(range?.values ?? [])
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  const x = (i: number) => (i / (POINTS - 1)) * W
  const y = (v: number) => H - 6 - ((v - min) / span) * (H - 16)
  const line = series.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
  const area = `${line} L${W} ${H} L0 ${H} Z`
  const point = scrub ?? POINTS - 1
  const first = series[0] ?? 0
  const delta = first ? ((series[point]! - first) / Math.abs(first)) * 100 : 0
  const thumbIndex = Math.max(0, ranges.findIndex((r) => r.id === rangeId))
  const days = Math.round((POINTS - 1 - point) * (range?.daysPerPoint ?? 1))

  const scrubTo = (i: number) => {
    const next = Math.max(0, Math.min(POINTS - 1, i))
    if (next !== scrub) sfx.scrub(next)
    setScrub(next)
  }
  const fromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const k = (event.clientX - box.left) / box.width
    scrubTo(Math.round((isRtl(event.currentTarget as Element) ? 1 - k : k) * (POINTS - 1)))
  }

  return (
    <div ref={ref} data-slot="metric-sparkline" data-notchset="" className={cn("flex w-full flex-col gap-3", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)]">{label}</span>
          <span className="flex items-center gap-2">
            <span className="font-mono text-[30px] leading-9 font-medium tracking-[-0.03em] text-[var(--foreground)] tabular-nums"><NumberFlow value={format(series[point] ?? 0)} /></span>
            <span
              className={cn(
                "rounded-[var(--radius)] px-2 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap",
                delta >= 0
                  ? "bg-[color-mix(in_oklab,var(--success,var(--foreground))_14%,transparent)] text-[color-mix(in_oklab,var(--success,var(--foreground))_72%,var(--foreground))]"
                  : "bg-[color-mix(in_oklab,var(--destructive)_14%,transparent)] text-[color-mix(in_oklab,var(--destructive)_72%,var(--foreground))]"
              )}
            >
              {delta >= 0 ? "+" : "−"}
              {Math.abs(delta).toFixed(1)}%
            </span>
          </span>
        </div>
        <div role="radiogroup" aria-label="Range" className="relative flex rounded-[var(--radius)] bg-[var(--muted)] p-0.5">
          <span aria-hidden="true" className="absolute inset-y-0.5 w-10 rounded-[max(calc(var(--radius)-2px),4px)] bg-[var(--background)] shadow-[0_1px_2px_rgba(0,0,0,.08)] [transition:inset-inline-start_.45s_cubic-bezier(.2,1.25,.3,1)]" style={{ insetInlineStart: 2 + thumbIndex * 40 }} />
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={r.id === rangeId}
              onClick={() => {
                if (r.id === rangeId) return
                sfx.tick()
                setScrub(null)
                setRangeId(r.id)
              }}
              className={cn(
                "relative h-7 w-10 cursor-pointer rounded-[max(calc(var(--radius)-2px),4px)] font-mono text-[11px] outline-none [transition:color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]",
                r.id === rangeId ? "text-[var(--foreground)]" : "text-[color-mix(in_oklab,var(--muted-foreground)_80%,var(--foreground))]"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={`${label}, ${range?.label ?? ""}`}
        aria-valuemin={0}
        aria-valuemax={POINTS - 1}
        aria-valuenow={point}
        aria-valuetext={`${format(series[point] ?? 0)}${days ? `, ${days} days ago` : ", today"}`}
        onPointerDown={fromPointer}
        onPointerMove={fromPointer}
        onPointerLeave={() => setScrub(null)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
          event.preventDefault()
          const forward = (event.key === "ArrowRight") !== (isRtl(event.currentTarget as Element))
          scrubTo(point + (forward ? 1 : -1))
        }}
        onBlur={() => setScrub(null)}
        className="relative h-24 cursor-crosshair touch-none rounded-[min(var(--radius),8px)] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible rtl:-scale-x-100">
          <path d={area} className="fill-[color-mix(in_oklab,var(--info,var(--foreground))_12%,transparent)] [transition:d_.7s_var(--ns-ease-settle)]" />
          <path d={line} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="stroke-[var(--info,var(--foreground))] [transition:d_.7s_var(--ns-ease-settle)]" />
        </svg>
        {scrub != null && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px bg-[var(--border)] rtl:translate-x-px" style={{ insetInlineStart: `${(scrub / (POINTS - 1)) * 100}%` }}>
            <span className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--background)] shadow-[0_0_0_2.5px_var(--info,var(--foreground))] rtl:translate-x-1/2" style={{ top: `${(y(series[scrub]!) / H) * 100}%` }} />
          </span>
        )}
      </div>
      <div className="flex justify-between font-mono text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
        <span>{scrub == null ? "drag to scrub" : days ? `${days}d ago` : "today"}</span>
        <span>{range?.label}</span>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {series.map((v, i) => (
            <tr key={i}>
              <td>{Math.round((POINTS - 1 - i) * (range?.daysPerPoint ?? 1))} days ago</td>
              <td>{format(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

export { MetricSparkline, type MetricSparklineProps, type SparkRange }
