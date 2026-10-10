"use client"

/**
 * Archive + Undo (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/archive-undo
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, RollingLabel, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Archive + undo: archives right away (the item slides out) and turns the button into a countdown ring
 * and Undo for `undoWindow` ms. Pressing it in that window brings the item back; when the ring runs out
 * the archive commits (onCommit) and the label settles on where the item went.
 */

type ArchiveState = "idle" | "pending" | "done"

interface ArchiveUndoProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title" | "children"> {
  /** The item's name. */
  title: React.ReactNode
  /** One line under the name. */
  description?: React.ReactNode | undefined
  /** Shows the unread dot. */
  unread?: boolean | undefined
  /** Called when the item is archived (optimistically) and when it is restored. */
  onArchivedChange?: ((archived: boolean) => void) | undefined
  /** Called when the undo window closes: commit the archive here. */
  onCommit?: (() => void) | undefined
  /** How long Undo is offered, in ms. Default 5000. */
  undoWindow?: number | undefined
  /** Returns to idle this many ms after committing (for demos and reusable rows). Default never. */
  resetAfter?: number | undefined
  label?: React.ReactNode | undefined
  doneLabel?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const ArchiveUndo = React.forwardRef<HTMLDivElement, ArchiveUndoProps>(function ArchiveUndo(
  { title, description, unread = true, onArchivedChange, onCommit, undoWindow = 5000, resetAfter, label = "Archive", doneLabel = "Moved to Archive", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [state, setState] = React.useState<ArchiveState>("idle")
  const [restored, setRestored] = React.useState(0)

  const press = () => {
    if (state === "done") return
    if (state === "pending") {
      timeline.clear()
      sfx.rewind()
      timeline.after(120, () => sfx.pop())
      setState("idle")
      setRestored((n) => n + 1)
      onArchivedChange?.(false)
      return
    }
    sfx.paper()
    setState("pending")
    onArchivedChange?.(true)
    timeline.after(undoWindow, () => {
      sfx.softTick()
      setState("done")
      onCommit?.()
      if (resetAfter != null) timeline.after(resetAfter, () => setState("idle"))
    })
  }

  const seconds = Math.round(undoWindow / 1000)

  return (
    <div ref={ref} data-slot="archive-undo" data-notchset="" data-state={state} className={cn("flex flex-col items-center gap-4", className)} {...props}>
      <div
        data-slot="archive-item"
        aria-hidden={state !== "idle" || undefined}
        className={cn(
          "flex w-[268px] max-w-full items-center gap-3 rounded-[min(var(--radius),14px)] border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 [transition:opacity_.35s,transform_.55s_cubic-bezier(.2,1.1,.3,1),scale_.55s_cubic-bezier(.2,1.1,.3,1),translate_.55s_cubic-bezier(.2,1.1,.3,1),rotate_.55s_cubic-bezier(.2,1.1,.3,1)]",
          state === "idle" ? "translate-x-0 scale-100 opacity-100" : "translate-x-14 scale-[.96] opacity-0 rtl:-translate-x-14"
        )}
      >
        {unread && (
          <span className="block size-[7px] shrink-0 rounded-full bg-[var(--foreground)]">
            <span className="sr-only">Unread: </span>
          </span>
        )}
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[length:var(--ns-type-label)] font-medium text-[var(--foreground)]">{title}</span>
          {description && <span className="truncate text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{description}</span>}
        </span>
      </div>
      <button
        type="button"
        aria-disabled={state === "done"}
        aria-label={state === "pending" ? `Archived. Undo, ${seconds} seconds` : undefined}
        onClick={press}
        className="inline-flex h-11 w-[184px] max-w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      >
        <RollingLabel
          index={state === "idle" ? 0 : state === "pending" ? 1 : 2}
          rows={[
            <React.Fragment key="1">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="5" x="2" y="3" rx="1" />
                <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                <path d="M10 12h4" />
              </svg>
              {label}
            </React.Fragment>,
            <React.Fragment key="2">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 shrink-0 -rotate-90">
                <circle cx="10" cy="10" r="7" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                <circle
                  key={`${state}-${restored}`}
                  cx="10"
                  cy="10"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1"
                  className={cn(state === "pending" ? "animate-[ns-drawl_linear_reverse_both]" : "[stroke-dashoffset:0]")}
                  style={state === "pending" ? { animationDuration: `${undoWindow}ms` } : undefined}
                />
              </svg>
              <span>Archived</span>
              <span aria-hidden="true" className="block h-3.5 w-px bg-[var(--border)]" />
              <span className="font-semibold underline underline-offset-[3px]">Undo</span>
            </React.Fragment>,
            <React.Fragment key="3">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {doneLabel}
            </React.Fragment>,
          ]}
        />
      </button>
      <Announcer message={state === "pending" ? `Archived. Press again within ${seconds} seconds to undo.` : state === "done" ? (typeof doneLabel === "string" ? doneLabel : "Archived") : restored > 0 ? "Restored" : ""} />
    </div>
  )
})

export { ArchiveUndo, type ArchiveState, type ArchiveUndoProps }
