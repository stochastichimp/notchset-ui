"use client"

/**
 * Alert (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/alert
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { inertRef } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Alert: one alert in four tones. The tint, icon and action change with the tone (the surface and border
 * cross-fade, the icon pops in) and each tone has its own two-note motif. Dismissing folds it away and
 * leaves an Undo line in its place.
 */

type AlertTone = "info" | "success" | "warning" | "error"

interface AlertProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  tone?: AlertTone | undefined
  title: React.ReactNode
  description?: React.ReactNode | undefined
  /** The tone word beside the title. Default: the tone's name. */
  label?: React.ReactNode | undefined
  /** The call to action, e.g. { label: "View logs", onClick }. */
  action?: { label: React.ReactNode; onClick?: (() => void) | undefined } | undefined
  /** Shows Dismiss; called when it folds away. */
  onDismiss?: (() => void) | undefined
  /** Called when Undo brings it back. */
  onRestore?: (() => void) | undefined
  dismissLabel?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const TONE_VAR: Record<AlertTone, string> = { info: "var(--info,var(--foreground))", success: "var(--success,var(--foreground))", warning: "var(--warning,var(--foreground))", error: "var(--destructive)" }
const TONE_INDEX: Record<AlertTone, 0 | 1 | 2 | 3> = { info: 0, success: 1, warning: 2, error: 3 }
const TONE_NAME: Record<AlertTone, string> = { info: "Info", success: "Success", warning: "Warning", error: "Error" }

function ToneIcon({ tone }: { tone: AlertTone }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {tone === "warning" ? (
        <>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="10" />
          {tone === "info" && (
            <>
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </>
          )}
          {tone === "success" && <path d="m9 12 2 2 4-4" />}
          {tone === "error" && (
            <>
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </>
          )}
        </>
      )}
    </svg>
  )
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = "info", title, description, label, action, onDismiss, onRestore, dismissLabel = "Dismiss", sound = true, className, style, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [gone, setGone] = React.useState(false)
  const undoRef = React.useRef<HTMLButtonElement>(null)
  const dismissRef = React.useRef<HTMLButtonElement>(null)
  const shownTone = React.useRef(tone)

  // A new tone plays its motif; the first render is silent.
  React.useEffect(() => {
    if (shownTone.current === tone) return
    shownTone.current = tone
    sfx.toneSig(TONE_INDEX[tone])
  }, [tone, sfx])

  const dismiss = () => {
    sfx.dismiss()
    setGone(true)
    onDismiss?.()
    requestAnimationFrame(() => undoRef.current?.focus())
  }
  const restore = () => {
    sfx.pop()
    setGone(false)
    onRestore?.()
    requestAnimationFrame(() => dismissRef.current?.focus())
  }

  return (
    <div ref={ref} data-slot="alert" data-notchset="" data-tone={tone} className={cn("flex w-full flex-col", className)} style={{ ...style, ["--tone" as string]: TONE_VAR[tone] }} {...props}>
      <div className={cn("grid [transition:grid-template-rows_.45s_var(--ns-ease-settle)]", gone ? "grid-rows-[0fr]" : "grid-rows-[1fr]")} ref={inertRef(gone)}>
        <div className="min-h-0 overflow-hidden">
          <div
            role={tone === "error" || tone === "warning" ? "alert" : "status"}
            className="flex gap-3.5 rounded-[min(var(--radius),16px)] border border-[color-mix(in_oklab,var(--tone)_32%,var(--border))] bg-[color-mix(in_oklab,var(--tone)_6%,var(--background))] p-4 [transition:background-color_.35s,border-color_.35s]"
          >
            <span aria-hidden="true" className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-[color-mix(in_oklab,var(--tone)_15%,transparent)] text-[color-mix(in_oklab,var(--tone)_80%,var(--foreground))] [transition:background-color_.35s,color_.35s]">
              <span key={tone} className="grid animate-[ns-chip_.4s_var(--ns-ease-rebound)_both] motion-reduce:animate-none">
                <ToneIcon tone={tone} />
              </span>
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-[length:var(--ns-type-copy)] font-semibold tracking-[var(--ns-tracking-control)] text-[var(--foreground)]">{title}</span>
                <span className="shrink-0 font-mono text-[10.5px] tracking-[.07em] text-[color-mix(in_oklab,var(--tone)_60%,var(--foreground))] uppercase [transition:color_.35s]">{label ?? TONE_NAME[tone]}</span>
              </span>
              {description && <span className="text-[length:var(--ns-type-label)] leading-[var(--ns-leading-prose)] text-pretty text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{description}</span>}
              {(action || onDismiss) && (
                <div className="mt-2 flex gap-1.5">
                  {action && (
                    <button
                      type="button"
                      onClick={() => {
                        sfx.press()
                        action.onClick?.()
                      }}
                      className="inline-flex h-[var(--ns-control-compact)] cursor-pointer items-center justify-center rounded-[var(--radius)] border border-transparent bg-[color-mix(in_oklab,var(--tone)_64%,#000)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-note)] font-medium whitespace-nowrap text-white outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                    >
                      {action.label}
                    </button>
                  )}
                  {onDismiss && (
                    <button
                      ref={dismissRef}
                      type="button"
                      onClick={dismiss}
                      className="inline-flex h-[var(--ns-control-compact)] cursor-pointer items-center justify-center rounded-[var(--radius)] px-2.5 text-[length:var(--ns-type-note)] font-medium whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s,color_.2s] hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                    >
                      {dismissLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {gone && (
        <div className="flex animate-[ns-fade-up_.3s_both] items-center justify-between gap-2 rounded-[min(var(--radius),14px)] border border-dashed border-[var(--border)] py-2.5 ps-3.5 pe-2 text-[length:var(--ns-type-label)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
          Alert dismissed
          <button
            ref={undoRef}
            type="button"
            onClick={restore}
            className="inline-flex h-7 cursor-pointer items-center rounded-[var(--radius)] px-2.5 text-[length:var(--ns-type-note)] font-medium text-[var(--foreground)] outline-none hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
})

export { Alert, type AlertProps, type AlertTone }
