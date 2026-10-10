"use client"

/**
 * Deploy Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/deploy-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, LiveDot, RollingLabel, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Deploy: the label becomes the pipeline. Each stage you report fills its own segment while its name
 * shows, finished segments stay full, and when your onDeploy resolves it lands on a live pulse with the
 * time it took. Report stages with `stage(index)` as your pipeline moves.
 */

type DeployState = "idle" | "running" | "live"

interface DeployButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  /** Runs the deploy; call `stage(i)` as each stage starts (0 is the first). Resolve when it's live. */
  onDeploy: (stage: (index: number) => void) => Promise<unknown>
  onError?: ((error: unknown) => void) | undefined
  /** Called as the success state shows (after the work resolves and the minimum time), so anything that follows the button lands with it. */
  onSuccess?: (() => void) | undefined
  /** The stage names, one segment each. Default Building, Testing, Shipping. */
  stages?: readonly string[] | undefined
  label?: React.ReactNode | undefined
  liveLabel?: React.ReactNode | undefined
  /** How long Live shows before the button resets (ms). Default 2900. */
  resetAfter?: number | undefined
  sound?: boolean | undefined
}

const STAGE_TONES = [660, 780, 900, 1020]

const DeployButton = React.forwardRef<HTMLButtonElement, DeployButtonProps>(function DeployButton(
  { onDeploy, onError, onSuccess, stages = ["Building", "Testing", "Shipping"], label = "Deploy to production", liveLabel = "Live", resetAfter = 2900, sound = true, disabled, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [state, setState] = React.useState<DeployState>("idle")
  const [current, setCurrent] = React.useState(0)
  const [took, setTook] = React.useState("")
  const [shakes, setShakes] = React.useState(0)
  const run = React.useRef(0)
  const reached = React.useRef(0)

  const deploy = async () => {
    if (state !== "idle" || disabled) return
    const id = ++run.current
    const started = performance.now()
    sfx.press()
    reached.current = 0
    setCurrent(0)
    setState("running")
    const stage = (index: number) => {
      if (id !== run.current || !Number.isInteger(index)) return
      const next = Math.max(0, Math.min(stages.length - 1, index))
      if (next <= reached.current) return
      reached.current = next
      sfx.tone(STAGE_TONES[(next - 1) % STAGE_TONES.length]!, 0.06, "triangle", 0.05)
      setCurrent(next)
    }
    try {
      await onDeploy(stage)
      if (id !== run.current) return
      setTook(`in ${((performance.now() - started) / 1000).toFixed(1)}s`)
      onSuccess?.()
      setState("live")
      sfx.whoosh()
      timeline.after(160, () => sfx.chime())
      timeline.after(resetAfter, () => setState("idle"))
    } catch (error) {
      if (id !== run.current) return
      sfx.buzz()
      setShakes((n) => n + 1)
      setState("idle")
      onError?.(error)
    }
  }

  const stageName = stages[current] ?? ""
  return (
    <button
      ref={ref}
      type="button"
      data-slot="deploy-button"
      data-notchset=""
      data-state={state}
      aria-busy={state === "running" || undefined}
      disabled={disabled}
      onClick={() => void deploy()}
      className={cn(
        "relative inline-flex h-11 w-[228px] max-w-full shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius)] border border-transparent bg-[var(--primary)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--primary-foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] hover:bg-[color-mix(in_oklab,var(--primary)_86%,var(--background))] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className
      )}
      {...props}
    >
      <span key={shakes} className={cn("block w-full", shakes > 0 && "animate-[ns-shake_.42s]")}>
        <RollingLabel
          index={state === "idle" ? 0 : state === "running" ? 1 : 2}
          rows={[
            <span key="idle" className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
              {label}
            </span>,
            <span key="running" className="flex w-full items-center justify-between gap-2">
              <span>{stageName}</span>
              <span aria-hidden="true" className="flex gap-1">
                {stages.map((name, i) => (
                  <span key={name} className="block h-1 w-[18px] overflow-hidden rounded-[2px] bg-[color-mix(in_oklab,var(--primary-foreground)_25%,transparent)]">
                    <span
                      className={cn("block h-full bg-current", state === "running" && i === current ? "[transition:width_.85s_linear]" : "transition-none")}
                      style={{ width: state !== "idle" && i <= current ? "100%" : "0%" }}
                    />
                  </span>
                ))}
              </span>
            </span>,
            <span key="live" className="flex items-center gap-2">
              <LiveDot />
              {liveLabel}
              <span className="font-mono text-[11px] opacity-60">{took}</span>
            </span>,
          ]}
        />
      </span>
      <Announcer message={state === "running" ? stageName : state === "live" ? "Live" : ""} />
    </button>
  )
})

export { DeployButton, type DeployButtonProps }
