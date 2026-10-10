"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { failureMessage, isFailedResult, RollingLabel, useIsomorphicLayoutEffect } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Arrow CTA: the call to action the blocks share. A 46px pill whose label rolls idle → working → done in
 * a window that resizes to the active label, so the label and icon stay centred together. On hover the
 * arrow leaves toward the end and a second one springs in from the start. A click spins while the
 * action's promise is pending, then sweeps --success across, draws a check and chimes, and resets.
 * It succeeds only on a real success: a throw, `false`, a failed `Response` (`!res.ok`) or `{ error }`
 * shakes it and leaves a message under it until the next press.
 */

/** What an action can resolve to. Anything else (undefined, a value, an ok Response) is a success. */
type ArrowCtaFailure = false | Response | { error: unknown }

type ArrowCtaVariant = "primary" | "secondary" | "inverse"

interface ArrowCtaProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children" | "onClick"> {
  /** The idle, working and done labels. */
  labels: readonly [string, string, string]
  /** primary (filled), secondary (outlined) or inverse (off-white, for a dark surface). */
  variant?: ArrowCtaVariant | undefined
  /**
   * The action. The button works while its promise is pending. To fail, throw, or resolve `false`, a
   * failed `Response` or `{ error: "message" }`: it buzzes, returns to idle and shows the message.
   */
  onAction?: (() => unknown) | undefined
  /** The message shown under the button when the action fails (a thrown Error's or `{ error }`'s message wins). */
  errorMessage?: string | undefined
  /** Called with what failed (the thrown value, `false`, the Response or `{ error }`). */
  onError?: ((reason: unknown) => void) | undefined
  /** How long the done state shows before the button resets, ms; null keeps it (the flow navigates away). */
  resetAfter?: number | null | undefined
  /** default (46px), lg (52px, for a final step such as Pay) or xl (56px, for a hero flow). */
  size?: "default" | "lg" | "xl" | undefined
  /** A step, not a request: the action runs at once with no spinner or success (a wizard's Continue). */
  instant?: boolean | undefined
  /** Not ready (nothing chosen yet): dimmed, and a click shakes and buzzes instead of acting. */
  blocked?: boolean | undefined
  /** How a blocked button looks: dimmed, a muted fill with muted text, or as usual (it explains itself elsewhere). */
  blockedLook?: "dim" | "muted" | "plain" | undefined
  /** Called when a blocked button is pressed (to shake what's missing too). */
  onBlocked?: (() => void) | undefined
  /** Follows the button's phase, for copy beside it (a footer that rolls to "Receipt sent"). */
  onPhaseChange?: ((phase: "idle" | "working" | "done") => void) | undefined
  sound?: boolean | undefined
}

const ARROW = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
)

const ArrowCta = React.forwardRef<HTMLButtonElement, ArrowCtaProps>(function ArrowCta(
  { labels, variant = "secondary", onAction, errorMessage = "That didn't go through. Try again.", onError, resetAfter = 2400, size = "default", blocked = false, instant = false, blockedLook = "dim", onBlocked, onPhaseChange, sound = true, disabled, className, onPointerEnter, onPointerLeave, "aria-describedby": describedBy, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [phase, setPhaseState] = React.useState<0 | 1 | 2>(0)
  const setPhase = (p: 0 | 1 | 2) => {
    setPhaseState(p)
    onPhaseChange?.((["idle", "working", "done"] as const)[p])
  }
  const [hover, setHover] = React.useState(false)
  const [shakes, setShakes] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const errorId = React.useId()
  const timer = React.useRef<number | undefined>(undefined)
  const alive = React.useRef(true)
  React.useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      window.clearTimeout(timer.current)
    }
  }, [])

  // Each label's width, measured from hidden copies, so the window can animate to the active one.
  const rows = React.useRef<(HTMLSpanElement | null)[]>([])
  const [widths, setWidths] = React.useState<number[]>([])
  const key = labels.join("|")
  useIsomorphicLayoutEffect(() => {
    const measure = () => setWidths(rows.current.map((el) => (el ? Math.ceil(el.getBoundingClientRect().width) + 2 : 0)))
    measure()
    const ro = new ResizeObserver(measure)
    rows.current.forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [key])

  const run = async () => {
    if (phase !== 0 || disabled) return
    if (blocked) {
      setShakes((n) => n + 1)
      sfx.buzz()
      onBlocked?.()
      return
    }
    if (instant) {
      onAction?.()
      return
    }
    setPhase(1)
    setError(null)
    sfx.send()
    const fail = (reason: unknown) => {
      if (!alive.current) return
      setPhase(0)
      setShakes((n) => n + 1)
      sfx.buzz()
      setError(failureMessage(reason) || errorMessage)
      onError?.(reason)
    }
    try {
      const result = await onAction?.()
      if (isFailedResult(result)) return fail(result)
      if (!alive.current) return
      setPhase(2)
      sfx.chime()
      if (resetAfter != null) timer.current = window.setTimeout(() => alive.current && setPhase(0), resetAfter)
    } catch (reason) {
      fail(reason)
    }
  }

  const armed = hover && phase === 0
  const done = phase === 2

  return (
    <>
      <button
        ref={ref}
        type="button"
        data-slot="arrow-cta"
        data-phase={["idle", "working", "done"][phase]}
        aria-busy={phase === 1 || undefined}
        aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(" ") || undefined}
        aria-disabled={blocked || undefined}
        disabled={disabled}
        onClick={run}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHover(true)
          onPointerEnter?.(e)
        }}
        onPointerLeave={(e) => {
          setHover(false)
          onPointerLeave?.(e)
        }}
        className={cn(
          "relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[var(--ns-corner-control,var(--radius,999px))] border font-semibold tracking-[-0.005em] outline-none [transition:background-color_.3s,color_.3s,border-color_var(--ns-time-state),opacity_var(--ns-time-state),scale_.2s_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
          blocked && blockedLook === "dim" && "opacity-45",
          size === "xl" && "h-[calc(var(--ns-cta-height)+10px)] px-[var(--ns-inset-roomy)] text-[16px]",
          size === "lg" && "h-[calc(var(--ns-cta-height)+6px)] px-[22px] text-[15px]",
          size === "default" && "h-[var(--ns-cta-height)] px-5 text-[length:var(--ns-type-copy)]",
          variant === "inverse" && "border-transparent bg-[#f5f5f4] text-[#0b0b0c]",
          variant === "primary" && !(blocked && blockedLook === "muted") && "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]",
          blocked && blockedLook === "muted" && "border-transparent bg-[color-mix(in_oklab,var(--foreground)_12%,var(--background))] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]",
          variant === "secondary" && "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]",
          shakes > 0 && (shakes % 2 ? "animate-[ns-shake-sm_.4s]" : "animate-[ns-shake-sm-b_.4s]"),
          className
        )}
        {...props}
      >
        <span aria-hidden="true" className="absolute inset-0 origin-left bg-[var(--success,var(--primary))] [transition:scale_.55s_cubic-bezier(.6,0,.2,1)] motion-reduce:transition-none rtl:origin-right" style={{ scale: done ? "1 1" : "0 1" }} />
        <span className={cn("relative flex items-center [transition:color_.3s_.1s]", size === "default" ? "gap-[9px]" : "gap-2.5", done && "text-[var(--success-foreground,var(--primary-foreground))]")}>
          <span className="block overflow-hidden [transition:width_.45s_cubic-bezier(.2,1.2,.3,1)] motion-reduce:transition-none" style={{ width: widths[phase] || undefined }}>
            <RollingLabel fit size={size === "default" ? "sm" : "default"} rowHeight={size === "xl" ? 22 : undefined} index={phase} rows={labels} />
          </span>
          <span aria-hidden="true" className="relative size-4 shrink-0 overflow-hidden">
            <span className="absolute inset-0 rtl:-scale-x-100">
              <span
                className="absolute inset-0 flex [transition:translate_.32s_cubic-bezier(.6,0,.4,1),opacity_.2s] motion-reduce:transition-none"
                style={{ opacity: phase === 0 && !armed ? 1 : 0, translate: armed ? "18px 0" : "0 0" }}
              >
                {ARROW}
              </span>
              <span
                className={cn("absolute inset-0 flex", armed ? "[transition:translate_.38s_var(--ns-ease-pop)_.12s,opacity_.2s_.12s] motion-reduce:transition-none" : "transition-none")}
                style={{ opacity: armed ? 1 : 0, translate: armed ? "0 0" : "-18px 0" }}
              >
                {ARROW}
              </span>
            </span>
            <span className={cn("absolute inset-0 animate-[ns-spin_.7s_linear_infinite] rounded-full border-2 border-current border-e-transparent [transition:opacity_.2s]", phase === 1 ? "opacity-100" : "opacity-0")} />
            <svg viewBox="0 0 24 24" className="absolute inset-0 block size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" pathLength={1} strokeDasharray={1} className="[transition:stroke-dashoffset_.45s_cubic-bezier(.6,0,.2,1)_.2s] motion-reduce:transition-none" style={{ strokeDashoffset: done ? 0 : 1 }} />
            </svg>
          </span>
        </span>
        <span aria-hidden="true" className="pointer-events-none invisible absolute flex">
          {labels.map((l, i) => (
            <span
              key={i}
              ref={(el) => {
                rows.current[i] = el
              }}
              className="whitespace-nowrap"
            >
              {l}
            </span>
          ))}
        </span>
      </button>
      <span className="sr-only" aria-live="polite">
        {phase === 2 ? labels[2] : ""}
      </span>
      {error && (
        <p id={errorId} role="alert" data-slot="arrow-cta-error" className="m-0 mt-2 w-full basis-full text-center text-[length:var(--ns-type-label)] leading-[var(--ns-leading-note)] text-[var(--destructive)]">
          {error}
        </p>
      )}
    </>
  )
})

export { ArrowCta, isFailedResult as isArrowCtaFailure, type ArrowCtaFailure, type ArrowCtaProps, type ArrowCtaVariant }
