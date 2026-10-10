"use client"

/**
 * Riding Progress (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/riding-progress
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { RollingLabel } from "@/lib/notchset/shared"
import { pct, useMilestones } from "@/lib/notchset/progress"
import { useSound } from "@/lib/notchset/sound"

/*
 * Riding Progress: a bar whose percentage rides above its leading edge on a little tag, under a stage
 * label that rolls as the work moves on. At 100% the fill and the tag turn green and say Done. It shows
 * the value you give it; each tenth ticks and completion chimes.
 */

interface RidingProgressProps extends React.ComponentPropsWithoutRef<"div"> {
  /** 0–100. */
  value: number
  /** The stage names; `stage` picks the one showing. */
  stages?: readonly React.ReactNode[] | undefined
  stage?: number | undefined
  /** The trailing line, e.g. "23 of 48 files". */
  meta?: React.ReactNode | undefined
  /** The progress bar's accessible name. Default "Progress". */
  label?: string | undefined
  sound?: boolean | undefined
}

const RidingProgress = React.forwardRef<HTMLDivElement, RidingProgressProps>(function RidingProgress(
  { value, stages, stage = 0, meta, label = "Progress", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const v = pct(value)
  const done = v >= 100
  useMilestones(v, done, sfx)
  return (
    <div ref={ref} data-slot="riding-progress" data-notchset="" data-state={done ? "done" : "running"} className={cn("flex w-full flex-col gap-3", className)} {...props}>
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)]">
          {stages && stages.length > 0 ? <RollingLabel align="start" index={Math.max(0, Math.min(stages.length - 1, stage))} rows={stages} /> : label}
        </span>
        {meta != null && <span className="font-mono text-[length:var(--ns-type-note)] whitespace-nowrap text-[var(--muted-foreground)] tabular-nums">{meta}</span>}
      </div>
      <div className="relative pt-[30px]">
        <span aria-hidden="true" className="absolute top-0 flex -translate-x-1/2 flex-col items-center [transition:left_.12s_linear] rtl:translate-x-1/2" style={{ insetInlineStart: `clamp(22px, ${v}%, calc(100% - 22px))` }}>
          <span className={cn("flex items-center gap-1 rounded-[var(--radius)] px-2 py-[3px] font-mono text-[11px] whitespace-nowrap tabular-nums [transition:background-color_.3s,color_.3s]", done ? "bg-[var(--success,var(--foreground))] text-[var(--success-foreground,var(--background))]" : "bg-[var(--foreground)] text-[var(--background)]")}>
            {done ? "✓ Done" : <NumberFlow value={`${Math.floor(v)}%`} />}
          </span>
          <span className={cn("h-[7px] w-[1.5px] [transition:background-color_.3s]", done ? "bg-[var(--success,var(--foreground))]" : "bg-[var(--foreground)]")} />
        </span>
        <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} className="h-1.5 overflow-hidden rounded-[3px] bg-[var(--muted)]">
          <div className={cn("h-full rounded-[3px] [transition:width_.12s_linear,background-color_.3s]", done ? "bg-[var(--success,var(--foreground))]" : "bg-[var(--foreground)]")} style={{ width: `${v}%` }} />
        </div>
      </div>
    </div>
  )
})

export { RidingProgress, type RidingProgressProps }
