"use client"

/**
 * Passkey Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/passkey-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, RollingLabel, spoken, useTimeline, wait } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Passkey: a scan line sweeps up the fingerprint (and a soft noise sweep rises with it) while your
 * onAuthenticate runs, typically navigator.credentials.get(); when it resolves the button turns solid
 * and says Welcome back. A rejection (cancelled, no credential) shakes it and buzzes.
 */

type PasskeyState = "idle" | "primed" | "scanning" | "done"

interface PasskeyButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  /** Runs the WebAuthn ceremony. Resolve when signed in; a rejection shakes the button. */
  onAuthenticate?: (() => unknown) | undefined
  onError?: ((error: unknown) => void) | undefined
  /** Called as the success state shows (after the work resolves and the minimum time), so anything that follows the button lands with it. */
  onSuccess?: (() => void) | undefined
  label?: React.ReactNode | undefined
  verifyingLabel?: React.ReactNode | undefined
  doneLabel?: React.ReactNode | undefined
  /** How long Welcome back shows before it resets (ms); null keeps it. Default 2500. */
  resetAfter?: number | null | undefined
  sound?: boolean | undefined
}

const SCAN_MS = 1100

const PRINT = (
  <>
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
    <path d="M2 12a10 10 0 0 1 18-6" />
    <path d="M2 16h.01" />
    <path d="M21.8 16c.2-2 .131-5.354 0-6" />
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
  </>
)

const PasskeyButton = React.forwardRef<HTMLButtonElement, PasskeyButtonProps>(function PasskeyButton(
  { onAuthenticate, onError, onSuccess, label = "Sign in with passkey", verifyingLabel = "Verifying", doneLabel = "Welcome back", resetAfter = 2500, sound = true, disabled, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const clipId = React.useId()
  const [state, setState] = React.useState<PasskeyState>("idle")
  const [shakes, setShakes] = React.useState(0)

  const authenticate = async () => {
    if (state !== "idle" || disabled) return
    sfx.tick()
    setState("primed")
    timeline.after(40, () => {
      setState("scanning")
      sfx.noise(SCAN_MS / 1000, 0.025, 600, 2600)
    })
    try {
      await Promise.all([onAuthenticate?.(), wait(1300)])
    } catch (error) {
      timeline.clear()
      sfx.buzz()
      setShakes((n) => n + 1)
      setState("idle")
      onError?.(error)
      return
    }
    sfx.chime()
    onSuccess?.()
    setState("done")
    if (resetAfter != null) timeline.after(resetAfter, () => setState("idle"))
  }

  const scanning = state === "scanning"
  return (
    <button
      ref={ref}
      type="button"
      data-slot="passkey-button"
      data-notchset=""
      data-state={state}
      aria-busy={state === "primed" || scanning || undefined}
      disabled={disabled}
      onClick={() => void authenticate()}
      className={cn(
        "relative inline-flex h-11 w-[236px] max-w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color),color_var(--ns-time-color),border-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        state === "done" ? "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)]",
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className="relative block size-[18px] shrink-0">
        <svg viewBox="0 0 24 24" className="absolute inset-0 size-[18px] opacity-[.28]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {PRINT}
        </svg>
        <svg viewBox="0 0 24 24" className="absolute inset-0 size-[18px] overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <clipPath id={clipId}>
              <rect x="-2" y="-2" width="28" height="28" style={{ transform: `translateY(${state === "primed" ? 26 : 0}px)`, transition: scanning ? `transform ${SCAN_MS}ms cubic-bezier(.45,0,.3,1)` : "none" }} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>{PRINT}</g>
          <line
            x1="-2"
            x2="26"
            y1="0"
            y2="0"
            strokeWidth="1.6"
            style={{
              transform: `translateY(${state === "primed" ? 24 : -2}px)`,
              opacity: scanning ? 1 : 0,
              transition: scanning ? `transform ${SCAN_MS}ms cubic-bezier(.45,0,.3,1), opacity .2s` : "opacity .2s",
            }}
          />
        </svg>
      </span>
      <span key={shakes} className={cn("block", shakes > 0 && "animate-[ns-shake_.42s]")}>
        <RollingLabel index={state === "idle" ? 0 : state === "done" ? 2 : 1} rows={[label, verifyingLabel, doneLabel]} />
      </span>
      <Announcer message={scanning ? spoken(verifyingLabel, "Verifying") : state === "done" ? spoken(doneLabel, "Signed in") : ""} />
    </button>
  )
})

export { PasskeyButton, type PasskeyButtonProps }
