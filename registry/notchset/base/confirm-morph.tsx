"use client"

/**
 * Confirm Morph (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/confirm-morph
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, DrawCheck, RollingLabel, spoken, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Confirm Morph: one button that splits into Keep and Discard when pressed, the two sliding in from the
 * centre, and cancels itself after `timeout` if nobody chooses. Focus moves to Keep when it asks and back
 * to the button when it closes, so a keyboard user is never left on a hidden control.
 */

type ConfirmState = "idle" | "asking" | "working" | "done"

interface ConfirmMorphProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  /** Runs on Discard. Return a promise: the done label shows only when it resolves. */
  onConfirm?: (() => unknown) | undefined
  /** Runs on Keep and when the question times out. */
  onCancel?: (() => void) | undefined
  onError?: ((error: unknown) => void) | undefined
  /** Called as the success state shows (after the work resolves and the minimum time), so anything that follows the button lands with it. */
  onSuccess?: (() => void) | undefined
  /** Seconds left while it asks (null when it isn't asking), for a countdown line. */
  onCountdown?: ((secondsLeft: number | null) => void) | undefined
  label?: React.ReactNode | undefined
  confirmLabel?: React.ReactNode | undefined
  cancelLabel?: React.ReactNode | undefined
  doneLabel?: React.ReactNode | undefined
  /** How long it waits for a choice (ms). Default 4000. */
  timeout?: number | undefined
  /** How long the done label shows (ms). Default 2200. */
  resetAfter?: number | undefined
  disabled?: boolean | undefined
  sound?: boolean | undefined
}

const ConfirmMorph = React.forwardRef<HTMLDivElement, ConfirmMorphProps>(function ConfirmMorph(
  {
    onConfirm,
    onCancel,
    onError,
    onSuccess,
    onCountdown,
    label = "Discard changes",
    confirmLabel = "Discard",
    cancelLabel = "Keep",
    doneLabel = "Changes discarded",
    timeout = 4000,
    resetAfter = 2200,
    disabled,
    sound = true,
    className,
    ...props
  },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [state, setState] = React.useState<ConfirmState>("idle")
  const main = React.useRef<HTMLButtonElement>(null)
  const keep = React.useRef<HTMLButtonElement>(null)
  const countdown = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const onCountdownRef = React.useRef(onCountdown)
  React.useEffect(() => {
    onCountdownRef.current = onCountdown
  })

  const stopCountdown = () => {
    if (countdown.current) clearInterval(countdown.current)
    countdown.current = null
    onCountdownRef.current?.(null)
  }
  React.useEffect(() => () => {
    if (countdown.current) clearInterval(countdown.current)
  }, [])

  const cancel = (returnFocus: boolean) => {
    stopCountdown()
    sfx.drop()
    setState("idle")
    onCancel?.()
    if (returnFocus) requestAnimationFrame(() => main.current?.focus())
  }

  const ask = () => {
    if (state !== "idle" || disabled) return
    sfx.tick()
    sfx.uhOh()
    setState("asking")
    let left = Math.max(1, Math.round(timeout / 1000))
    onCountdownRef.current?.(left)
    countdown.current = setInterval(() => {
      left -= 1
      if (left <= 0) {
        const focusWasInside = keep.current?.parentElement?.contains(document.activeElement) ?? false
        cancel(focusWasInside)
      } else onCountdownRef.current?.(left)
    }, 1000)
    requestAnimationFrame(() => keep.current?.focus())
  }

  const confirm = async () => {
    if (state !== "asking") return
    stopCountdown()
    sfx.thud()
    setState("working")
    requestAnimationFrame(() => main.current?.focus())
    try {
      await onConfirm?.()
    } catch (error) {
      sfx.buzz()
      setState("idle")
      onError?.(error)
      return
    }
    onSuccess?.()
    setState("done")
    timeline.after(resetAfter, () => setState("idle"))
  }

  const asking = state === "asking"
  return (
    <div
      ref={ref}
      data-slot="confirm-morph"
      data-notchset=""
      data-state={state}
      className={cn("relative h-11 max-w-full [transition:width_.5s_cubic-bezier(.2,1.2,.3,1)]", asking ? "w-[240px]" : "w-[204px]", className)}
      {...props}
    >
      <button
        ref={main}
        type="button"
        data-slot="confirm-morph-trigger"
        aria-hidden={asking || undefined}
        tabIndex={asking ? -1 : undefined}
        disabled={disabled}
        aria-busy={state === "working" || undefined}
        onClick={ask}
        className={cn(
          "absolute inset-0 inline-flex cursor-pointer items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none select-none [transition:transform_.35s_var(--ns-ease-reshape),scale_.35s_var(--ns-ease-reshape),translate_.35s_var(--ns-ease-reshape),rotate_.35s_var(--ns-ease-reshape),opacity_.2s,background-color_var(--ns-time-color)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          asking ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100 not-disabled:active:scale-[var(--ns-press-depth)]"
        )}
      >
        <RollingLabel
          index={state === "done" ? 1 : 0}
          rows={[
            <span key="ask" className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
              {label}
            </span>,
            <span key="done" className="flex items-center gap-2">
              <DrawCheck shown={state === "done"} />
              {doneLabel}
            </span>,
          ]}
        />
      </button>
      <div data-slot="confirm-morph-choices" aria-hidden={!asking || undefined} className={cn("absolute inset-0 flex gap-1.5 [transition:opacity_.2s]", asking ? "opacity-100" : "pointer-events-none opacity-0")}>
        <button
          ref={keep}
          type="button"
          tabIndex={asking ? undefined : -1}
          onClick={() => cancel(true)}
          className={cn(
            "inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3.5 text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none select-none [transition:transform_.5s_var(--ns-ease-reshape),scale_.5s_var(--ns-ease-reshape),translate_.5s_var(--ns-ease-reshape),rotate_.5s_var(--ns-ease-reshape),background-color_var(--ns-time-color)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
            asking ? "translate-x-0" : "translate-x-10 rtl:-translate-x-10"
          )}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          tabIndex={asking ? undefined : -1}
          onClick={() => void confirm()}
          className={cn(
            "inline-flex h-11 flex-[1.35] cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-transparent bg-[var(--destructive)] px-3.5 text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--destructive-foreground,#fff)] outline-none select-none [transition:transform_.5s_var(--ns-ease-reshape),scale_.5s_var(--ns-ease-reshape),translate_.5s_var(--ns-ease-reshape),rotate_.5s_var(--ns-ease-reshape),background-color_var(--ns-time-color)] hover:bg-[color-mix(in_oklab,var(--destructive)_86%,var(--background))] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[var(--destructive)] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
            asking ? "translate-x-0" : "-translate-x-10 rtl:translate-x-10"
          )}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          {confirmLabel}
        </button>
      </div>
      <Announcer message={asking ? "Are you sure?" : state === "done" ? spoken(doneLabel, "Done") : ""} />
    </div>
  )
})

export { ConfirmMorph, type ConfirmMorphProps }
