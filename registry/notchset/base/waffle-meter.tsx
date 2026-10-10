"use client"

/**
 * Waffle Meter (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/waffle-meter
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Waffle Meter: fifty squares, each 2% of a quota, filled in category order in the chart colours. Any
 * change cascades across the grid; hovering a legend item isolates its squares and shows its number.
 * Going over the quota shakes the grid and buzzes.
 */

interface WaffleCategory {
  id: string
  label: string
  value: number
}

interface WaffleMeterProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  /** Up to five categories, coloured --chart-1…5 in order. */
  categories: readonly WaffleCategory[]
  /** The quota. */
  total: number
  title?: React.ReactNode | undefined
  /** Formats numbers. Default the visitor's locale. */
  format?: ((n: number) => string) | undefined
  /** Extra controls in the header (a plan toggle). */
  action?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const SQUARES = 50

const WaffleMeter = React.forwardRef<HTMLDivElement, WaffleMeterProps>(function WaffleMeter(
  { categories, total, title = "Usage", format = (n) => Math.round(n).toLocaleString(), action, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const cap = Number.isFinite(total) && total > 0 ? total : 1
  const cats = categories.slice(0, 5).map((c) => ({ ...c, value: Number.isFinite(c.value) && c.value > 0 ? c.value : 0 }))
  const used = cats.reduce((a, c) => a + c.value, 0)
  const over = used > cap
  const [hover, setHover] = React.useState<string | null>(null)
  const [shakes, setShakes] = React.useState(0)
  const shown = hover ? (cats.find((c) => c.id === hover)?.value ?? used) : used
  const wasOver = React.useRef(over)
  React.useEffect(() => {
    if (over && !wasOver.current) {
      sfx.buzz()
      setShakes((n) => n + 1)
    }
    wasOver.current = over
  }, [over, sfx])

  // Squares per category, in order, from the running share of the quota.
  const owner: (number | null)[] = []
  let acc = 0
  cats.forEach((c, ci) => {
    const end = Math.min(SQUARES, Math.round(((acc + c.value) / cap) * SQUARES))
    for (let i = owner.length; i < end; i++) owner.push(ci)
    acc += c.value
  })
  while (owner.length < SQUARES) owner.push(null)

  return (
    <div ref={ref} data-slot="waffle-meter" data-notchset="" className={cn("flex w-full flex-col gap-4", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)]">{title}</span>
          <span className="flex items-baseline gap-1.5">
            <span className={cn("font-mono text-[30px] leading-9 font-medium tracking-[-0.03em] tabular-nums", over ? "text-[var(--destructive)]" : "text-[var(--foreground)]")}><NumberFlow value={format(shown)} /></span>
            <span className="font-mono text-[length:var(--ns-type-note)] whitespace-nowrap text-[var(--muted-foreground)]">of {format(cap)}</span>
          </span>
        </div>
        {action}
      </div>
      <div
        role="img"
        aria-label={`${format(used)} of ${format(cap)} used: ${cats.map((c) => `${c.label} ${format(c.value)}`).join(", ")}`}
        className={cn("grid grid-cols-10 gap-1", shakes > 0 && (shakes % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]"))}
      >
        {owner.map((ci, i) => {
          const id = ci == null ? null : cats[ci]!.id
          const dim = hover != null && id !== hover
          return (
            <span
              key={i}
              className={cn(
                "block aspect-square rounded-[3px] [transition:background-color_.4s,opacity_.25s,transform_.25s_var(--ns-ease-rebound),scale_.25s_var(--ns-ease-rebound),translate_.25s_var(--ns-ease-rebound),rotate_.25s_var(--ns-ease-rebound)]",
                ci === null && "bg-[var(--muted)]",
                ci === 0 && "bg-[var(--chart-1)]",
                ci === 1 && "bg-[var(--chart-2)]",
                ci === 2 && "bg-[var(--chart-3)]",
                ci === 3 && "bg-[var(--chart-4)]",
                ci === 4 && "bg-[var(--chart-5)]",
                dim ? "opacity-[.22]" : "opacity-100",
                hover != null && id === hover ? "scale-[.86]" : "scale-100"
              )}
              style={{ transitionDelay: `${i * 12}ms, 0ms, 0ms` }}
            />
          )
        })}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-1 gap-y-1 p-0" onPointerLeave={() => setHover(null)}>
        {[...cats.map((c, ci) => ({ ...c, ci })), { id: "__left", label: "Left", value: Math.max(0, cap - used), ci: -1 }].map((c) => (
          <li key={c.id}>
            <button
              type="button"
              aria-pressed={hover === c.id}
              onPointerEnter={() => c.ci >= 0 && setHover(c.id)}
              onFocus={() => c.ci >= 0 && setHover(c.id)}
              onBlur={() => setHover(null)}
              className="flex h-7 cursor-default items-center gap-1.5 rounded-[min(var(--radius),8px)] px-2 text-[length:var(--ns-type-note)] whitespace-nowrap text-[var(--muted-foreground)] outline-none hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] aria-pressed:bg-[var(--accent)]"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2.5 rounded-[2px]",
                  c.ci === -1 && "bg-[var(--muted)] shadow-[inset_0_0_0_1px_var(--border)]",
                  c.ci === 0 && "bg-[var(--chart-1)]",
                  c.ci === 1 && "bg-[var(--chart-2)]",
                  c.ci === 2 && "bg-[var(--chart-3)]",
                  c.ci === 3 && "bg-[var(--chart-4)]",
                  c.ci === 4 && "bg-[var(--chart-5)]"
                )}
              />
              {c.label}
              <span className="font-mono text-[var(--foreground)] tabular-nums">{format(c.value)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
})

export { WaffleMeter, type WaffleCategory, type WaffleMeterProps }
