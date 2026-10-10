"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useIsomorphicLayoutEffect } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Inchworm Tabs' shared parts (both builds use them): the measured indicator whose leading edge moves
 * first and trailing edge follows 110ms later, the icons that animate as their tab becomes active, and
 * the two ticks that match the edges.
 */

type InchwormIcon = "list" | "board" | "timeline"

interface InchwormItem {
  value: string
  label: React.ReactNode
  /** A built-in animated icon, or your own node (static). */
  icon?: InchwormIcon | React.ReactNode | undefined
}

const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const

/** The icon for a tab; built-in icons replay their draw-in when `active` turns on (keyed by `play`). */
function InchwormGlyph({ icon, active, play }: { icon: InchwormItem["icon"]; active: boolean; play: number }) {
  if (icon === "list")
    return (
      <svg key={active ? play : "off"} {...svg} aria-hidden="true" className="size-[15px] shrink-0 overflow-visible">
        <path d="M3 5h.01" />
        <path d="M3 12h.01" />
        <path d="M3 19h.01" />
        {["M8 5h13", "M8 12h13", "M8 19h13"].map((d, i) => (
          <path key={d} d={d} pathLength={1} className={cn(active && "animate-[ns-drawl_.42s_cubic-bezier(.6,0,.2,1)_both] [stroke-dasharray:1]")} style={active ? { animationDelay: `${i * 70}ms` } : undefined} />
        ))}
      </svg>
    )
  if (icon === "board")
    return (
      <svg key={active ? play : "off"} {...svg} aria-hidden="true" className="size-[15px] shrink-0 overflow-visible">
        {["M5 3v14", "M12 3v8", "M19 3v18"].map((d, i) => (
          <path key={d} d={d} className={cn(active && "origin-top animate-[ns-growy_.5s_cubic-bezier(.2,1.5,.3,1)_both] [transform-box:fill-box]")} style={active ? { animationDelay: `${i * 70}ms` } : undefined} />
        ))}
      </svg>
    )
  if (icon === "timeline")
    return (
      <svg key={active ? play : "off"} {...svg} aria-hidden="true" className="size-[15px] shrink-0 overflow-visible">
        {["M8 6h10", "M6 12h9", "M11 18h7"].map((d, i) => (
          <path key={d} d={d} className={cn(active && "animate-[ns-slidex_.45s_cubic-bezier(.2,1.4,.3,1)_both]")} style={active ? { animationDelay: `${i * 70}ms` } : undefined} />
        ))}
      </svg>
    )
  return icon ? <span className="inline-flex shrink-0 [&_svg]:size-[15px]">{icon}</span> : null
}

/** Value state (controlled or not), the measured indicator edges, and the pick sound. */
function useInchworm({ items, value, defaultValue, onValueChange, sound }: { items: readonly InchwormItem[]; value?: string | undefined; defaultValue?: string | undefined; onValueChange?: ((value: string) => void) | undefined; sound: boolean }) {
  const { sfx } = useSound(sound)
  const [inner, setInner] = React.useState(defaultValue ?? items[0]?.value ?? "")
  const current = value ?? inner
  const list = React.useRef<HTMLDivElement>(null)
  const [edges, setEdges] = React.useState<{ left: number; right: number; forward: boolean } | null>(null)
  const [play, setPlay] = React.useState(0)

  const measure = React.useCallback(() => {
    const el = list.current
    const tab = el ? Array.from(el.querySelectorAll<HTMLElement>("[data-inchworm-value]")).find((node) => node.dataset.inchwormValue === current) : undefined
    if (!el || !tab) return
    const left = tab.offsetLeft
    const right = el.clientWidth - tab.offsetLeft - tab.offsetWidth
    setEdges((prev) => (prev && prev.left === left && prev.right === right ? prev : { left, right, forward: prev ? left > prev.left : true }))
  }, [current])

  useIsomorphicLayoutEffect(measure, [measure])
  React.useEffect(() => {
    const el = list.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure])

  const select = (next: string) => {
    if (next === current) return
    const index = items.findIndex((item) => item.value === next)
    sfx.tone(640 + index * 110, 0.03, "triangle", 0.04)
    sfx.tone(760 + index * 110, 0.03, "triangle", 0.03, 0.11)
    setPlay((n) => n + 1)
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }
  return { current, list, edges, play, select }
}

/** The indicator: physical left and right, the edge in the direction of travel first. */
function InchwormIndicator({ edges }: { edges: { left: number; right: number; forward: boolean } | null }) {
  if (!edges) return null
  return (
    <span
      aria-hidden="true"
      data-slot="inchworm-tabs-indicator"
      className="motion-reduce:transition-none! pointer-events-none absolute inset-y-1 rounded-[max(calc(var(--radius)-4px),2px)] bg-[var(--background)] shadow-[0_1px_2px_rgba(0,0,0,.08),0_0_0_1px_var(--border)]"
      style={{
        left: edges.left,
        right: edges.right,
        transition: edges.forward
          ? "left .45s cubic-bezier(.3,1.25,.4,1) .11s, right .45s cubic-bezier(.3,1.25,.4,1) 0s"
          : "left .45s cubic-bezier(.3,1.25,.4,1) 0s, right .45s cubic-bezier(.3,1.25,.4,1) .11s",
      }}
    />
  )
}

export { InchwormGlyph, InchwormIndicator, useInchworm, type InchwormIcon, type InchwormItem }
