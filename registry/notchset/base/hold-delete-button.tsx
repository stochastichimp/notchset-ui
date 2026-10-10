"use client"

/**
 * Hold to Delete (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/hold-delete-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, RollingLabel, spoken, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Hold to Delete: press and keep holding. Red fills the button from the start edge over holdMs while
 * the bin's lid lifts and a tone rises; let go early and it springs back. A full hold opens the lid,
 * runs onDelete, and rolls to Deleted with a thud. Space or Enter held works the same as a pointer.
 */

type HoldState = "idle" | "holding" | "deleting" | "done"

interface HoldDeleteButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  /** Runs after a full hold. Return a promise: Deleted shows only when it resolves. */
  onDelete?: (() => unknown) | undefined
  onError?: ((error: unknown) => void) | undefined
  /** Called as the success state shows (after the work resolves and the minimum time), so anything that follows the button lands with it. */
  onSuccess?: (() => void) | undefined
  label?: React.ReactNode | undefined
  doneLabel?: React.ReactNode | undefined
  /** How long the hold takes (ms). Default 1100. */
  holdMs?: number | undefined
  /** How long Deleted shows before the button resets (ms). Default 2000. */
  resetAfter?: number | undefined
  sound?: boolean | undefined
}

function Bin({ state, holdMs }: { state: HoldState; holdMs: number }) {
  const open = state === "deleting" || state === "done"
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 overflow-visible" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <g
        className="origin-[3px_6px] [transform-box:view-box]"
        style={{
          transform: state === "holding" ? "rotate(-16deg)" : open ? "rotate(-34deg) translateY(-1px)" : "rotate(0deg)",
          transitionProperty: "transform",
          transitionDuration: state === "holding" ? `${holdMs}ms` : "450ms",
          transitionTimingFunction: state === "holding" ? "cubic-bezier(.3,0,.2,1)" : "var(--ns-ease-rebound)",
        }}
      >
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </g>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

const HoldDeleteButton = React.forwardRef<HTMLButtonElement, HoldDeleteButtonProps>(function HoldDeleteButton(
  { onDelete, onError, onSuccess, label = "Hold to delete", doneLabel = "Deleted", holdMs = 1100, resetAfter = 2000, sound = true, disabled, className, onKeyDown, onKeyUp, ...props },
  ref
) {
  const { sfx, holdTone } = useSound(sound)
  const timeline = useTimeline()
  const [state, setState] = React.useState<HoldState>("idle")
  const [shakes, setShakes] = React.useState(0)
  const tone = React.useRef<{ stop: () => void } | null>(null)
  const hold = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const hintId = React.useId()
  const duration = Number.isFinite(holdMs) && holdMs > 0 ? holdMs : 1100

  const stopTone = () => {
    tone.current?.stop()
    tone.current = null
  }
  React.useEffect(
    () => () => {
      if (hold.current) clearTimeout(hold.current)
      tone.current?.stop()
    },
    []
  )

  const complete = async () => {
    hold.current = null
    stopTone()
    setState("deleting")
    try {
      await onDelete?.()
    } catch (error) {
      sfx.buzz()
      setShakes((n) => n + 1)
      setState("idle")
      onError?.(error)
      return
    }
    sfx.thud()
    onSuccess?.()
    setState("done")
    timeline.after(resetAfter, () => setState("idle"))
  }

  const press = () => {
    if (state !== "idle" || disabled) return
    setState("holding")
    tone.current = holdTone(duration / 1000)
    hold.current = setTimeout(() => void complete(), duration)
  }
  const release = () => {
    if (state !== "holding" || !hold.current) return
    clearTimeout(hold.current)
    hold.current = null
    stopTone()
    sfx.cancel()
    setState("idle")
  }

  const filled = state !== "idle"
  const row = state === "done" ? 1 : 0
  const content = (
    <span className="flex items-center gap-2">
      <Bin state={state} holdMs={duration} />
      <RollingLabel index={row} rows={[label, doneLabel]} />
    </span>
  )
  return (
    <button
      ref={ref}
      type="button"
      data-slot="hold-delete-button"
      data-notchset=""
      data-state={state}
      aria-describedby={hintId}
      aria-busy={state === "deleting" || undefined}
      disabled={disabled}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.currentTarget.setPointerCapture?.(event.pointerId)
        press()
      }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if ((event.key === " " || event.key === "Enter") && !event.repeat) {
          event.preventDefault()
          press()
        }
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event)
        if (event.key === " " || event.key === "Enter") release()
      }}
      onBlur={release}
      className={cn(
        "relative inline-flex h-11 w-[176px] max-w-full shrink-0 cursor-pointer touch-none items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-4 text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none select-none [-webkit-touch-callout:none] [transition:transform_.3s_var(--ns-ease-press),scale_.3s_var(--ns-ease-press),translate_.3s_var(--ns-ease-press),rotate_.3s_var(--ns-ease-press),background-color_var(--ns-time-color)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[var(--destructive)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        state === "holding" ? "scale-[.97]" : "scale-100",
        className
      )}
      {...props}
    >
      <span key={shakes} className={cn("flex", shakes > 0 && "animate-[ns-shake_.42s]")}>
        {content}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -inset-px flex items-center justify-center rounded-[var(--radius)] bg-[var(--destructive)] text-[var(--destructive-foreground,#fff)]",
          filled ? "[clip-path:inset(0_0_0_0)]" : "[clip-path:inset(0_100%_0_0)] rtl:[clip-path:inset(0_0_0_100%)]",
          state === "holding" && "[transition:clip-path_var(--hold-ms)_linear]",
          state === "idle" && "[transition:clip-path_.45s_cubic-bezier(.2,.8,.2,1)]"
        )}
        style={{ "--hold-ms": `${duration}ms` } as React.CSSProperties}
      >
        {content}
      </span>
      <span id={hintId} className="sr-only">
        Press and hold to delete
      </span>
      <Announcer message={state === "done" ? spoken(doneLabel, "Deleted") : ""} />
    </button>
  )
})

export { HoldDeleteButton, type HoldDeleteButtonProps }
