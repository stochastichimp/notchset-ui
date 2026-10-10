"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Chart parts shared by every chart: the data contract, the geometry helpers, and the pieces each chart
 * is built from (header, segmented tabs, rolling headline with a delta chip, axes, a gliding tooltip,
 * an in-view hook that pauses live work off screen, and the hidden data table for screen readers).
 *
 * Data is the shape shadcn/ui charts and Recharts take: `data` is an array of row objects (TanStack
 * Query results and TanStack Table rows pass straight in) and `config` is a ChartConfig, the same
 * label-and-colour map keyed by series. Colours default to --c1…--c5, the theme's --chart-1…5 at
 * slightly lower chroma inside a chart.
 */

/** The shadcn/ui ChartConfig: a label and a colour (or a colour per theme) per series key. */
type ChartConfig = Record<string, { label?: React.ReactNode | undefined; icon?: React.ComponentType | undefined; color?: string | undefined; theme?: { light: string; dark: string } | undefined }>

/** A row of chart data, as Recharts and TanStack hand it over (types and interfaces both fit). */
type ChartRow = object

/** A row's field by key. */
function field(row: ChartRow | undefined, key: string): unknown {
  return row ? (row as Record<string, unknown>)[key] : undefined
}

const CHART_COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"] as const

/** A series' colour: its config colour, else the next chart hue. */
function seriesColor(config: ChartConfig | undefined, key: string, index: number) {
  return config?.[key]?.color ?? CHART_COLORS[index % CHART_COLORS.length]!
}

/** A row's value as a finite number (bad values become 0, never NaN in a path). */
function num(row: ChartRow | undefined, key: string) {
  const v = Number(field(row, key))
  return Number.isFinite(v) ? v : 0
}

// ---- Geometry ----

type Pt = [number, number]
const r1 = (v: number) => Math.round(v * 10) / 10

/** Catmull-Rom to cubic Bézier: the same command count for the same point count, so `d` morphs cleanly. */
function smooth(points: readonly Pt[]): string {
  if (points.length === 0) return "M0,0"
  const first = points[0]!
  let d = `M${r1(first[0])},${r1(first[1])}`
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i - 1] ?? points[i]!
    const b = points[i]!
    const c = points[i + 1]!
    const e = points[i + 2] ?? c
    d += ` C${r1(b[0] + (c[0] - a[0]) / 6)},${r1(b[1] + (c[1] - a[1]) / 6)} ${r1(c[0] - (e[0] - b[0]) / 6)},${r1(c[1] - (e[1] - b[1]) / 6)} ${r1(c[0])},${r1(c[1])}`
  }
  return d
}

/** Any series resampled to `n` points, so paths keep their command count across ranges. */
function resample(values: readonly number[], n: number): number[] {
  const src = values.filter((v) => Number.isFinite(v))
  if (src.length === 0) return Array.from({ length: n }, () => 0)
  if (src.length === 1) return Array.from({ length: n }, () => src[0]!)
  return Array.from({ length: n }, (_, k) => {
    const f = (k / (n - 1)) * (src.length - 1)
    const i = Math.floor(f)
    const t = f - i
    return src[i]! * (1 - t) + (src[Math.min(src.length - 1, i + 1)] ?? src[i]!) * t
  })
}

/** An axis maximum rounded up to 1, 2, 2.5, 5 or 10 × 10^k. */
function niceMax(v: number): number {
  if (!(v > 0)) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p
}

/** Labels pushed apart so none overlap (positions in %). */
function relax(ys: readonly number[], gap = 9): number[] {
  const order = ys.map((_, i) => i).sort((a, b) => ys[a]! - ys[b]!)
  const out = ys.slice()
  for (let k = 1; k < order.length; k++) {
    const cur = order[k]!
    const prev = order[k - 1]!
    if (out[cur]! - out[prev]! < gap) out[cur] = out[prev]! + gap
  }
  return out
}

/** A squarified treemap: [x, y, w, h] per input index. */
function squarify(values: readonly number[], x0: number, y0: number, w0: number, h0: number): [number, number, number, number][] {
  let x = x0
  let y = y0
  let w = w0
  let h = h0
  const total = values.reduce((a, b) => a + Math.max(0, b), 0)
  const out: [number, number, number, number][] = values.map(() => [x0, y0, 0, 0])
  if (!(total > 0)) return out
  const scale = (w * h) / total
  let rest = values.map((v, i) => ({ i, a: Math.max(0, v) * scale })).filter((r) => r.a > 0).sort((p, q) => q.a - p.a)
  const worst = (row: { a: number }[], side: number) => {
    const sum = row.reduce((a, r) => a + r.a, 0)
    const mx = Math.max(...row.map((r) => r.a))
    const mn = Math.min(...row.map((r) => r.a))
    return Math.max((side * side * mx) / (sum * sum), (sum * sum) / (side * side * mn))
  }
  while (rest.length) {
    const side = Math.min(w, h)
    let row = [rest[0]!]
    let best = worst(row, side)
    for (let k = 1; k < rest.length; k++) {
      const next = [...row, rest[k]!]
      const score = worst(next, side)
      if (score > best) break
      row = next
      best = score
    }
    const sum = row.reduce((a, r) => a + r.a, 0)
    if (w >= h) {
      const cw = sum / h
      let yy = y
      for (const r of row) {
        const hh = r.a / cw
        out[r.i] = [x, yy, cw, hh]
        yy += hh
      }
      x += cw
      w -= cw
    } else {
      const rh = sum / w
      let xx = x
      for (const r of row) {
        const ww = r.a / rh
        out[r.i] = [xx, y, ww, rh]
        xx += ww
      }
      y += rh
      h -= rh
    }
    rest = rest.slice(row.length)
  }
  return out
}

/** Dot identity across count changes: dots keep their category while it has room; only the overflow moves. */
function reassign(prev: readonly number[] | null, counts: readonly number[], total = 100): number[] {
  const need = counts.slice()
  const out = Array.from({ length: total }, () => -1)
  prev?.forEach((c, i) => {
    if ((need[c] ?? 0) > 0) {
      out[i] = c
      need[c]! -= 1
    }
  })
  for (let i = 0; i < total; i++) {
    if (out[i]! >= 0) continue
    const c = need.findIndex((n) => n > 0)
    if (c < 0) break
    out[i] = c
    need[c]! -= 1
  }
  return out
}

/** A closed band between two curves (upper forward, lower back), morphable. */
function band(upper: readonly Pt[], lower: readonly Pt[]): string {
  const last = lower[lower.length - 1] ?? [0, 0]
  return `${smooth(upper)} L${last[0]},${last[1]}${smooth(lower.slice().reverse()).replace(/^M[^C]+/, " ")} Z`
}

/** A Sankey ribbon from (x0, y0) to (x1, y1), `h` thick. */
function ribbon(x0: number, y0: number, h: number, x1: number, y1: number): string {
  const xm = (x0 + x1) / 2
  return `M${r1(x0)},${r1(y0)} C${r1(xm)},${r1(y0)} ${r1(xm)},${r1(y1)} ${r1(x1)},${r1(y1)} L${r1(x1)},${r1(y1 + h)} C${r1(xm)},${r1(y1 + h)} ${r1(xm)},${r1(y0 + h)} ${r1(x0)},${r1(y0 + h)} Z`
}

/** Node totals stacked into [y, h] pairs, centred, on a shared scale `k` (units per value). */
function stackColumn(totals: readonly number[], k: number, height: number, pad = 14): [number, number][] {
  const hs = totals.map((v) => Math.max(0, v) * k)
  const sum = hs.reduce((a, b) => a + b, 0) + pad * (totals.length - 1)
  let y = (height - sum) / 2
  return hs.map((h) => {
    const r: [number, number] = [y, h]
    y += h + pad
    return r
  })
}

/** Streamgraph layers (silhouette), centred on height / 2. */
function streamLayers(layers: readonly (readonly number[])[], width: number, height: number): { up: Pt[]; lo: Pt[] }[] {
  const n = layers[0]?.length ?? 0
  if (n < 2) return layers.map(() => ({ up: [], lo: [] }))
  const tot = Array.from({ length: n }, (_, k) => layers.reduce((a, l) => a + Math.max(0, l[k] ?? 0), 0))
  const u = height / ((Math.max(...tot) || 1) * 1.08)
  const c = height / 2
  let cum = Array.from({ length: n }, () => 0)
  return layers.map((l) => {
    const lo = cum.map((v, k): Pt => [(k / (n - 1)) * width, c - (-tot[k]! / 2 + v) * u])
    cum = cum.map((v, k) => v + Math.max(0, l[k] ?? 0))
    const up = cum.map((v, k): Pt => [(k / (n - 1)) * width, c - (-tot[k]! / 2 + v) * u])
    return { up, lo }
  })
}

const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US")

// ---- Hooks ----

/** True while the element is on screen (live work pauses off screen). */
function useInView<T extends Element>(ref: React.RefObject<T | null>) {
  const [inView, setInView] = React.useState(true)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver((entries) => setInView(entries.some((e) => e.isIntersecting)))
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return inView
}

// ---- Parts ----

/** The chart root: a figure with its caption, the chart colours, and the sans tabular figures. */
const ChartRoot = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"figure"> & { summary: string }>(function ChartRoot({ summary, className, children, ...props }, ref) {
  return (
    <figure ref={ref} data-notchset-chart="" data-notchset="" aria-label={summary} className={cn("m-0 flex w-full min-w-0 flex-col gap-4 text-[var(--foreground)] tabular-nums [font-feature-settings:'tnum']", className)} {...props}>
      {children}
    </figure>
  )
})

/** Title and subtitle on the left, controls on the right. */
function ChartHeader({ title, subtitle, children }: { title: React.ReactNode; subtitle?: React.ReactNode | undefined; children?: React.ReactNode | undefined }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <figcaption className="flex flex-col gap-0.5">
        <span className="text-[length:var(--ns-type-copy)] font-semibold tracking-[var(--ns-tracking-control)]">{title}</span>
        {subtitle && <span className="text-[12.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{subtitle}</span>}
      </figcaption>
      {children}
    </div>
  )
}

/** Fixed-width tabs with a sliding thumb; changing plays the morph swoosh. */
function Segmented({ options, value, onValueChange, width = 72, label, sound = true }: { options: readonly string[]; value: number; onValueChange: (i: number) => void; width?: number | undefined; label: string; sound?: boolean | undefined }) {
  const { sfx } = useSound(sound)
  return (
    <div role="radiogroup" aria-label={label} className="relative flex shrink-0 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] p-[3px]">
      {value >= 0 && (
        <span
          aria-hidden="true"
          className="absolute inset-y-[3px] rounded-[var(--radius)] bg-[var(--background)] shadow-[0_1px_2px_rgba(0,0,0,.08),0_0_0_1px_var(--border)] [transition:inset-inline-start_.45s_cubic-bezier(.2,1.25,.3,1)]"
          style={{ width, insetInlineStart: 3 + value * width }}
        />
      )}
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={i === value}
          onClick={() => {
            if (i === value) return
            sfx.morph()
            onValueChange(i)
          }}
          className={cn(
            "relative h-7 cursor-pointer rounded-[var(--radius)] text-[12.5px] font-medium whitespace-nowrap outline-none [transition:color_var(--ns-time-color)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]",
            i === value ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] hover:text-[var(--foreground)]"
          )}
          style={{ width }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

/** A signed change as a pill: green up, red down. */
function DeltaChip({ value, suffix = "%", digits = 1 }: { value: number; suffix?: string | undefined; digits?: number | undefined }) {
  const up = value >= 0
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-[9px] text-[length:var(--ns-type-note)] [transition:background-color_.3s,color_.3s]",
        up ? "bg-[color-mix(in_oklab,var(--success,var(--foreground))_14%,transparent)] text-[color-mix(in_oklab,var(--success,var(--foreground))_75%,var(--foreground))]" : "bg-[color-mix(in_oklab,var(--destructive)_14%,transparent)] text-[color-mix(in_oklab,var(--destructive)_75%,var(--foreground))]"
      )}
    >
      <NumberFlow value={`${up ? "+" : "−"}${Math.abs(value).toFixed(digits)}${suffix}`} />
    </span>
  )
}

/** The 32px rolling headline with an optional chip and note. */
function Headline({ value, chip, note }: { value: string | number; chip?: React.ReactNode | undefined; note?: React.ReactNode | undefined }) {
  return (
    <div className="flex flex-wrap items-end gap-3.5">
      <NumberFlow value={value} className="text-[32px] leading-[1.1] font-medium tracking-[-0.04em]" />
      {chip && <span className="mb-1">{chip}</span>}
      {note && <span className="mb-1.5 text-[12.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{note}</span>}
    </div>
  )
}

/** Dashed gridlines with a solid baseline, `lines` apart top to bottom. */
function Gridlines({ lines = 3 }: { lines?: number | undefined }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className={cn("border-t border-[var(--border)]", i < lines - 1 && "border-dashed")} />
      ))}
    </div>
  )
}

/** The Y labels: a column of rolling numbers, each centred on its gridline. */
function YAxis({ labels, height, className }: { labels: readonly (string | number)[]; height: number; className?: string | undefined }) {
  return (
    <div aria-hidden="true" className={cn("-mt-[7px] flex flex-col items-start justify-between text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]", className)} style={{ height }}>
      {labels.map((l, i) => (
        <NumberFlow key={i} value={l} />
      ))}
    </div>
  )
}

/** The X labels, spread evenly. */
function XAxis({ labels, className }: { labels: readonly React.ReactNode[]; className?: string | undefined }) {
  return (
    <div aria-hidden="true" className={cn("flex justify-between text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]", className)}>
      {labels.map((l, i) => (
        <span key={i}>{l}</span>
      ))}
    </div>
  )
}

/** The tooltip: inverted, it glides between points and grows in from its tail. */
function ChartTooltip({ x, y, shown, children }: { x: string; y: string; shown: boolean; children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-[4] origin-[50%_100%] [transition:left_.3s_cubic-bezier(.2,1.2,.3,1),top_.3s_cubic-bezier(.2,1.2,.3,1),opacity_.18s,scale_.25s_cubic-bezier(.2,1.4,.3,1)]",
        shown ? "scale-100 opacity-100" : "scale-0 opacity-0"
      )}
      style={{ left: x, top: y, translate: "-50% calc(-100% - 10px)" }}
    >
      <div className="flex flex-col gap-0.5 rounded-[10px] bg-[var(--foreground)] px-2.5 py-[7px] text-[length:var(--ns-type-note)] whitespace-nowrap text-[var(--background)] shadow-[0_8px_24px_-6px_rgba(0,0,0,.3)]">{children}</div>
    </div>
  )
}

/** A label inside the tooltip (10.5px, softened). */
function TooltipLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[10.5px] text-[color-mix(in_oklab,var(--background)_65%,var(--foreground))]">{children}</span>
}

/** The data as a table, for screen readers. */
function SrTable({ caption, columns, rows }: { caption: string; columns: readonly string[]; rows: readonly (readonly React.ReactNode[])[] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 500).map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** A polite live line that reads the hovered point back. */
function LiveLine({ children, className }: { children: React.ReactNode; className?: string | undefined }) {
  return (
    <p aria-live="polite" className={cn("m-0 min-h-[18px] text-[12.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]", className)}>
      {children}
    </p>
  )
}

/** A legend swatch and label. */
function LegendItem({ color, label, shape = "dot", children }: { color: string; label: React.ReactNode; shape?: "dot" | "line" | "dash" | "square" | undefined; children?: React.ReactNode | undefined }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={cn(shape === "dot" && "size-2 rounded-full", shape === "square" && "size-2.5 rounded-[3px]", shape === "line" && "h-[2.5px] w-3.5 rounded-[2px]", shape === "dash" && "h-0 w-3.5 border-t-2 border-dashed")}
        style={shape === "dash" ? { borderColor: color } : { background: color }}
      />
      {label}
      {children}
    </span>
  )
}

export {
  band,
  CHART_COLORS,
  ChartHeader,
  ChartRoot,
  ChartTooltip,
  DeltaChip,
  field,
  fmtNum,
  Gridlines,
  Headline,
  LegendItem,
  LiveLine,
  niceMax,
  num,
  reassign,
  relax,
  resample,
  ribbon,
  Segmented,
  seriesColor,
  smooth,
  squarify,
  SrTable,
  stackColumn,
  streamLayers,
  TooltipLabel,
  useInView,
  XAxis,
  YAxis,
  type ChartConfig,
  type ChartRow,
  type Pt,
}
