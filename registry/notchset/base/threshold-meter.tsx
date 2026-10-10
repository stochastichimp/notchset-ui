"use client"

/**
 * Threshold Meter (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/threshold-meter
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Threshold Meter: usage against a limit with an alert line. Up to the line the fill is solid; past it
 * the extra is hatched, the line pulses and a chip says it's over. At the limit everything turns red
 * and says so. Crossing the line warns; reaching the limit buzzes.
 */

interface ThresholdMeterProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  value: number
  max: number
  /** Where the alert line sits, as a fraction of max. Default 0.8. */
  alertAt?: number | undefined
  title?: React.ReactNode | undefined
  format?: ((n: number) => string) | undefined
  /** Helper lines for each state. */
  helpers?: { ok: React.ReactNode; over: React.ReactNode; limit: React.ReactNode } | undefined
  sound?: boolean | undefined
}

const HELPERS = { ok: "Resets at the top of the hour", over: "Alerts sent to your team", limit: "Requests are paused until the limit resets" }

const ThresholdMeter = React.forwardRef<HTMLDivElement, ThresholdMeterProps>(function ThresholdMeter(
  { value, max, alertAt = 0.8, title = "API requests", format = (n) => Math.round(n).toLocaleString(), helpers = HELPERS, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const cap = Number.isFinite(max) && max > 0 ? max : 1
  const v = Math.max(0, Math.min(cap, Number.isFinite(value) ? value : 0))
  const line = Math.max(0.05, Math.min(0.95, alertAt)) * 100
  const share = (v / cap) * 100
  const over = share >= line
  const limit = share >= 100
  const prev = React.useRef({ over, limit })
  React.useEffect(() => {
    if (limit && !prev.current.limit) sfx.buzz()
    else if (over && !prev.current.over) sfx.warn()
    prev.current = { over, limit }
  }, [over, limit, sfx])

  return (
    <div ref={ref} data-slot="threshold-meter" data-notchset="" data-state={limit ? "limit" : over ? "over" : "ok"} className={cn("flex w-full flex-col gap-3", className)} {...props}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)]">{title}</span>
          <span className="flex items-baseline gap-1.5">
            <span className={cn("font-mono text-[30px] leading-9 font-medium tracking-[-0.03em] tabular-nums [transition:color_.3s]", limit ? "text-[var(--destructive)]" : "text-[var(--foreground)]")}><NumberFlow value={format(v)} /></span>
            <span className="font-mono text-[length:var(--ns-type-note)] whitespace-nowrap text-[var(--muted-foreground)]">of {format(cap)}</span>
          </span>
        </div>
        <span
          aria-hidden={!over || undefined}
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--radius)] border px-2.5 py-1 font-mono text-[11px] whitespace-nowrap [transition:opacity_.25s,transform_.3s,scale_.3s,translate_.3s,rotate_.3s]",
            over ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
            limit ? "border-[var(--destructive)] text-[var(--destructive)]" : "border-[var(--border)] text-[var(--foreground)]"
          )}
        >
          <span className="size-1.5 animate-[ns-pulse_1s_ease-in-out_infinite] rounded-full bg-current" />
          {limit ? "Rate limited" : "Over alert line"}
        </span>
      </div>
      <div className="relative pt-4">
        <span aria-hidden="true" className="absolute top-0 -translate-x-1/2 font-mono text-[10px] whitespace-nowrap text-[var(--muted-foreground)] rtl:translate-x-1/2" style={{ insetInlineStart: `${line}%` }}>
          alert {Math.round(line)}%
        </span>
        <div role="meter" aria-label={typeof title === "string" ? title : "Usage"} aria-valuemin={0} aria-valuemax={cap} aria-valuenow={Math.round(v)} className="relative h-2.5 overflow-hidden rounded-full bg-[var(--muted)]">
          <span className={cn("absolute inset-y-0 start-0 [transition:width_.6s_var(--ns-ease-settle),background-color_.3s]", limit ? "bg-[var(--destructive)]" : "bg-[var(--foreground)]")} style={{ width: `${Math.min(share, line)}%` }} />
          <span
            className={cn(
              "absolute inset-y-0 [transition:width_.6s_var(--ns-ease-settle)]",
              limit ? "bg-[repeating-linear-gradient(135deg,var(--destructive)_0_3px,transparent_3px_6px)]" : "bg-[repeating-linear-gradient(135deg,var(--foreground)_0_3px,transparent_3px_6px)]"
            )}
            style={{ insetInlineStart: `${line}%`, width: `${Math.max(0, share - line)}%` }}
          />
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-3 bottom-[-4px] w-0 -translate-x-1/2 border-s-[1.5px] border-dashed [transition:border-color_var(--ns-time-state)] rtl:translate-x-1/2",
            limit && "border-[var(--destructive)]",
            !limit && over && "animate-[ns-pulse_1s_ease-in-out_infinite] border-[var(--foreground)]",
            !over && "border-[var(--muted-foreground)]"
          )}
          style={{ insetInlineStart: `${line}%` }}
        />
      </div>
      <p className={cn("m-0 text-[length:var(--ns-type-note)]", limit ? "text-[var(--destructive)]" : "text-[var(--muted-foreground)]")} role="status">
        {limit ? helpers.limit : over ? helpers.over : helpers.ok}
      </p>
    </div>
  )
})

export { ThresholdMeter, type ThresholdMeterProps }
