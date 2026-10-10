"use client"

/**
 * Lifecycle Badge (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/lifecycle-badge
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Lifecycle Badge: a 32px pill that steps through a lifecycle (Draft → In review → Changes asked →
 * Approved by default). Tint, border and text follow the state's colour, the icons cross-fade with a
 * −60° turn, the label rolls while the width animates, and the last state glows with a chime. Pips
 * underneath track the progress. CountBadge is a count bubble for an icon button: it bumps when the
 * count rises and scales away at zero.
 */

interface LifecycleStep {
  id: string
  label: string
  icon?: React.ReactNode | undefined
  /** e.g. "var(--info,var(--foreground))"; the first step is neutral by default. */
  color?: string | undefined
}

const svg = (paths: string[]) => (
  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {paths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
)

const DEFAULT_STEPS: readonly LifecycleStep[] = [
  { id: "draft", label: "Draft", icon: svg(["M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"]) },
  { id: "review", label: "In review", color: "var(--info,var(--chart-1))", icon: svg(["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"]) },
  { id: "changes", label: "Changes asked", color: "var(--warning,var(--chart-4))", icon: svg(["M12 9v4", "M12 17h.01", "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"]) },
  { id: "approved", label: "Approved", color: "var(--success,var(--chart-3))", icon: svg(["M20 6 9 17l-5-5"]) },
]

interface LifecycleBadgeProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  value: string
  steps?: readonly LifecycleStep[] | undefined
  /** Makes the badge a button that moves to the next step. */
  onAdvance?: (() => void) | undefined
  /** Show the pip track. */
  pips?: boolean | undefined
  sound?: boolean | undefined
}

const LifecycleBadge = React.forwardRef<HTMLDivElement, LifecycleBadgeProps>(function LifecycleBadge({ value, steps = DEFAULT_STEPS, onAdvance, pips = true, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const i = Math.max(0, steps.findIndex((s) => s.id === value))
  const last = i === steps.length - 1
  const c = steps[i]?.color
  const tone = c ?? "var(--muted-foreground)"
  const label = React.useRef<HTMLSpanElement>(null)
  const [widths, setWidths] = React.useState<number[]>([])
  const [glows, setGlows] = React.useState(0)
  const [seen, setSeen] = React.useState(i)
  if (seen !== i) {
    setSeen(i)
    if (last) setGlows((n) => n + 1)
  }
  const first = React.useRef(true)
  React.useEffect(() => {
    const el = label.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidths(Array.from(el.children).map((x) => (x as HTMLElement).scrollWidth)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [steps])
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (last) sfx.chime()
    else sfx.tone(700 + i * 140, 0.05, "triangle", 0.04)
  }, [i, last, sfx])

  const Pill = onAdvance ? "button" : "span"
  return (
    <div ref={ref} data-slot="lifecycle-badge" data-notchset="" className={cn("inline-flex flex-col items-center gap-3.5", className)} {...props}>
      <Pill
        {...(onAdvance ? { type: "button" as const, onClick: onAdvance } : {})}
        aria-live="polite"
        className={cn(
          "relative flex h-8 items-center gap-[7px] overflow-hidden rounded-full border ps-[9px] pe-3 text-[length:var(--ns-type-label)] font-semibold outline-none [transition:background-color_.35s,border-color_.35s,color_.35s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]",
          onAdvance && "cursor-pointer active:scale-[var(--ns-press-depth)]",
          last && glows > 0 && (glows % 2 ? "animate-[ns-glow_.8s_ease-out]" : "animate-[ns-glow-b_.8s_ease-out]")
        )}
        style={{ borderColor: `color-mix(in oklab, ${tone} 32%, var(--border))`, background: `color-mix(in oklab, ${tone} ${c ? 13 : 8}%, transparent)`, color: c ? `color-mix(in oklab, ${c} 75%, var(--foreground))` : "var(--foreground)", ["--glow" as string]: tone }}
      >
        <span aria-hidden="true" className="relative size-3.5 shrink-0">
          {steps.map((s, k) => (
            <span key={s.id} className="absolute inset-0 flex [transition:opacity_.2s,scale_.45s_var(--ns-ease-rebound),rotate_.45s_var(--ns-ease-rebound)] motion-reduce:transition-none" style={{ opacity: k === i ? 1 : 0, scale: k === i ? "1" : "0", rotate: k === i ? "0deg" : "-60deg" }}>
              {s.icon}
            </span>
          ))}
        </span>
        <span className="block h-[18px] overflow-hidden [transition:width_.5s_cubic-bezier(.2,1.2,.3,1)] motion-reduce:transition-none" style={{ width: widths[i] || undefined }}>
          <span ref={label} className="flex w-max flex-col [transition:translate_.5s_var(--ns-ease-reshape)] motion-reduce:transition-none" style={{ translate: `0 ${-i * 18}px` }}>
            {steps.map((s, k) => (
              <span key={s.id} aria-hidden={k === i ? undefined : true} className="h-[18px] leading-[18px] whitespace-nowrap">
                {s.label}
              </span>
            ))}
          </span>
        </span>
      </Pill>
      {pips && (
        <span aria-hidden="true" className="flex gap-[5px]">
          {steps.map((s, k) => (
            <span key={s.id} className="h-1 rounded-[2px] [transition:width_.45s_var(--ns-ease-reshape),background-color_.35s]" style={{ width: k === i ? 22 : 8, background: k <= i ? tone : "var(--border)" }} />
          ))}
        </span>
      )}
    </div>
  )
})

interface CountBadgeProps extends React.ComponentPropsWithoutRef<"span"> {
  count: number
  tone?: "neutral" | "destructive" | "info" | undefined
  /** The icon button the badge sits on. */
  children: React.ReactNode
}

function CountBadge({ count, tone = "neutral", children, className, ...props }: CountBadgeProps) {
  const [bumps, setBumps] = React.useState(0)
  const [seen, setSeen] = React.useState(count)
  if (seen !== count) {
    setSeen(count)
    if (count > seen) setBumps((n) => n + 1)
  }
  return (
    <span data-slot="count-badge" className={cn("relative inline-flex", className)} {...props}>
      {children}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -end-1.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold shadow-[0_0_0_2px_var(--card,var(--background))] [transition:scale_.4s_var(--ns-ease-rebound)]",
          tone === "neutral" && "bg-[var(--foreground)] text-[var(--background)]",
          tone === "destructive" && "bg-[var(--destructive)] text-white",
          tone === "info" && "bg-[var(--info,var(--chart-1))] text-white",
          bumps > 0 && (bumps % 2 ? "animate-[ns-bump-up_.45s_var(--ns-ease-rebound)]" : "animate-[ns-bump-up-b_.45s_var(--ns-ease-rebound)]")
        )}
        style={{ scale: count ? "1" : "0" }}
      >
        <NumberFlow value={Math.max(1, count)} />
      </span>
    </span>
  )
}

export { CountBadge, LifecycleBadge, type CountBadgeProps, type LifecycleBadgeProps, type LifecycleStep }
