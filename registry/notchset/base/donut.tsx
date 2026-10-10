"use client"

/**
 * Donut (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/donut
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { ChartHeader, ChartRoot, field, fmtNum, num, Segmented, seriesColor, SrTable, type ChartConfig, type ChartRow } from "@/lib/notchset/chart"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Donut: parts of a whole as a ring with a breathing gap between segments. Changing period re-flows every
 * segment around the ring; hovering a segment or its legend row thickens it, fades the rest, and swaps
 * the centre to its name, value and share.
 */

interface DonutView {
  label: string
  /** One row per part: { name, value }. */
  data: readonly ChartRow[]
  subtitle?: React.ReactNode | undefined
}

interface DonutProps extends Omit<React.ComponentPropsWithoutRef<"figure">, "title"> {
  title: React.ReactNode
  views: readonly DonutView[]
  defaultView?: number | undefined
  nameKey?: string | undefined
  valueKey?: string | undefined
  config?: ChartConfig | undefined
  /** The centre's label when nothing is hovered. */
  totalLabel?: string | undefined
  formatValue?: ((n: number) => string) | undefined
  sound?: boolean | undefined
}

const Donut = React.forwardRef<HTMLElement, DonutProps>(function Donut({ title, views, defaultView = 0, nameKey = "name", valueKey = "value", config, totalLabel = "Total", formatValue = fmtNum, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [vi, setVi] = React.useState(defaultView)
  const [hover, setHover] = React.useState(-1)
  const rows = (views[vi] ?? views[0]!).data
  const names = rows.map((r) => String(field(r, nameKey) ?? ""))
  const values = rows.map((r) => num(r, valueKey))
  const total = values.reduce((a, b) => a + b, 0) || 1
  const color = (i: number) => seriesColor(config, names[i]!, i)
  const enter = (i: number) => {
    if (i === hover) return
    sfx.tone(1000 + i * 120, 0.02, "triangle", 0.022)
    setHover(i)
  }
  let start = 0
  const segs = values.map((v, i) => {
    const len = (v / total) * 100
    const seg = { i, da: `${Math.max(0.1, len - 0.9).toFixed(1)} ${(100 - len + 0.9).toFixed(1)}`, off: (-start).toFixed(1) }
    start += len
    return seg
  })

  return (
    <ChartRoot ref={ref} data-slot="donut" summary={`${typeof title === "string" ? title : "Donut"}: ${names.map((n, i) => `${n} ${Math.round((values[i]! / total) * 100)}%`).join(", ")}.`} className={cn("max-w-[480px]", className)} {...props}>
      <ChartHeader title={title} subtitle={views[vi]?.subtitle}>
        <Segmented label="Period" options={views.map((v) => v.label)} value={vi} width={60} onValueChange={setVi} sound={sound} />
      </ChartHeader>
      <div onPointerLeave={() => setHover(-1)} className="grid grid-cols-[200px_minmax(0,1fr)] items-center gap-6 max-sm:grid-cols-1 max-sm:justify-items-center">
        <div className="relative size-[200px]">
          <svg viewBox="0 0 200 200" aria-hidden="true" className="size-full -rotate-90 rtl:-scale-x-100">
            <circle cx="100" cy="100" r="76" fill="none" strokeWidth="20" className="stroke-[var(--muted)]" />
            {segs.map((s) => (
              <circle
                key={names[s.i]}
                onPointerEnter={() => enter(s.i)}
                cx="100"
                cy="100"
                r="76"
                fill="none"
                pathLength={100}
                className={cn("cursor-pointer [transition:stroke-dasharray_.8s_var(--ns-ease-settle),stroke-dashoffset_.8s_var(--ns-ease-settle),stroke-width_.25s_var(--ns-ease-pop),opacity_.2s] motion-reduce:transition-none", hover >= 0 && hover !== s.i ? "opacity-[.32]" : "opacity-100")}
                style={{ stroke: color(s.i), strokeWidth: hover === s.i ? 26 : 20, strokeDasharray: s.da, strokeDashoffset: s.off }}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{hover >= 0 ? (config?.[names[hover]!]?.label ?? names[hover]) : totalLabel}</span>
              <NumberFlow value={formatValue(hover >= 0 ? values[hover]! : total)} className="text-[26px] font-medium tracking-[-0.03em]" />
              <span className="text-[11.5px]" style={{ color: hover >= 0 ? `color-mix(in oklab, ${color(hover)} 70%, var(--foreground))` : "color-mix(in oklab, var(--muted-foreground) 85%, var(--foreground))" }}>
                {hover >= 0 ? <><NumberFlow value={`${Math.round((values[hover]! / total) * 100)}%`} /> of total</> : `${names.length} parts`}
              </span>
            </div>
          </div>
        </div>
        <div role="list" aria-label="Parts" className="flex w-full flex-col gap-0.5">
          {names.map((n, i) => (
            <div
              key={n}
              role="listitem"
              tabIndex={0}
              onPointerEnter={() => enter(i)}
              onFocus={() => enter(i)}
              onBlur={() => setHover(-1)}
              className={cn("flex h-8 cursor-default items-center gap-2.5 rounded-[8px] px-2 outline-none [transition:background-color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", hover === i && "bg-[var(--accent)]")}
            >
              <span aria-hidden="true" className="size-[9px] rounded-[3px]" style={{ background: color(i) }} />
              <span className="flex-1 text-[length:var(--ns-type-label)]">{config?.[n]?.label ?? n}</span>
              <NumberFlow value={formatValue(values[i]!)} className="text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]" />
              <NumberFlow value={`${Math.round((values[i]! / total) * 100)}%`} className="w-[34px] justify-end text-[length:var(--ns-type-note)] font-semibold" />
            </div>
          ))}
        </div>
      </div>
      <SrTable caption={typeof title === "string" ? title : "Donut"} columns={["Part", "Value", "Share"]} rows={names.map((n, i) => [n, formatValue(values[i]!), `${Math.round((values[i]! / total) * 100)}%`])} />
    </ChartRoot>
  )
})

export { Donut, type DonutProps, type DonutView }
