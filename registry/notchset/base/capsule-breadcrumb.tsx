"use client"

/**
 * Capsule Breadcrumb (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/capsule-breadcrumb
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { CrumbIcon, useTrail, type Crumb } from "@/lib/notchset/crumbs"
import { useSound } from "@/lib/notchset/sound"

/*
 * Capsule Breadcrumb: the whole path in one pill, the current page inverted. From four levels the middle
 * ones shrink to their icon; hovering or focusing one opens its label with a soft tick. Levels you leave
 * fold away by width, new ones grow in.
 */

interface CapsuleBreadcrumbProps extends Omit<React.ComponentPropsWithoutRef<"nav">, "children"> {
  items: readonly Crumb[]
  onNavigate: (index: number, crumb: Crumb) => void
  sound?: boolean | undefined
}

const CapsuleBreadcrumb = React.forwardRef<HTMLElement, CapsuleBreadcrumbProps>(function CapsuleBreadcrumb({ items, onNavigate, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const { shown, leaving } = useTrail(items, (deeper, depth) => {
    if (deeper) sfx.tone(700 + depth * 110, 0.05, "triangle", 0.04)
    else sfx.drop()
  })
  const [hot, setHot] = React.useState(-1)
  const n = shown.length
  const compactAll = n >= 4

  return (
    <nav ref={ref} aria-label="Breadcrumb" data-slot="capsule-breadcrumb" data-notchset="" className={cn("max-w-full", className)} {...props}>
      <ol onMouseLeave={() => setHot(-1)} className="m-0 inline-flex h-10 max-w-full list-none items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--card,var(--background))] p-[3px]">
        {shown.map((c, i) => {
          const last = i === n - 1
          const left = leaving >= 0 && i > leaving
          // Middle levels go icon-only from four levels (on phones everything but the current one).
          const compact = !last && hot !== i && ((compactAll && i > 0 && i < n - 2) || false)
          return (
            <li key={c.id} className="flex min-w-0 animate-[ns-grow-x_.45s_var(--ns-ease-settle)_both] items-center overflow-hidden [transition:max-width_.4s_var(--ns-ease-settle),opacity_.25s] motion-reduce:animate-none" style={{ maxWidth: left ? 0 : 260, opacity: left ? 0 : 1 }}>
              {i > 0 && (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="mx-px size-3 shrink-0 text-[color-mix(in_oklab,var(--foreground)_30%,transparent)] rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              )}
              <button
                type="button"
                aria-current={last ? "page" : undefined}
                aria-label={compact ? c.label : undefined}
                title={c.label}
                onClick={() => !last && onNavigate(i, c)}
                onMouseEnter={() => {
                  if (hot === i) return
                  if (compact) sfx.tone(1300, 0.012, "triangle", 0.018)
                  setHot(i)
                }}
                onFocus={() => setHot(i)}
                className={cn(
                  "flex h-[var(--ns-control-compact)] shrink-0 cursor-pointer items-center gap-[7px] rounded-full text-[length:var(--ns-type-label)] font-medium whitespace-nowrap outline-none [transition:background-color_var(--ns-time-color),color_var(--ns-time-color),padding_.35s_var(--ns-ease-settle)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]",
                  last && "cursor-default bg-[var(--foreground)] text-[var(--background)]",
                  !last && hot === i && "bg-[var(--accent)] text-[var(--foreground)]",
                  !last && hot !== i && "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]",
                  !last && i > 0 && "max-[480px]:px-[9px]"
                )}
                style={{ paddingInline: compact ? 9 : 12 }}
              >
                <CrumbIcon crumb={c} inverted={last} />
                <span className={cn("block overflow-hidden [transition:max-width_.4s_var(--ns-ease-settle),opacity_.25s]", !last && hot !== i && "max-[480px]:max-w-0 max-[480px]:opacity-0")} style={{ maxWidth: compact ? 0 : 180, opacity: compact ? 0 : 1 }}>
                  {c.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
})

export { CapsuleBreadcrumb, type CapsuleBreadcrumbProps }
