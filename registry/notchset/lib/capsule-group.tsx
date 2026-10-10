"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * The button-group capsule every group shares: a 44px pill shell, one --accent hover slab that glides
 * to the hovered segment and fades when the pointer leaves, and the burst (a ring plus six particles)
 * that the reactions use.
 */

/** Track the hovered segment's box; spread `enter` on each segment and `leave` on the group. */
function useHoverPill() {
  const [box, setBox] = React.useState({ left: 0, width: 0, on: false })
  const enter = (e: React.SyntheticEvent<HTMLElement>) => {
    const el = e.currentTarget
    setBox({ left: el.offsetLeft, width: el.offsetWidth, on: true })
  }
  const leave = () => setBox((b) => (b.on ? { ...b, on: false } : b))
  return { box, enter, leave }
}

function HoverPill({ box }: { box: { left: number; width: number; on: boolean } }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-1 h-[34px] rounded-full bg-[var(--accent)] [transition:left_.38s_cubic-bezier(.2,1.25,.3,1),width_.38s_cubic-bezier(.2,1.25,.3,1),opacity_.2s] motion-reduce:transition-none"
      style={{ left: box.left, width: box.width, opacity: box.on ? 1 : 0 }}
    />
  )
}

/** A ring and six particles from the centre of a relative parent, alternating two colours. */
function ParticleBurst({ color = "var(--heart,var(--chart-5))", alt = "var(--chart-4)", className }: { color?: string | undefined; alt?: string | undefined; className?: string | undefined }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute start-1/2 top-1/2 size-0 motion-reduce:hidden", className)}>
      <span className="absolute -start-[9px] -top-[9px] size-[18px] animate-[ns-ring-burst_.5s_cubic-bezier(.2,.8,.3,1)_both] rounded-full border-2" style={{ borderColor: color }} />
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <span key={a} className="absolute start-0 top-0" style={{ transform: `rotate(${a}deg)` }}>
          <span className="absolute -start-[2.5px] -top-[2.5px] size-[5px] animate-[ns-part_.6s_cubic-bezier(.2,.8,.3,1)_both] rounded-full" style={{ background: i % 2 ? alt : color }} />
        </span>
      ))}
    </span>
  )
}

export { HoverPill, ParticleBurst, useHoverPill }
