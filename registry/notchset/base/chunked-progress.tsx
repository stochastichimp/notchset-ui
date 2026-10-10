"use client"

/**
 * Chunked Progress (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/chunked-progress
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { pct } from "@/lib/notchset/progress"
import { useSound } from "@/lib/notchset/sound"

/*
 * Chunked Progress: thirty cells that stand up as the work fills them, the leading one pulsing blue
 * while it runs and skipped ones hatched amber. On completion the cells turn green left to right in a
 * wave. Each new cell ticks a little higher.
 */

interface ChunkedProgressProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  /** 0–100. */
  value: number
  /** Cell indexes (0–29) to show as skipped. */
  skipped?: readonly number[] | undefined
  /** Working right now (pulses the leading cell). Default: below 100. */
  running?: boolean | undefined
  /** Above the cells, e.g. "Importing contacts". */
  title?: React.ReactNode | undefined
  /** The trailing count, e.g. "742 / 1,240 rows". */
  count?: React.ReactNode | undefined
  /** Below, e.g. "1,238 imported · 2 skipped" (green when done). */
  note?: React.ReactNode | undefined
  label?: string | undefined
  sound?: boolean | undefined
}

const CELLS = 30

const ChunkedProgress = React.forwardRef<HTMLDivElement, ChunkedProgressProps>(function ChunkedProgress(
  { value, skipped = [], running, title, count, note, label = "Progress", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const v = pct(value)
  const done = v >= 100
  const filled = Math.floor((v / 100) * CELLS)
  const live = running ?? !done
  const last = React.useRef(filled)
  const wasDone = React.useRef(done)
  React.useEffect(() => {
    if (filled > last.current && !done) sfx.cell(filled)
    last.current = filled
  }, [filled, done, sfx])
  React.useEffect(() => {
    if (done && !wasDone.current) sfx.chime()
    wasDone.current = done
  }, [done, sfx])

  return (
    <div ref={ref} data-slot="chunked-progress" data-notchset="" data-state={done ? "done" : "running"} className={cn("flex w-full flex-col gap-3", className)} {...props}>
      {(title != null || count != null) && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)]">{title}</span>
          <span className="font-mono text-[length:var(--ns-type-note)] whitespace-nowrap text-[var(--muted-foreground)] tabular-nums">{typeof count === "string" || typeof count === "number" ? <NumberFlow value={count} /> : count}</span>
        </div>
      )}
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} className="flex h-[22px] gap-[3px]">
        {Array.from({ length: CELLS }, (_, i) => {
          const isFilled = i < filled
          const leading = live && !done && i === filled
          const skip = isFilled && skipped.includes(i)
          return (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                "block flex-1 origin-bottom rounded-[2px] [transition:transform_.4s_cubic-bezier(.2,1.7,.4,1),scale_.4s_cubic-bezier(.2,1.7,.4,1),translate_.4s_cubic-bezier(.2,1.7,.4,1),rotate_.4s_cubic-bezier(.2,1.7,.4,1),background-color_.3s]",
                isFilled || leading ? "scale-y-100" : "scale-y-[.55]",
                leading && "animate-[ns-pulse_.7s_ease-in-out_infinite] bg-[var(--info,var(--foreground))]",
                !leading && !isFilled && "bg-[var(--muted)]",
                skip && "bg-[repeating-linear-gradient(135deg,var(--warning,var(--muted-foreground))_0_2px,transparent_2px_4px)]",
                isFilled && !skip && done && "animate-[ns-cell-wave_.5s_both] bg-[var(--success,var(--foreground))]",
                isFilled && !skip && !done && "bg-[var(--foreground)]"
              )}
              style={done ? { transitionDelay: `${i * 22}ms`, animationDelay: `${i * 18}ms` } : undefined}
            />
          )
        })}
      </div>
      {note != null && (
        <p className={cn("m-0 flex items-center gap-2 font-mono text-[11px] whitespace-nowrap [transition:color_.3s]", done ? "text-[var(--success,var(--foreground))]" : "text-[var(--muted-foreground)]")}>
          {skipped.length > 0 && <span aria-hidden="true" className="block size-2.5 rounded-[2px] bg-[repeating-linear-gradient(135deg,var(--warning,var(--muted-foreground))_0_2px,transparent_2px_4px)]" />}
          {note}
        </p>
      )}
    </div>
  )
})

export { ChunkedProgress, type ChunkedProgressProps }
