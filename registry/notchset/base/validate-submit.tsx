"use client"

/**
 * Validate Submit (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/validate-submit
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, RollingLabel, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Validate Submit: an email field and its submit button. A bad address shakes the button with a buzz,
 * darkens the field's border and drops in the reason; typing clears it. A good one rolls the label to
 * three bouncing dots while your onSubmit runs, then to a check and You're in.
 */

type SubmitState = "idle" | "sending" | "done"

interface ValidateSubmitProps extends Omit<React.ComponentPropsWithoutRef<"form">, "onSubmit" | "children"> {
  /** Runs with a valid address. Resolve when it's accepted; a rejection shakes the button. */
  onSubmit?: ((email: string) => unknown) | undefined
  onError?: ((error: unknown) => void) | undefined
  /** Called as the success state shows (after the work resolves and the minimum time), so anything that follows the button lands with it. */
  onSuccess?: (() => void) | undefined
  /** The field's accessible name. Default "Email". */
  label?: string | undefined
  placeholder?: string | undefined
  submitLabel?: React.ReactNode | undefined
  doneLabel?: React.ReactNode | undefined
  /** The message under a bad address. */
  invalidMessage?: string | undefined
  /** How long the done label shows before it resets (ms). Default 2000. */
  resetAfter?: number | undefined
  sound?: boolean | undefined
}

const EMAIL = /^\S+@\S+\.\S+$/

const ValidateSubmit = React.forwardRef<HTMLFormElement, ValidateSubmitProps>(function ValidateSubmit(
  {
    onSubmit,
    onError,
    onSuccess,
    label = "Email",
    placeholder = "you@company.com",
    submitLabel = "Subscribe",
    doneLabel = "You're in",
    invalidMessage = "Enter a valid email address",
    resetAfter = 2000,
    sound = true,
    className,
    ...props
  },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [email, setEmail] = React.useState("")
  const [state, setState] = React.useState<SubmitState>("idle")
  const [invalid, setInvalid] = React.useState(false)
  const [shakes, setShakes] = React.useState(0)
  const errorId = React.useId()

  const reject = () => {
    sfx.buzz()
    setShakes((n) => n + 1)
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (state !== "idle") return
    const value = email.trim()
    if (!EMAIL.test(value)) {
      setInvalid(true)
      reject()
      return
    }
    sfx.press()
    setInvalid(false)
    setState("sending")
    try {
      await onSubmit?.(value)
    } catch (error) {
      setState("idle")
      reject()
      onError?.(error)
      return
    }
    sfx.chime()
    onSuccess?.()
    setState("done")
    timeline.after(resetAfter, () => {
      setState("idle")
      setEmail("")
    })
  }

  return (
    <form ref={ref} noValidate data-slot="validate-submit" data-notchset="" onSubmit={(event) => void submit(event)} className={cn("flex w-full max-w-[340px] flex-col gap-2", className)} {...props}>
      <div className="flex gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          placeholder={placeholder}
          value={email}
          disabled={state !== "idle"}
          onChange={(event) => {
            setEmail(event.target.value)
            if (invalid) setInvalid(false)
          }}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-[var(--radius)] border bg-[var(--background)] px-4 text-[length:var(--ns-type-copy)] text-[var(--foreground)] outline-none [transition:border-color_.2s,box-shadow_.2s] placeholder:text-[var(--muted-foreground)] focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_35%,transparent)] disabled:opacity-60 pointer-coarse:text-[16px]",
            invalid ? "border-[var(--foreground)]" : "border-[var(--input)]"
          )}
        />
        <button
          type="submit"
          aria-busy={state === "sending" || undefined}
          className="relative inline-flex h-11 w-[122px] shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius)] border border-transparent bg-[var(--primary)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--primary-foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] active:scale-[var(--ns-press-depth)] hover:bg-[color-mix(in_oklab,var(--primary)_86%,var(--background))] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <span key={shakes} className={cn("block w-full", shakes > 0 && "animate-[ns-shake_.42s]")}>
            <RollingLabel
              index={state === "idle" ? 0 : state === "sending" ? 1 : 2}
              rows={[
                submitLabel,
                <span key="dots" aria-hidden="true" className="flex h-5 items-center gap-1">
                  {[0, 0.12, 0.24].map((delay) => (
                    <span key={delay} className="block size-[5px] animate-[ns-eq_.7s_ease-in-out_infinite] rounded-full bg-current" style={{ animationDelay: `${delay}s` }} />
                  ))}
                </span>,
                <span key="done" className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {doneLabel}
                </span>,
              ]}
            />
          </span>
        </button>
      </div>
      <p
        id={errorId}
        role={invalid ? "alert" : undefined}
        className={cn("m-0 ps-4 font-mono text-[length:var(--ns-type-note)] text-[var(--foreground)] [transition:opacity_.2s,transform_.2s,scale_.2s,translate_.2s,rotate_.2s]", invalid ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0")}
      >
        {invalid ? invalidMessage : " "}
      </p>
      <Announcer message={state === "sending" ? "Sending" : state === "done" ? "Subscribed" : ""} />
    </form>
  )
})

export { ValidateSubmit, type ValidateSubmitProps }
