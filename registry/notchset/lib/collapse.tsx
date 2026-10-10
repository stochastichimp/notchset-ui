"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { inertRef } from "@/lib/notchset/shared"

/*
 * The disclosure parts every accordion shares: Collapse animates height with grid rows (0fr ↔ 1fr, .5s)
 * and makes closed content inert; accordionKeys moves focus between a container's triggers with ↑/↓,
 * Home and End, as the WAI-ARIA accordion pattern asks.
 */

interface CollapseProps extends React.ComponentPropsWithoutRef<"div"> {
  open: boolean
  /** Delay before the height moves, ms (for cascades). */
  delay?: number | undefined
  /** The trigger's id, for the region's name. */
  labelledBy?: string | undefined
}

function Collapse({ open, delay = 0, labelledBy, className, style, children, ...props }: CollapseProps) {
  return (
    <div
      role={labelledBy ? "region" : undefined}
      aria-labelledby={labelledBy}
      className={cn("grid [transition:grid-template-rows_.5s_var(--ns-ease-settle)] motion-reduce:transition-none", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]", className)}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}
      {...props}
    >
      <div ref={inertRef(!open)} className="min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

/** On an accordion's container: ↑/↓ move between its [data-accordion-trigger] buttons, Home and End jump. */
function accordionKeys(event: React.KeyboardEvent<HTMLElement>) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return
  const own = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-accordion-trigger]")).filter((el) => el.closest("[inert]") === null)
  const at = own.indexOf(document.activeElement as HTMLElement)
  if (at < 0) return
  event.preventDefault()
  const next = event.key === "Home" ? 0 : event.key === "End" ? own.length - 1 : (at + (event.key === "ArrowDown" ? 1 : -1) + own.length) % own.length
  own[next]?.focus()
}

/** One-open or many-open state for a list of ids, controlled or not. */
function useOpenSet({ type, value, defaultValue = [], onValueChange }: { type: "single" | "multiple"; value?: readonly string[] | undefined; defaultValue?: readonly string[] | undefined; onValueChange?: ((open: string[]) => void) | undefined }) {
  const [inner, setInner] = React.useState<readonly string[]>(defaultValue)
  const open = value ?? inner
  const set = (next: string[]) => {
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }
  const toggle = (id: string) => {
    const on = open.includes(id)
    set(on ? open.filter((x) => x !== id) : type === "single" ? [id] : [...open, id])
    return !on
  }
  return { open, toggle, set }
}

export { accordionKeys, Collapse, useOpenSet, type CollapseProps }
