"use client"

/**
 * Error Summary (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/error-summary
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Collapse } from "@/lib/notchset/collapse"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { failureMessage, isFailedResult, RollingLabel, Spinner } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Error Summary: a form that, on a submit with errors, opens a red summary above the fields with one
 * link per problem. A link focuses its field and shakes it; each bad field gets a red border, ring and
 * inline message. As fields become valid their links fold away with a rising ding, and when none are
 * left the summary turns green for a moment, then folds. Submit rolls to ✓ when it succeeds.
 */

interface SummaryField {
  name: string
  label: string
  placeholder?: string | undefined
  type?: React.HTMLInputTypeAttribute | undefined
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] | undefined
  /** The problem with this value, or null when it's fine. */
  validate: (value: string) => string | null
}

interface ErrorSummaryProps extends Omit<React.ComponentPropsWithoutRef<"form">, "title" | "onSubmit"> {
  title?: React.ReactNode | undefined
  fields: readonly SummaryField[]
  defaultValues?: Record<string, string> | undefined
  /** Sends the values. Throw, or resolve `false`, a failed Response or `{ error }`, to fail: the form keeps the values and says why. */
  onSubmit: (values: Record<string, string>) => unknown
  /** What the form says when sending fails (a thrown Error's or `{ error }`'s message wins). */
  submitError?: string | undefined
  submitLabels?: readonly [React.ReactNode, React.ReactNode, React.ReactNode] | undefined
  sound?: boolean | undefined
}

const ErrorSummary = React.forwardRef<HTMLFormElement, ErrorSummaryProps>(function ErrorSummary(
  { title, fields, defaultValues = {}, onSubmit, submitError = "That didn't send. Your answers are still here; try again.", submitLabels = ["Submit", "Submitting…", "✓ Done"], sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const base = React.useId()
  const inputs = React.useRef<Record<string, HTMLInputElement | null>>({})
  const [values, setValues] = React.useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, defaultValues[f.name] ?? ""])))
  const [tried, setTried] = React.useState(false)
  const [shakes, setShakes] = React.useState<Record<string, number>>({})
  const [good, setGood] = React.useState(false)
  const [done, setDone] = React.useState<0 | 1 | 2>(0)
  // A failed send, kept apart from validation: valid fields and a failed send never read as "looks good".
  const [sendError, setSendError] = React.useState<string | null>(null)
  const sendErrorId = React.useId()
  const errors = fields.flatMap((f) => {
    const m = f.validate(values[f.name] ?? "")
    return m ? [{ field: f, message: m }] : []
  })
  const n = errors.length

  React.useEffect(() => {
    if (!good) return
    const t = window.setTimeout(() => setGood(false), 1600)
    return () => window.clearTimeout(t)
  }, [good])

  const change = (name: string, v: string) => {
    const next = { ...values, [name]: v }
    setSendError(null)
    if (tried) {
      const after = fields.filter((f) => f.validate(next[f.name] ?? "")).length
      if (after < n) {
        sfx.ding(Math.max(0, Math.min(4, fields.length - after)))
        if (after === 0) setGood(true)
      }
    }
    setValues(next)
  }
  const shake = (names: string[]) => setShakes((s) => ({ ...s, ...Object.fromEntries(names.map((k) => [k, (s[k] ?? 0) + 1])) }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (done) return
    setTried(true)
    if (n) {
      sfx.buzz()
      shake(errors.map((e) => e.field.name))
      return
    }
    sfx.press()
    setDone(1)
    setSendError(null)
    setGood(false)
    let reason: unknown = null
    try {
      const result = await onSubmit(values)
      if (isFailedResult(result)) reason = result
    } catch (error) {
      reason = error ?? new Error("Failed")
    }
    if (reason === null) {
      setDone(2)
      sfx.chime()
      return
    }
    sfx.buzz()
    setDone(0)
    const own = failureMessage(reason)
    setSendError(own || submitError)
  }
  const showSummary = tried && done === 0 && !sendError && (n > 0 || good)

  return (
    <form ref={ref} noValidate data-slot="error-summary" data-notchset="" onSubmit={(e) => void submit(e)} className={cn("flex w-full max-w-[380px] flex-col gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--background)] p-[18px] text-[var(--foreground)]", className)} {...props}>
      {title && <span className="text-[16px] font-semibold tracking-[-0.02em]">{title}</span>}
      <Collapse open={showSummary}>
        <div
          role={n ? "alert" : "status"}
          className={cn("mb-0.5 flex flex-col gap-0.5 rounded-[14px] border px-3 py-2.5 [transition:background-color_.45s,border-color_.45s]", n ? "border-[color-mix(in_oklab,var(--destructive)_35%,var(--border))] bg-[color-mix(in_oklab,var(--destructive)_8%,var(--background))]" : "border-[color-mix(in_oklab,var(--success,var(--foreground))_35%,var(--border))] bg-[color-mix(in_oklab,var(--success,var(--foreground))_10%,var(--background))]")}
        >
          <span className="text-[length:var(--ns-type-copy)] font-semibold">
            <RollingLabel
              index={n ? 0 : 1}
              align="start"
              rows={[
                <React.Fragment key="bad">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px] text-[var(--destructive)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  Fix <NumberFlow value={n} /> {n === 1 ? "field" : "fields"} to continue
                </React.Fragment>,
                <React.Fragment key="ok">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px] text-[var(--success,var(--foreground))]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 12.5 2.5 2.5L16 9.5" />
                  </svg>
                  Everything looks good
                </React.Fragment>,
              ]}
            />
          </span>
          {fields.map((f) => {
            const err = errors.find((e) => e.field.name === f.name)
            return (
              <Collapse key={f.name} open={Boolean(err)}>
                <button
                  type="button"
                  onClick={() => {
                    sfx.tick()
                    inputs.current[f.name]?.focus()
                    shake([f.name])
                  }}
                  className="flex h-7 cursor-pointer items-center gap-2 rounded-[6px] ps-[23px] text-[length:var(--ns-type-label)] text-[var(--foreground)] underline decoration-[color-mix(in_oklab,var(--foreground)_30%,transparent)] underline-offset-[3px] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
                >
                  {err?.message}
                  <span aria-hidden="true" className="no-underline rtl:-scale-x-100">
                    →
                  </span>
                </button>
              </Collapse>
            )
          })}
        </div>
      </Collapse>
      {fields.map((f) => {
        const err = tried ? errors.find((e) => e.field.name === f.name) : undefined
        const k = shakes[f.name] ?? 0
        return (
          <label key={f.name} className="flex flex-col gap-[5px] text-[length:var(--ns-type-note)] font-medium text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
            {f.label}
            <input
              ref={(el) => {
                inputs.current[f.name] = el
              }}
              name={f.name}
              type={f.type ?? "text"}
              inputMode={f.inputMode}
              placeholder={f.placeholder}
              value={values[f.name] ?? ""}
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? `${base}-${f.name}` : undefined}
              onChange={(e) => change(f.name, e.target.value)}
              className={cn(
                "h-[38px] rounded-[10px] border bg-[var(--background)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-copy)] font-normal text-[var(--foreground)] outline-none [transition:border-color_.2s,box-shadow_var(--ns-time-state)] focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)] motion-reduce:animate-none",
                err ? "border-[var(--destructive)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--destructive)_12%,transparent)]" : "border-[var(--input)]",
                err && k > 0 && (k % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]")
              )}
            />
            <Collapse open={Boolean(err)}>
              <span id={`${base}-${f.name}`} className="flex items-center gap-1.5 pt-0.5 text-[length:var(--ns-type-note)] font-normal text-[var(--destructive)]">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[13px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                {err?.message}
              </span>
            </Collapse>
          </label>
        )
      })}
      {sendError && (
        <p id={sendErrorId} role="alert" data-slot="error-summary-send-error" className="m-0 text-[length:var(--ns-type-label)] leading-[var(--ns-leading-note)] text-[var(--destructive)]">
          {sendError}
        </p>
      )}
      <button
        aria-describedby={sendError ? sendErrorId : undefined}
        type="submit"
        aria-busy={done === 1 || undefined}
        className={cn(
          "inline-flex h-[var(--ns-control-regular)] cursor-pointer items-center justify-center rounded-[var(--radius)] px-4 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap outline-none [transition:background-color_.3s,color_.3s,scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] active:scale-[.97]",
          done === 2 ? "bg-[var(--success,var(--foreground))] text-[var(--success-foreground,var(--background))]" : "bg-[var(--primary)] text-[var(--primary-foreground)]"
        )}
      >
        <RollingLabel
          index={done}
          rows={[
            <React.Fragment key="a">{submitLabels[0]}</React.Fragment>,
            <React.Fragment key="b">
              <Spinner className="size-3.5" />
              {submitLabels[1]}
            </React.Fragment>,
            <React.Fragment key="c">{submitLabels[2]}</React.Fragment>,
          ]}
        />
      </button>
    </form>
  )
})

export { ErrorSummary, type ErrorSummaryProps, type SummaryField }
