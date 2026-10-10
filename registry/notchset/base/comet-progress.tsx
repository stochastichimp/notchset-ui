"use client"

/**
 * Comet Progress (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/comet-progress
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { RollingLabel } from "@/lib/notchset/shared"
import { pct, useMilestones } from "@/lib/notchset/progress"
import { useSound } from "@/lib/notchset/sound"

/*
 * Comet Progress: unknown, then known. While the size is unknown a comet runs along the track; once
 * you pass a value the comet fades and a real fill takes over from zero, turning green when done. The
 * label rolls through the phases you name.
 */

interface CometProgressProps extends React.ComponentPropsWithoutRef<"div"> {
  /** 0–100 once known; null while the total is unknown. */
  value: number | null
  /** Rolling label rows; `phase` picks one. */
  phases?: readonly React.ReactNode[] | undefined
  phase?: number | undefined
  /** The trailing line (elapsed time, bytes). */
  meta?: React.ReactNode | undefined
  /** The line under the track explaining the state. */
  helper?: React.ReactNode | undefined
  label?: string | undefined
  sound?: boolean | undefined
}

const CometProgress = React.forwardRef<HTMLDivElement, CometProgressProps>(function CometProgress(
  { value, phases, phase = 0, meta, helper, label = "Progress", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const known = value != null
  const v = known ? pct(value) : 0
  const done = known && v >= 100
  useMilestones(v, done, sfx)
  return (
    <div ref={ref} data-slot="comet-progress" data-notchset="" data-state={done ? "done" : known ? "determinate" : "indeterminate"} className={cn("flex w-full flex-col gap-3", className)} {...props}>
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)]">{phases && phases.length > 0 ? <RollingLabel align="start" index={Math.max(0, Math.min(phases.length - 1, phase))} rows={phases} /> : label}</span>
        {meta != null && <span className="font-mono text-[length:var(--ns-type-note)] whitespace-nowrap text-[var(--muted-foreground)] tabular-nums">{meta}</span>}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={known ? Math.round(v) : undefined}
        aria-busy={!known || undefined}
        className="relative h-1 overflow-hidden rounded-full bg-[var(--muted)]"
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 start-0 w-[32%] bg-[linear-gradient(90deg,transparent,var(--foreground))] [transition:opacity_var(--ns-time-state)] motion-reduce:w-[40%] motion-reduce:animate-none motion-reduce:bg-[var(--foreground)] rtl:bg-[linear-gradient(270deg,transparent,var(--foreground))]",
            known ? "opacity-0" : "animate-[ns-comet_1.1s_cubic-bezier(.45,0,.3,1)_infinite] opacity-100"
          )}
        />
        <span aria-hidden="true" className={cn("absolute inset-y-0 start-0 rounded-full [transition:width_.2s_linear,background-color_.3s]", done ? "bg-[var(--success,var(--foreground))]" : "bg-[var(--foreground)]")} style={{ width: `${v}%` }} />
      </div>
      {helper != null && <p className="m-0 text-[length:var(--ns-type-note)] text-[var(--muted-foreground)]">{helper}</p>}
    </div>
  )
})

export { CometProgress, type CometProgressProps }
