"use client"

/**
 * System Bar (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/system-bar
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Collapse } from "@/lib/notchset/collapse"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * System Bar: a full-width bar at the top of a surface that pushes the content down. Maintenance (blue)
 * counts down, Degraded (amber) pulses and links to the status page, Resolved (green) runs a line along
 * its bottom edge for 4s and then closes itself. Switching kind re-reveals the message from a blur.
 */

type BarKind = "maintenance" | "degraded" | "resolved"

interface SystemBarProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  kind: BarKind | null
  message: React.ReactNode
  /** Maintenance: seconds until it starts. */
  countdown?: number | undefined
  /** Degraded: where the status page lives. */
  statusHref?: string | undefined
  onDismiss: () => void
  /** Resolved closes itself after this many ms. */
  autoClose?: number | undefined
  /** The surface under the bar. */
  children?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const TONE: Record<BarKind, string> = {
  maintenance: "var(--info,var(--chart-1))",
  degraded: "var(--warning,var(--chart-4))",
  resolved: "var(--success,var(--foreground))",
}

const SystemBar = React.forwardRef<HTMLDivElement, SystemBarProps>(function SystemBar({ kind, message, countdown, statusHref, onDismiss, autoClose = 4000, children, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [shown, setShown] = React.useState(kind)
  const [reveals, setReveals] = React.useState(0)
  if (kind && kind !== shown) {
    setShown(kind)
    setReveals((n) => n + 1)
  }
  const last = React.useRef(kind)
  React.useEffect(() => {
    const was = last.current
    last.current = kind
    if (kind === was) return
    if (!was && kind) sfx.swooshIn()
    if (was && !kind) sfx.swooshOut()
    if (kind === "degraded") sfx.warn()
    else if (kind === "resolved") sfx.chime()
    else if (kind) sfx.tick()
  }, [kind, sfx])
  const latest = React.useRef(onDismiss)
  React.useEffect(() => {
    latest.current = onDismiss
  })
  React.useEffect(() => {
    if (kind !== "resolved") return
    const t = window.setTimeout(() => latest.current(), autoClose)
    return () => window.clearTimeout(t)
  }, [kind, reveals, autoClose])

  const k = kind ?? shown ?? "maintenance"
  const tone = TONE[k]
  const mmss = countdown === undefined ? "" : `${Math.floor(countdown / 60)}:${String(Math.max(0, countdown) % 60).padStart(2, "0")}`

  return (
    <div ref={ref} data-slot="system-bar" data-notchset="" data-kind={kind ?? undefined} className={cn("overflow-hidden", className)} {...props}>
      <Collapse open={kind !== null}>
        <div
          role={kind === "degraded" ? "alert" : "status"}
          className="relative flex min-h-12 items-center gap-2.5 py-2 ps-4 pe-2 text-[var(--foreground)] [transition:background-color_.45s]"
          style={{ background: `color-mix(in oklab, ${tone} 13%, var(--background))` }}
        >
          <span key={reveals} className="flex min-w-0 flex-1 animate-[ns-reveal_.4s_cubic-bezier(.2,.8,.2,1)_both] flex-wrap items-center gap-x-2.5 gap-y-1 motion-reduce:animate-none">
            <span aria-hidden="true" className="relative size-2 shrink-0 rounded-full" style={{ background: tone }}>
              {k === "degraded" && <span className="absolute inset-0 animate-[ns-live_1.6s_ease-out_infinite] rounded-full motion-reduce:animate-none" style={{ background: tone }} />}
            </span>
            <span className="text-[length:var(--ns-type-label)] font-medium text-pretty">{message}</span>
            {k === "maintenance" && countdown !== undefined && (
              <span className="rounded-[6px] bg-[color-mix(in_oklab,currentColor_12%,transparent)] px-2 py-0.5 font-mono text-[length:var(--ns-type-note)] tabular-nums">
                <NumberFlow value={mmss} />
              </span>
            )}
            {k === "degraded" && statusHref && (
              <a href={statusHref} className="rounded-[4px] text-[length:var(--ns-type-label)] whitespace-nowrap text-[var(--foreground)] underline underline-offset-[3px] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]">
                Status page
              </a>
            )}
          </span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            className="grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-full opacity-70 outline-none [transition:background-color_.2s,opacity_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[color-mix(in_oklab,currentColor_10%,transparent)] hover:opacity-100 focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-90"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          {k === "resolved" && kind && (
            <span key={`p${reveals}`} aria-hidden="true" className="absolute start-0 bottom-0 h-0.5 w-full origin-left animate-[ns-bar-drain_linear_both] bg-current opacity-50 motion-reduce:hidden rtl:origin-right" style={{ animationDuration: `${autoClose}ms` }} />
          )}
        </div>
      </Collapse>
      {children}
    </div>
  )
})

export { SystemBar, type BarKind, type SystemBarProps }
