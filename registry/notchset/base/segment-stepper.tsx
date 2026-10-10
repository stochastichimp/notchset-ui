"use client"

/**
 * Segment Stepper (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/segment-stepper
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, inertRef, RollingLabel } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Segment Stepper: one segment per step above a strip of panes that slides between them. The current
 * segment fills a third, a finished one fills whole and its name gains a check, and Continue checks the
 * step first (an invalid step shakes and buzzes). Each step forward climbs a note; finishing chimes.
 */

interface StepperStep {
  id: string
  title: string
  /** The pane for this step. */
  content: React.ReactNode
  /** Return false to stay (the pane shakes). */
  validate?: (() => boolean) | undefined
}

interface SegmentStepperProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  steps: readonly StepperStep[]
  /** The pane after the last step. */
  done?: React.ReactNode | undefined
  /** Runs when the last step is finished. */
  onFinish?: (() => void) | undefined
  /** Runs on every move with the new index (steps.length = finished). */
  onStepChange?: ((index: number) => void) | undefined
  sound?: boolean | undefined
}

const SegmentStepper = React.forwardRef<HTMLDivElement, SegmentStepperProps>(function SegmentStepper({ steps, done, onFinish, onStepChange, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [step, setStep] = React.useState(0)
  const [shakes, setShakes] = React.useState(0)
  const total = steps.length
  const finished = step >= total
  const go = (next: number) => {
    setStep(next)
    onStepChange?.(next)
  }

  const forward = () => {
    const current = steps[step]
    if (current?.validate && !current.validate()) {
      sfx.buzz()
      setShakes((n) => n + 1)
      return
    }
    if (step === total - 1) {
      sfx.chime()
      sfx.sparkle()
      go(total)
      onFinish?.()
      return
    }
    sfx.stepFwd(step + 1)
    go(step + 1)
  }
  const back = () => {
    if (finished) {
      sfx.stepBack(0)
      go(0)
      return
    }
    if (step === 0) return
    sfx.stepBack(step - 1)
    go(step - 1)
  }

  const panes = [...steps.map((s) => s.content), done ?? null]
  return (
    <div ref={ref} data-slot="segment-stepper" data-notchset="" className={cn("flex w-full flex-col gap-3.5", className)} {...props}>
      <ol aria-label="Steps" className="m-0 flex list-none gap-1.5 p-0">
        {steps.map((s, i) => {
          const isDone = i < step
          const current = i === step
          return (
            <li key={s.id} aria-current={current ? "step" : undefined} className="flex min-w-0 flex-1 flex-col gap-2">
              <span aria-hidden="true" className="block h-1 overflow-hidden rounded-[2px] bg-[var(--muted)]">
                <span
                  className={cn("block h-full rounded-[2px] bg-[var(--foreground)] [transition:width_.6s_var(--ns-ease-settle)]", current && "delay-[120ms]")}
                  style={{ width: isDone ? "100%" : current ? "34%" : "0%" }}
                />
              </span>
              <span className={cn("flex flex-col gap-px [transition:color_.3s]", isDone || current ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]")}>
                <span className="font-mono text-[10px] opacity-70">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex items-center text-[length:var(--ns-type-label)] font-medium whitespace-nowrap">
                  <span aria-hidden="true" className={cn("block shrink-0 overflow-hidden text-[var(--success,var(--foreground))] [transition:width_.35s_var(--ns-ease-reshape)]", isDone ? "w-4" : "w-0")}>
                    <svg viewBox="0 0 24 24" className="block size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="truncate">{s.title}</span>
                  <span className="sr-only">{isDone ? ", done" : current ? ", current" : ""}</span>
                </span>
              </span>
            </li>
          )
        })}
      </ol>
      <div className="-mx-1 mt-1 overflow-hidden p-1">
        <div className="flex [transition:transform_.55s_var(--ns-ease-settle),scale_.55s_var(--ns-ease-settle),translate_.55s_var(--ns-ease-settle),rotate_.55s_var(--ns-ease-settle)] rtl:flex-row-reverse" style={{ transform: `translateX(${-Math.min(step, total) * 100}%)` }}>
          {panes.map((pane, i) => (
            <div
              key={i}
              aria-hidden={i !== step || undefined}
              ref={inertRef(i !== step)}
              className={cn("flex shrink-0 grow-0 basis-full flex-col gap-2 px-2 [transition:opacity_var(--ns-time-state)]", i === step ? "opacity-100" : "opacity-0", i === step && shakes > 0 && (shakes % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]"))}
            >
              {pane}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={back}
          aria-disabled={step === 0 || undefined}
          className={cn(
            "inline-flex h-[var(--ns-control-regular)] cursor-pointer items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-4 text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)] outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s,opacity_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
            step === 0 && "pointer-events-none opacity-40"
          )}
        >
          {finished ? "Start over" : "Back"}
        </button>
        <button
          type="button"
          onClick={forward}
          tabIndex={finished ? -1 : undefined}
          aria-hidden={finished || undefined}
          className={cn(
            "inline-flex h-[var(--ns-control-regular)] w-[120px] cursor-pointer items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] px-4 text-[length:var(--ns-type-copy)] font-medium text-[var(--primary-foreground)] outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),opacity_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
            finished && "pointer-events-none opacity-0"
          )}
        >
          <RollingLabel index={step >= total - 1 ? 1 : 0} rows={["Continue", "Finish"]} />
        </button>
      </div>
      <Announcer message={finished ? "All steps done" : `Step ${step + 1} of ${total}: ${steps[step]?.title ?? ""}`} />
    </div>
  )
})

export { SegmentStepper, type SegmentStepperProps, type StepperStep }
