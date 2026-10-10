"use client"

/**
 * Status Pill (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/status-pill
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Status Pill: a connection alert that grows out of a small handle at the top of a surface. Offline it
 * widens into a dark pill with a pulsing red dot and a retry countdown, and a tap opens an explanation
 * with Retry now; reconnecting shows a blue spinner; back online shows a green check before it shrinks
 * back. Size and radius morph (.6s spring) and the contents cross-fade from a blur. SyncChip mirrors it.
 */

type ConnectionStatus = "idle" | "offline" | "reconnecting" | "online"

interface StatusPillProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  status: ConnectionStatus
  /** Offline: seconds until the next automatic retry. */
  retryIn?: number | undefined
  onRetry: () => void
  /** The explanation when expanded. */
  detail?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const SIZE: Record<ConnectionStatus, [number, number]> = { idle: [44, 6], offline: [214, 38], reconnecting: [176, 38], online: [160, 38] }

const StatusPill = React.forwardRef<HTMLDivElement, StatusPillProps>(function StatusPill({ status, retryIn, onRetry, detail = "Edits are saved on this device and sync when you reconnect.", sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [open, setOpen] = React.useState(false)
  const expanded = open && status === "offline"
  if (open && status !== "offline") setOpen(false)
  const last = React.useRef(status)
  React.useEffect(() => {
    const was = last.current
    last.current = status
    if (was === status) return
    if (status === "offline") sfx.offline()
    else if (status === "reconnecting") sfx.online()
    else if (status === "online") sfx.chime()
  }, [status, sfx])

  const [w, h] = expanded ? [296, 142] : SIZE[status]
  const label = status === "offline" ? `Offline${retryIn !== undefined ? `, retrying in ${retryIn} seconds` : ""}` : status === "reconnecting" ? "Reconnecting" : status === "online" ? "Back online" : "Connected"

  return (
    <div ref={ref} data-slot="status-pill" data-notchset="" data-status={status} className={cn("pointer-events-none absolute inset-x-0 top-3 z-[2] flex justify-center", className)} {...props}>
      <span aria-live="polite" className="sr-only">
        {label}
      </span>
      <div
        className={cn("pointer-events-auto relative max-w-[calc(100%-24px)] overflow-hidden text-[var(--background)] [transition:width_.6s_cubic-bezier(.2,1.2,.3,1),height_.6s_cubic-bezier(.2,1.2,.3,1),border-radius_.6s_cubic-bezier(.2,1.2,.3,1),background-color_.3s] motion-reduce:transition-none", status === "idle" ? "bg-[var(--border)]" : "bg-[var(--foreground)] shadow-[0_14px_30px_-14px_rgba(0,0,0,.5)]")}
        style={{ width: w, height: h, borderRadius: status === "idle" ? 3 : expanded ? 24 : 19 }}
      >
        {status === "offline" && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => {
              if (expanded) sfx.close()
              else sfx.open()
              setOpen(!expanded)
            }}
            className="absolute inset-x-0 top-0 flex h-[38px] w-full animate-[ns-reveal_.35s_both] cursor-pointer items-center gap-2 px-3.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-inset"
          >
            <span aria-hidden="true" className="size-2 animate-[ns-pulse_1.2s_ease-in-out_infinite] rounded-full bg-[var(--destructive)] motion-reduce:animate-none" />
            Offline
            {retryIn !== undefined && (
              <span className="ms-auto font-mono text-[length:var(--ns-type-note)] opacity-70">
                retry in <NumberFlow value={retryIn} />
              </span>
            )}
          </button>
        )}
        {expanded && (
          <span className="absolute inset-x-4 top-[46px] flex animate-[ns-reveal_.4s_.12s_both] flex-col gap-2.5 text-start">
            <span className="text-[length:var(--ns-type-label)] leading-[var(--ns-leading-prose)] whitespace-normal opacity-75">{detail}</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onRetry()
              }}
              className="inline-flex h-[var(--ns-control-compact)] cursor-pointer items-center self-start rounded-full bg-[var(--background)] px-3.5 text-[length:var(--ns-type-label)] font-medium text-[var(--foreground)] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
            >
              Retry now
            </button>
          </span>
        )}
        {status === "reconnecting" && (
          <span aria-hidden="true" className="absolute inset-0 flex animate-[ns-reveal_.35s_both] items-center justify-center gap-2 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap">
            <span className="size-[13px] animate-[ns-spin_.7s_linear_infinite] rounded-full border-2 border-[var(--info,var(--chart-1))] border-e-transparent" />
            Reconnecting
          </span>
        )}
        {status === "online" && (
          <span aria-hidden="true" className="absolute inset-0 flex animate-[ns-reveal_.35s_both] items-center justify-center gap-[7px] text-[length:var(--ns-type-label)] font-medium whitespace-nowrap">
            <span className="grid size-[18px] place-items-center rounded-full bg-[var(--success,var(--background))] text-[var(--success-foreground,var(--foreground))]">
              <svg viewBox="0 0 24 24" className="size-[11px]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            Back online
          </span>
        )}
      </div>
    </div>
  )
})

/** A chip in the page that mirrors the connection: saved locally, syncing, synced. */
function SyncChip({ status, labels, className }: { status: ConnectionStatus; labels?: Partial<Record<ConnectionStatus, React.ReactNode>> | undefined; className?: string | undefined }) {
  const tone = status === "offline" ? "var(--warning,var(--chart-4))" : status === "reconnecting" ? "var(--info,var(--chart-1))" : status === "online" ? "var(--success,var(--foreground))" : "var(--muted-foreground)"
  const text = { idle: "Saved", offline: "Saved on this device", reconnecting: "Syncing…", online: "Synced", ...labels }[status]
  return (
    <span
      data-slot="sync-chip"
      className={cn("inline-flex h-[26px] items-center gap-1.5 self-start rounded-full px-2.5 text-[length:var(--ns-type-note)] font-medium [transition:background-color_.4s,color_.4s]", className)}
      style={{ background: `color-mix(in oklab, ${tone} 14%, transparent)`, color: `color-mix(in oklab, ${tone} 72%, var(--foreground))` }}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {text}
    </span>
  )
}

export { StatusPill, SyncChip, type ConnectionStatus, type StatusPillProps }
