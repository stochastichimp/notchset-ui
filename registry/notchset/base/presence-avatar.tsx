"use client"

/**
 * Presence Avatar (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/presence-avatar
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * Presence Avatar: a photo or tinted initials in four sizes with a status dot that changes shape
 * rather than icon. One dot holds three inner shapes in the card colour that scale in and out: none
 * for online (solid green), a crescent bite for away (amber), a bar for busy (red), a ring for offline.
 * It lifts 2px on hover when it's a button.
 */

type Presence = "online" | "away" | "busy" | "offline"

interface PresenceAvatarProps extends Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  name: string
  src?: string | undefined
  size?: 28 | 36 | 48 | 64 | undefined
  status?: Presence | undefined
  /** The initials' tint when there's no photo. */
  color?: string | undefined
}

const DOT: Record<number, { d: number; bite: number; off: number; bar: number; ring: number; edge: number }> = {
  28: { d: 9, bite: 7, off: -1, bar: 2, ring: 2, edge: -1 },
  36: { d: 11, bite: 9, off: -1, bar: 2, ring: 3, edge: -1 },
  48: { d: 15, bite: 11, off: -2, bar: 3, ring: 3, edge: 0 },
  64: { d: 19, bite: 15, off: -2, bar: 4, ring: 5, edge: 1 },
}
const COLOR: Record<Presence, string> = { online: "var(--success,var(--chart-3))", away: "var(--warning,var(--chart-4))", busy: "var(--destructive)", offline: "var(--muted-foreground)" }
const LABEL: Record<Presence, string> = { online: "online", away: "away", busy: "busy", offline: "offline" }

const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

const PresenceAvatar = React.forwardRef<HTMLSpanElement, PresenceAvatarProps>(function PresenceAvatar({ name, src, size = 36, status, color = "var(--chart-2)", className, style, ...props }, ref) {
  const k = DOT[size]!
  return (
    <span
      ref={ref}
      role="img"
      aria-label={status ? `${name}, ${LABEL[status]}` : name}
      data-slot="presence-avatar"
      data-notchset=""
      className={cn("relative inline-grid shrink-0 place-items-center rounded-full bg-cover bg-center font-[650] shadow-[0_0_0_1px_var(--border)]", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        backgroundImage: src ? `url(${src})` : undefined,
        backgroundColor: src ? "var(--muted)" : `color-mix(in oklab, ${color} 18%, var(--background))`,
        color: `color-mix(in oklab, ${color} 55%, var(--foreground))`,
        ...style,
      }}
      {...props}
    >
      {!src && <span aria-hidden="true">{initials(name)}</span>}
      {status && (
        <span
          aria-hidden="true"
          className="absolute overflow-hidden rounded-full shadow-[0_0_0_2px_var(--card,var(--background))] [transition:background-color_.35s]"
          style={{ width: k.d, height: k.d, insetInlineEnd: k.edge, bottom: k.edge, background: COLOR[status] }}
        >
          <span
            className="absolute rounded-full bg-[var(--card,var(--background))] [transition:scale_.45s_cubic-bezier(.2,1.4,.4,1)] motion-reduce:transition-none"
            style={{ width: k.bite, height: k.bite, insetInlineStart: k.off, top: k.off, transformOrigin: "20% 20%", scale: status === "away" ? "1" : "0" }}
          />
          <span className="absolute inset-x-[24%] top-1/2 rounded-[2px] bg-[var(--card,var(--background))] [transition:scale_.45s_cubic-bezier(.2,1.4,.4,1)] motion-reduce:transition-none" style={{ height: k.bar, marginTop: -k.bar / 2, scale: status === "busy" ? "1 1" : "0 1" }} />
          <span className="absolute rounded-full bg-[var(--card,var(--background))] [transition:scale_.45s_cubic-bezier(.2,1.4,.4,1)] motion-reduce:transition-none" style={{ inset: k.ring, scale: status === "offline" ? "1" : "0" }} />
        </span>
      )}
    </span>
  )
})

export { PresenceAvatar, type Presence, type PresenceAvatarProps }
