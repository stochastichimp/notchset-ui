"use client"

/**
 * Floating Status (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/floating-status
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { CheckBadge, Ring } from "@/lib/notchset/progress"
import { useSound } from "@/lib/notchset/sound"

/*
 * Floating Status: a background job's island that rises out of the button that started it. While it
 * runs it shows a ring, a title, a detail line and the percent; when it's done the ring becomes a green
 * check and an Open button grows in. Open, or dismissAfter passing, folds it back into the button.
 */

type JobStatus = "idle" | "running" | "done"

interface FloatingStatusProps extends React.ComponentPropsWithoutRef<"div"> {
  status: JobStatus
  /** 0–1 while running. */
  progress?: number | undefined
  /** Starts the job (the idle button). */
  onStart: () => void
  /** Opens the result. */
  onOpen?: (() => void) | undefined
  /** Runs when it folds back into the button (Open or the timeout). Set status to idle here. */
  onDismiss: () => void
  label?: React.ReactNode | undefined
  runningTitle?: React.ReactNode | undefined
  doneTitle?: React.ReactNode | undefined
  /** The small line under the title, e.g. "2.1 of 6.4 MB". */
  detail?: React.ReactNode | undefined
  /** How long the done island stays (ms). Default 6000. */
  dismissAfter?: number | undefined
  icon?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const FloatingStatus = React.forwardRef<HTMLDivElement, FloatingStatusProps>(function FloatingStatus(
  { status, progress = 0, onStart, onOpen, onDismiss, label = "Export report", runningTitle = "Exporting report", doneTitle = "Export ready", detail, dismissAfter = 6000, icon, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0))
  const quarter = Math.floor(p * 4)
  const prev = React.useRef({ status, quarter })
  const onDismissRef = React.useRef(onDismiss)
  React.useEffect(() => {
    onDismissRef.current = onDismiss
  })

  React.useEffect(() => {
    const was = prev.current
    if (status === "running" && was.status !== "running") sfx.rise()
    if (status === "running" && quarter > was.quarter && quarter < 4) sfx.tick()
    if (status === "done" && was.status !== "done") sfx.chime()
    if (status === "idle" && was.status === "done") sfx.settle()
    prev.current = { status, quarter }
  }, [status, quarter, sfx])

  React.useEffect(() => {
    if (status !== "done") return
    const t = setTimeout(() => onDismissRef.current(), dismissAfter)
    return () => clearTimeout(t)
  }, [status, dismissAfter])

  const open = status !== "idle"
  const done = status === "done"
  return (
    <div ref={ref} data-slot="floating-status" data-notchset="" data-state={status} className={cn("relative grid h-[52px] place-items-center", className)} {...props}>
      <button
        type="button"
        onClick={onStart}
        tabIndex={open ? -1 : undefined}
        aria-hidden={open || undefined}
        className={cn(
          "col-start-1 row-start-1 inline-flex h-11 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none [transition:opacity_.25s,transform_.35s_cubic-bezier(.2,1.4,.3,1),scale_.35s_cubic-bezier(.2,1.4,.3,1),translate_.35s_cubic-bezier(.2,1.4,.3,1),rotate_.35s_cubic-bezier(.2,1.4,.3,1),background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          open ? "pointer-events-none scale-[.8] opacity-0" : "scale-100 opacity-100"
        )}
      >
        {icon ?? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 10 5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
        )}
        {label}
      </button>
      <div
        role="status"
        aria-live="polite"
        aria-hidden={!open || undefined}
        className={cn(
          "col-start-1 row-start-1 flex h-[52px] items-center gap-2.5 overflow-hidden rounded-[max(var(--radius),16px)] bg-[var(--foreground)] ps-3 pe-2.5 text-[var(--background)] [transition:opacity_var(--ns-time-state),transform_.5s_cubic-bezier(.2,1.4,.3,1),scale_.5s_cubic-bezier(.2,1.4,.3,1),translate_.5s_cubic-bezier(.2,1.4,.3,1),rotate_.5s_cubic-bezier(.2,1.4,.3,1),width_.6s_cubic-bezier(.2,1.15,.3,1)]",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-60 opacity-0",
          done ? "w-[268px]" : open ? "w-[252px]" : "w-[150px]"
        )}
      >
        <span className="relative grid size-[26px] shrink-0 place-items-center">
          <span className={cn("absolute inset-0 [transition:opacity_.25s,transform_.35s,scale_.35s,translate_.35s,rotate_.35s]", done ? "scale-60 opacity-0" : "opacity-100")}>
            <Ring value={p} size={26} trackClassName="stroke-[color-mix(in_oklab,var(--background)_22%,transparent)]" />
          </span>
          <CheckBadge shown={done} size={26} className="absolute inset-0" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[length:var(--ns-type-label)] leading-4 font-semibold">{open ? (done ? doneTitle : runningTitle) : ""}</span>
          {detail != null && <span className="truncate font-mono text-[11px] leading-4 opacity-60">{detail}</span>}
        </span>
        <span aria-hidden={done || undefined} className={cn("overflow-hidden font-mono text-[length:var(--ns-type-note)] whitespace-nowrap tabular-nums [transition:max-width_.35s,margin_.35s,opacity_.2s]", done ? "max-w-0 opacity-0" : "me-2 max-w-12 opacity-100")}>
          {Math.floor(p * 100)}%
        </span>
        <button
          type="button"
          tabIndex={done ? undefined : -1}
          aria-hidden={!done || undefined}
          onClick={() => {
            onOpen?.()
            onDismiss()
          }}
          className={cn(
            "h-[var(--ns-control-compact)] shrink-0 cursor-pointer overflow-hidden rounded-[max(calc(var(--radius)-6px),10px)] bg-[var(--background)] text-[length:var(--ns-type-label)] font-medium whitespace-nowrap text-[var(--foreground)] outline-none [transition:max-width_.45s_var(--ns-ease-reshape),padding_.45s,opacity_.25s,transform_.45s,scale_.45s,translate_.45s,rotate_.45s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[var(--background)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--foreground)]",
            done ? "max-w-20 scale-100 px-3.5 opacity-100" : "pointer-events-none max-w-0 scale-60 px-0 opacity-0"
          )}
        >
          Open
        </button>
      </div>
    </div>
  )
})

export { FloatingStatus, type FloatingStatusProps, type JobStatus }
