"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { DrawCheck } from "@/lib/notchset/shared"
import type { Sfx } from "@/lib/notchset/sound"

/*
 * Progress parts: milestone sounds (progress is silent while it waits and speaks only at each
 * tenth and on completion), the ring, the check badge that pops in, and a photo avatar with an
 * initials fallback. Changing numbers roll through NumberFlow (lib/number-flow.tsx).
 */

/** Clamps a 0–100 value (non-finite becomes 0). */
const pct = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0)

/** Plays a decile tick each time progress crosses a tenth, and a chime when it completes. */
function useMilestones(value: number, done: boolean, sfx: Sfx) {
  const decile = React.useRef(Math.floor(pct(value) / 10))
  const wasDone = React.useRef(done)
  React.useEffect(() => {
    const d = Math.floor(pct(value) / 10)
    if (d > decile.current && d < 10) sfx.decile(d)
    decile.current = d
  }, [value, sfx])
  React.useEffect(() => {
    if (done && !wasDone.current) sfx.chime()
    wasDone.current = done
  }, [done, sfx])
}

/** A progress ring: `value` 0–1, the arc in `className`'s stroke colour over a muted track. */
function Ring({ value, size = 22, stroke = 2.5, className, trackClassName }: { value: number; size?: number | undefined; stroke?: number | undefined; className?: string | undefined; trackClassName?: string | undefined }) {
  const r = (size - stroke) / 2
  return (
    <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="shrink-0 -rotate-90" style={{ width: size, height: size }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={cn("stroke-[var(--muted)]", trackClassName)} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        pathLength={1}
        className={cn("stroke-[var(--info,var(--foreground))] [stroke-dasharray:1] [transition:stroke-dashoffset_.3s_linear,stroke_.3s]", className)}
        style={{ strokeDashoffset: 1 - Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)) }}
      />
    </svg>
  )
}

/** A green circle whose check draws in, popping from .4 to full size. */
function CheckBadge({ shown, size = 22, className }: { shown: boolean; size?: number | undefined; className?: string | undefined }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-[var(--success,var(--foreground))] text-[var(--success-foreground,var(--background))] [transition:transform_.45s_cubic-bezier(.2,1.7,.4,1),scale_.45s_cubic-bezier(.2,1.7,.4,1),translate_.45s_cubic-bezier(.2,1.7,.4,1),rotate_.45s_cubic-bezier(.2,1.7,.4,1),opacity_.2s]",
        shown ? "scale-100 opacity-100" : "scale-[.4] opacity-0",
        className
      )}
      style={{ width: size, height: size }}
    >
      <DrawCheck shown={shown} className="size-[55%]" />
    </span>
  )
}

/** A person's photo (as a background, so a dead URL never shows a broken image) over their initials. */
function Avatar({ src, name, size = 32, className }: { src?: string | undefined; name: string; size?: number | undefined; className?: string | undefined }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")
  return (
    <span
      role="img"
      aria-label={name}
      data-slot="avatar"
      className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--muted)] text-[color-mix(in_oklab,var(--muted-foreground)_80%,var(--foreground))] shadow-[0_0_0_1px_var(--border)]", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      <span aria-hidden="true" className="font-medium">
        {initials}
      </span>
      {/* The photo covers the initials; if it fails to load the initials show through. */}
      {src && <span aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${src}")` }} />}
    </span>
  )
}

export { Avatar, CheckBadge, pct, Ring, useMilestones }
