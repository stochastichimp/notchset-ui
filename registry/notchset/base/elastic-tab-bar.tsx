"use client"

/**
 * Elastic Tab Bar (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/elastic-tab-bar
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useIsomorphicLayoutEffect } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Elastic Tab Bar: the active pill stretches toward the tab you pick, leading edge first (.32s), then the
 * trailing edge catches up (.52s, 50ms later). Labels can show on the active tab only, on every tab, or
 * not at all; they open by width and margin, so a hidden label takes no room and the pill stays true.
 * The content slides in from the side you moved to, and a badge rolls its count and pops away at zero.
 */

interface ElasticTab {
  value: string
  label: string
  icon: React.ReactNode
  /** A count on the tab; it scales away at 0. */
  badge?: number | undefined
  content?: React.ReactNode | undefined
}

type LabelMode = "active" | "all" | "none"

interface ElasticTabBarProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  tabs: readonly ElasticTab[]
  value: string
  onValueChange: (value: string) => void
  labels?: LabelMode | undefined
  sound?: boolean | undefined
}

const ElasticTabBar = React.forwardRef<HTMLDivElement, ElasticTabBarProps>(function ElasticTabBar({ tabs, value, onValueChange, labels = "active", sound = true, className, children, ...props }, ref) {
  const { sfx } = useSound(sound)
  const baseId = React.useId()
  const labelRefs = React.useRef<(HTMLSpanElement | null)[]>([])
  const [widths, setWidths] = React.useState<number[] | null>(null)
  const index = Math.max(0, tabs.findIndex((t) => t.value === value))
  const [move, setMove] = React.useState({ key: 0, dir: 1 as 1 | -1 })

  const labelKey = tabs.map((t) => t.label).join("|")
  // Each label's natural width (scrollWidth ignores the max-width that hides it).
  useIsomorphicLayoutEffect(() => {
    const measure = () => setWidths(labelRefs.current.map((el) => (el ? Math.ceil(el.scrollWidth) : 0)))
    measure()
    const ro = new ResizeObserver(measure)
    labelRefs.current.forEach((el) => el?.firstElementChild && ro.observe(el.firstElementChild))
    return () => ro.disconnect()
  }, [labelKey])

  // A badge counting down ticks lower each step, and drops away at zero.
  const badges = tabs.map((t) => t.badge ?? -1).join(",")
  const lastBadges = React.useRef(badges)
  React.useEffect(() => {
    const before = lastBadges.current.split(",").map(Number)
    lastBadges.current = badges
    badges.split(",").forEach((b, i) => {
      const n = Number(b)
      if (n < 0 || !(n < (before[i] ?? -1))) return
      if (n === 0) sfx.drop()
      else sfx.tone(700 + n * 80, 0.02, "triangle", 0.025)
    })
  }, [badges, sfx])

  const shown = (i: number) => labels === "all" || (labels === "active" && i === index)
  // Icon tab = 13 + 18 + 13 = 44px; a shown label adds 7px of margin and its width.
  const tabW = widths ? tabs.map((_, i) => 44 + (shown(i) ? 7 + (widths[i] ?? 0) : 0)) : null
  const total = tabW ? tabW.reduce((a, b) => a + b, 0) + 8 : 0
  const start = tabW ? 4 + tabW.slice(0, index).reduce((a, b) => a + b, 0) : 0
  const end = tabW ? total - start - tabW[index]! : 0

  const pick = (i: number) => {
    if (i === index) return
    sfx.tone(820 + i * 110, 0.04, "triangle", 0.035)
    setMove((m) => ({ key: m.key + 1, dir: i > index ? 1 : -1 }))
    onValueChange(tabs[i]!.value)
  }
  const fast = ".32s var(--ns-ease-settle)"
  const slow = ".52s var(--ns-ease-settle) .05s"
  const active = tabs[index]

  return (
    <div ref={ref} data-slot="elastic-tab-bar" data-notchset="" className={cn("flex flex-col gap-3.5", className)} {...props}>
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label="Sections"
          onKeyDown={(event) => {
            const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
            const step = event.key === "ArrowRight" ? (rtl ? -1 : 1) : event.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0
            const to = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : step ? (index + step + tabs.length) % tabs.length : -1
            if (to < 0) return
            event.preventDefault()
            pick(to)
            ;(event.currentTarget.children[to + 1] as HTMLElement | undefined)?.focus()
          }}
          className="relative flex rounded-full border border-[var(--border)] bg-[var(--muted)] p-1"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-1 rounded-full bg-[var(--primary)] motion-reduce:[transition:inset-inline-start_.3s,inset-inline-end_.3s]!"
            style={tabW ? { insetInlineStart: start, insetInlineEnd: end, transition: move.dir > 0 ? `inset-inline-end ${fast},inset-inline-start ${slow}` : `inset-inline-start ${fast},inset-inline-end ${slow}` } : { opacity: 0 }}
          />
          {tabs.map((t, i) => (
            <button
              key={t.value}
              id={`${baseId}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-controls={`${baseId}-panel`}
              aria-label={t.badge ? `${t.label}, ${t.badge} new` : t.label}
              tabIndex={i === index ? 0 : -1}
              onClick={() => pick(i)}
              className={cn(
                "relative flex h-[var(--ns-control-regular)] cursor-pointer items-center px-[13px] text-[13.5px] font-medium outline-none [transition:color_.3s] focus-visible:rounded-full focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] [&>svg]:size-[18px] [&>svg]:shrink-0",
                i === index ? "text-[var(--primary-foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
              )}
            >
              {t.icon}
              <span
                ref={(el) => {
                  labelRefs.current[i] = el
                }}
                aria-hidden="true"
                className="block overflow-hidden whitespace-nowrap [transition:max-width_.45s_cubic-bezier(.2,1.1,.3,1),margin-inline-start_.45s_cubic-bezier(.2,1.1,.3,1),opacity_var(--ns-time-state)]"
                style={{ maxWidth: shown(i) ? (widths ? widths[i] : "none") : 0, marginInlineStart: shown(i) ? 7 : 0, opacity: shown(i) ? 1 : 0 }}
              >
                <span className="inline-block">{t.label}</span>
              </span>
              {t.badge !== undefined && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute start-[26px] top-[3px] grid h-4 min-w-4 place-items-center rounded-[8px] bg-[var(--destructive)] px-1 text-[10px] font-semibold text-white tabular-nums shadow-[0_0_0_2px_var(--muted)] [transition:scale_.35s_var(--ns-ease-rebound)]",
                    t.badge > 0 ? "scale-100" : "scale-0"
                  )}
                >
                  <NumberFlow value={Math.max(0, t.badge)} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {active?.content !== undefined && (
        <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${index}`} className="relative min-h-0 flex-1 overflow-hidden">
          <div
            key={move.key}
            className={cn(
              "motion-reduce:animate-none",
              move.key > 0 && move.dir > 0 && "animate-[ns-slide-l_.42s_var(--ns-ease-settle)_both] rtl:animate-[ns-slide-r_.42s_var(--ns-ease-settle)_both]",
              move.key > 0 && move.dir < 0 && "animate-[ns-slide-r_.42s_var(--ns-ease-settle)_both] rtl:animate-[ns-slide-l_.42s_var(--ns-ease-settle)_both]"
            )}
          >
            {active.content}
          </div>
        </div>
      )}
      {children}
    </div>
  )
})

export { ElasticTabBar, type ElasticTab, type ElasticTabBarProps, type LabelMode }
