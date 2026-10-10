"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { inertRef } from "@/lib/notchset/shared"

/*
 * Pane Stack: steps that share one grid cell. The shown pane fades and slides in from the side it comes
 * from (24px); the others fade out, slide the other way and turn invisible once they're gone, so they're
 * out of the tab order and the accessibility tree.
 */

interface PaneStackProps extends React.ComponentPropsWithoutRef<"div"> {
  /** The index shown. */
  index: number
  /** One node per pane. */
  panes: readonly React.ReactNode[]
  /** How far a pane slides, px. */
  distance?: number | undefined
  /** Slide along x (steps) or y (a flow). */
  axis?: "x" | "y" | undefined
}

function PaneStack({ index, panes, distance = 24, axis = "x", className, ...props }: PaneStackProps) {
  return (
    <div data-slot="pane-stack" className={cn("grid", className)} {...props}>
      {panes.map((pane, i) => {
        const on = i === index
        const off = (i < index ? -1 : 1) * distance
        return (
          <div
            key={i}
            ref={inertRef(!on)}
            aria-hidden={!on || undefined}
            className={cn(
              "flex min-w-0 flex-col [grid-area:1/1] [transition:opacity_var(--ns-time-state),translate_.5s_var(--ns-ease-settle),visibility_0s_linear] motion-reduce:transition-none",
              on ? "pointer-events-auto visible opacity-100 [transition-delay:0s]" : "pointer-events-none invisible opacity-0 [transition-delay:0s,0s,.5s]"
            )}
            style={{ translate: on ? "0 0" : axis === "x" ? `${off}px 0` : `0 ${off}px` }}
          >
            {pane}
          </div>
        )
      })}
    </div>
  )
}

export { PaneStack, type PaneStackProps }
