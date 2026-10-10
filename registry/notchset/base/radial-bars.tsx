"use client"

/**
 * Radial Bars (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/radial-bars
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { ChartHeader, ChartRoot, field, num, Segmented, seriesColor, SrTable, type ChartConfig, type ChartRow } from "@/lib/notchset/chart"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Radial Bars: up to four goals as open rings that sweep 270° from the top, filling one after another.
 * Each ring's name sits just before its start; the centre shows the average, or the hovered goal. The
 * legend lists each target with its progress.
 */

interface RadialBarsView {
  label: string
  /** One row per goal (up to four): { name, value (0–100), target }. */
  data: readonly ChartRow[]
}

interface RadialBarsProps extends Omit<React.ComponentPropsWithoutRef<"figure">, "title"> {
  title: React.ReactNode
  subtitle?: React.ReactNode | undefined
  views: readonly RadialBarsView[]
  defaultView?: number | undefined
  nameKey?: string | undefined
  valueKey?: string | undefined
  /** A line under each goal's name, e.g. "$2.4M of $2.9M". */
  targetKey?: string | undefined
  config?: ChartConfig | undefined
  sound?: boolean | undefined
}

const RADII = [98, 79, 60, 41]

const RadialBars = React.forwardRef<HTMLElement, RadialBarsProps>(function RadialBars({ title, subtitle, views, defaultView = 0, nameKey = "name", valueKey = "value", targetKey = "target", config, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [vi, setVi] = React.useState(defaultView)
  const [hover, setHover] = React.useState(-1)
  const rows = (views[vi] ?? views[0]!).data.slice(0, 4)
  const names = rows.map((r) => String(field(r, nameKey) ?? ""))
  const values = rows.map((r) => Math.max(0, Math.min(100, num(r, valueKey))))
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
  const color = (i: number) => seriesColor(config, names[i]!, i)
  const enter = (i: number) => {
    if (i === hover) return
    sfx.tone(520 + i * 140, 0.04, "sine", 0.03)
    setHover(i)
  }

  return (
    <ChartRoot ref={ref} data-slot="radial-bars" summary={`${typeof title === "string" ? title : "Goals"}, ${views[vi]?.label ?? ""}: ${names.map((n, i) => `${n} ${values[i]}%`).join(", ")}.`} className={cn("max-w-[480px]", className)} {...props}>
      <ChartHeader title={title} subtitle={subtitle}>
        <Segmented
          label="Period"
          options={views.map((v) => v.label)}
          value={vi}
          width={52}
          sound={false}
          onValueChange={(i) => {
            rows.forEach((_, k) => sfx.tone(520 + k * 140, 0.08, "sine", 0.03, k * 0.09))
            setVi(i)
          }}
        />
      </ChartHeader>
      <div onPointerLeave={() => setHover(-1)} className="grid grid-cols-[220px_minmax(0,1fr)] items-center gap-6 max-sm:grid-cols-1 max-sm:justify-items-center">
        <div className="relative size-[220px]">
          <svg viewBox="0 0 220 220" aria-hidden="true" className="size-full -rotate-90 rtl:-scale-x-100">
            {values.map((v, i) => (
              <React.Fragment key={names[i]}>
                <circle cx="110" cy="110" r={RADII[i]} fill="none" strokeWidth="12" strokeLinecap="round" pathLength={100} strokeDasharray="75 100" className="stroke-[var(--muted)]" />
                <circle
                  onPointerEnter={() => enter(i)}
                  cx="110"
                  cy="110"
                  r={RADII[i]}
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  pathLength={100}
                  className={cn("cursor-pointer [transition:stroke-dasharray_1s_var(--ns-ease-settle),opacity_.2s] motion-reduce:transition-none", hover >= 0 && hover !== i ? "opacity-30" : "opacity-100")}
                  style={{ stroke: color(i), strokeDasharray: `${(v * 0.75).toFixed(1)} 100`, transitionDelay: `${i * 90}ms, 0ms` }}
                />
              </React.Fragment>
            ))}
          </svg>
          {values.map((_, i) => (
            <span
              key={names[i]}
              aria-hidden="true"
              className={cn("absolute end-[calc(50%+12px)] -translate-y-1/2 text-[10.5px] leading-none font-medium whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [transition:opacity_.2s]", hover >= 0 && hover !== i ? "opacity-30" : "opacity-100")}
              style={{ top: `${((110 - RADII[i]!) / 220) * 100}%` }}
            >
              {config?.[names[i]!]?.label ?? names[i]}
            </span>
          ))}
          <div className="pointer-events-none absolute top-1/2 left-1/2 flex w-[62px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center leading-[1.1]">
            <NumberFlow value={`${hover >= 0 ? values[hover] : avg}%`} className="text-[18px] font-semibold tracking-[-0.03em]" />
            <span className="max-w-[62px] truncate text-[9.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{hover >= 0 ? (config?.[names[hover]!]?.label ?? names[hover]) : "average"}</span>
          </div>
        </div>
        <div role="list" aria-label="Goals" className="flex w-full flex-col gap-0.5">
          {names.map((n, i) => (
            <div
              key={n}
              role="listitem"
              tabIndex={0}
              onPointerEnter={() => enter(i)}
              onFocus={() => enter(i)}
              onBlur={() => setHover(-1)}
              className={cn("flex h-[38px] cursor-default items-center gap-2.5 rounded-[8px] px-2 outline-none [transition:background-color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", hover === i && "bg-[var(--accent)]")}
            >
              <span aria-hidden="true" className="size-[9px] rounded-full" style={{ background: color(i) }} />
              <span className="flex flex-1 flex-col leading-[1.25]">
                <span className="text-[length:var(--ns-type-label)]">{config?.[n]?.label ?? n}</span>
                <span className="text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{String(field(rows[i], targetKey) ?? "")}</span>
              </span>
              <NumberFlow value={`${values[i]}%`} className="text-[length:var(--ns-type-label)] font-semibold" />
            </div>
          ))}
        </div>
      </div>
      <SrTable caption={typeof title === "string" ? title : "Goals"} columns={["Goal", "Progress", "Target"]} rows={names.map((n, i) => [n, `${values[i]}%`, String(field(rows[i], targetKey) ?? "")])} />
    </ChartRoot>
  )
})

export { RadialBars, type RadialBarsProps, type RadialBarsView }
