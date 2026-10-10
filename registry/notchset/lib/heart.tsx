"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * The heart of every like: the path, and the burst of four small hearts that float off when something
 * is liked (ns-float .9s, turned −28°, 12°, −8° and 30°, 60ms apart). Key the burst by the like count so
 * it restarts on every like. Colour comes from --heart, falling back to --destructive.
 */

const HEART = "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
const MINIS = [
  { x: -4, turn: "-28deg" },
  { x: 6, turn: "12deg" },
  { x: 12, turn: "-8deg" },
  { x: 2, turn: "30deg" },
]

function HeartIcon({ filled = true, className }: { filled?: boolean | undefined; className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-[22px]", className)} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={HEART} />
    </svg>
  )
}

/** Four small hearts floating up from the top-left of their (relative) parent. */
function HeartBurst({ className }: { className?: string | undefined }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0 text-[var(--heart,var(--destructive))] motion-reduce:hidden", className)}>
      {MINIS.map((m, i) => (
        <svg
          key={m.turn}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="absolute -top-0.5 size-3 animate-[ns-float_.9s_cubic-bezier(.2,.8,.2,1)_both]"
          style={{ insetInlineStart: m.x, animationDelay: `${i * 60}ms`, "--r": m.turn } as React.CSSProperties}
        >
          <path d={HEART} />
        </svg>
      ))}
    </span>
  )
}

export { HEART, HeartBurst, HeartIcon }
