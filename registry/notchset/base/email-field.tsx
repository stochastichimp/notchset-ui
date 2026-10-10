"use client"

/**
 * Email Field (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/email-field
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, useComposedRefs, useTimeline } from "@/lib/notchset/shared"
import { useControllable, useFocusWithin } from "@/lib/notchset/field"
import { typedSound, useSound } from "@/lib/notchset/sound"

/*
 * Email Field: the label floats up on focus; past the @ the rest of a known domain shows in grey after
 * the caret and Tab (or →) accepts it with a sparkle. The round submit turns solid once the address
 * looks right; Enter sends too. A bad address shakes and says why; a sent one turns the button green
 * with a drawn check.
 */

type SendState = "idle" | "sending" | "sent"

interface EmailFieldProps extends Omit<React.ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange" | "onSubmit" | "size" | "type"> {
  label?: string | undefined
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  /** Sends to the address. Resolve when it's accepted; a rejection shows the error state. */
  onSubmit?: ((email: string) => unknown) | undefined
  onError?: ((error: unknown) => void) | undefined
  /** Domains offered after the @, in order. */
  domains?: readonly string[] | undefined
  /** How long the sent state shows (ms). Default 3800. */
  resetAfter?: number | undefined
  sound?: boolean | undefined
}

const DOMAINS = ["gmail.com", "outlook.com", "icloud.com", "proton.me", "yahoo.com"]
const VALID = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const EmailField = React.forwardRef<HTMLInputElement, EmailFieldProps>(function EmailField(
  { label = "Email address", value, defaultValue = "", onValueChange, onSubmit, onError, domains = DOMAINS, resetAfter = 3800, sound = true, id, className, disabled, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [email, setEmail] = useControllable(value, defaultValue, onValueChange)
  const [focused, focusProps] = useFocusWithin()
  const [state, setState] = React.useState<SendState>("idle")
  const [error, setError] = React.useState(false)
  const [completed, setCompleted] = React.useState(false)
  const [shakes, setShakes] = React.useState(0)
  const inner = React.useRef<HTMLInputElement>(null)
  const refs = useComposedRefs(inner, ref)
  const autoId = React.useId()
  const inputId = id ?? autoId
  const helperId = `${inputId}-helper`

  const at = email.indexOf("@")
  const typedDomain = at >= 0 ? email.slice(at + 1) : ""
  const match = at > 0 ? domains.find((d) => d.startsWith(typedDomain) && d !== typedDomain) : undefined
  const ghost = at > 0 && match ? match.slice(typedDomain.length) : ""
  const valid = VALID.test(email)
  const floated = focused || email.length > 0

  const accept = () => {
    if (!ghost) return false
    sfx.tone(1200, 0.04, "sine", 0.03)
    sfx.sparkle()
    setEmail(email + ghost)
    setCompleted(true)
    return true
  }

  const submit = async () => {
    if (state !== "idle" || disabled) return
    if (!valid) {
      sfx.buzz()
      setError(true)
      setShakes((n) => n + 1)
      return
    }
    sfx.press()
    setState("sending")
    try {
      await onSubmit?.(email)
    } catch (err) {
      sfx.buzz()
      setState("idle")
      setError(true)
      setShakes((n) => n + 1)
      onError?.(err)
      return
    }
    sfx.chime()
    setState("sent")
    timeline.after(resetAfter, () => setState("idle"))
  }

  const helper =
    error ? "That does not look like an email address" : state === "sending" ? "Sending link…" : state === "sent" ? `Sign-in link sent to ${email}` : completed && valid ? "Domain completed · press ↵ to send" : ghost ? "Press Tab to complete" : valid ? "Looks good · press ↵ to send" : "We will send a sign-in link here."

  return (
    <div data-slot="email-field" data-notchset="" className={cn("flex w-full flex-col gap-2", className)}>
      <div
        {...focusProps}
        className={cn(
          "relative h-12 rounded-[var(--radius)] border bg-[var(--background)] text-[var(--foreground)] [transition:border-color_.2s,box-shadow_var(--ns-time-state)]",
          error && "border-[var(--destructive)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--destructive)_14%,transparent)]",
          !error && focused && "border-[color-mix(in_oklab,var(--foreground)_55%,var(--input))] shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]",
          !error && !focused && "border-[var(--input)]",
          shakes > 0 && (shakes % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]")
        )}
      >
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute start-[18px] leading-4 text-[var(--muted-foreground)] [transition:top_.35s_var(--ns-ease-reshape),font-size_.35s_var(--ns-ease-reshape)]",
            floated ? "top-1.5 text-[11px]" : "top-[15px] text-[length:var(--ns-type-copy)]"
          )}
        >
          {label}
        </label>
        <span aria-hidden="true" className="pointer-events-none absolute start-[18px] end-14 bottom-1 flex h-5 items-center overflow-hidden text-[length:var(--ns-type-copy)] whitespace-pre">
          <span className="text-transparent">{email}</span>
          <span className="text-[var(--muted-foreground)]">{focused ? ghost : ""}</span>
          {focused && ghost && <span className="ms-1.5 animate-[ns-fade-up_.25s_both] rounded-[4px] border border-[var(--border)] px-[5px] font-mono text-[10px] leading-[15px] text-[var(--muted-foreground)]">tab</span>}
        </span>
        <input
          ref={refs}
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          value={email}
          disabled={disabled || state !== "idle"}
          aria-invalid={error || undefined}
          aria-describedby={helperId}
          onFocus={() => sfx.focus()}
          onChange={(event) => {
            typedSound(sfx, email, event.target.value)
            setEmail(event.target.value)
            setError(false)
            setCompleted(false)
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return
            if ((event.key === "Tab" && !event.shiftKey) || (event.key === "ArrowRight" && event.currentTarget.selectionStart === email.length)) {
              if (accept()) event.preventDefault()
            } else if (event.key === "Enter") {
              event.preventDefault()
              void submit()
            }
          }}
          className="absolute start-[18px] end-14 bottom-1 h-5 border-0 bg-transparent p-0 text-[length:var(--ns-type-copy)] text-[var(--foreground)] outline-none pointer-coarse:text-[16px]"
          {...props}
        />
        <button
          type="button"
          aria-label="Send sign-in link"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void submit()}
          className={cn(
            "absolute end-[5px] top-[5px] grid size-9 cursor-pointer place-items-center overflow-hidden rounded-[var(--radius)] outline-none [transition:background-color_var(--ns-time-color),color_var(--ns-time-color),transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-90 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
            state === "sent" && "bg-[var(--success,var(--primary))] text-[var(--success-foreground,var(--primary-foreground))]",
            state !== "sent" && valid && "bg-[var(--primary)] text-[var(--primary-foreground)]",
            state !== "sent" && !valid && "bg-[var(--muted)] text-[var(--muted-foreground)]"
          )}
        >
          <span aria-hidden="true" className="relative block size-4">
            <svg viewBox="0 0 24 24" className={cn("absolute inset-0 size-4 [transition:opacity_.2s,transform_.35s_cubic-bezier(.5,0,.2,1),scale_.35s_cubic-bezier(.5,0,.2,1),translate_.35s_cubic-bezier(.5,0,.2,1),rotate_.35s_cubic-bezier(.5,0,.2,1)] rtl:-scale-x-100", state === "idle" ? "translate-x-0 opacity-100" : "translate-x-3.5 opacity-0")} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            <svg viewBox="0 0 24 24" className={cn("absolute inset-px size-3.5 animate-[ns-spin_.7s_linear_infinite] [transition:opacity_.15s]", state === "sending" ? "opacity-100" : "opacity-0")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" className="[stroke-dasharray:20_40]" />
            </svg>
            <svg viewBox="0 0 24 24" className="absolute inset-0 size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" className="[stroke-dasharray:24] [transition:stroke-dashoffset_.4s_cubic-bezier(.6,0,.2,1)_.1s]" style={{ strokeDashoffset: state === "sent" ? 0 : 24 }} />
            </svg>
          </span>
        </button>
      </div>
      <p id={helperId} className={cn("m-0 flex min-h-4 items-center gap-1.5 text-[length:var(--ns-type-note)] leading-4 [transition:color_.2s]", error && "text-[var(--destructive)]", !error && state === "sent" && "text-[var(--foreground)]", !error && state !== "sent" && "text-[var(--muted-foreground)]")}>
        {valid && !error && state === "idle" && (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[13px] shrink-0 animate-[ns-chip_.35s_var(--ns-ease-rebound)_both] text-[var(--success,var(--foreground))]" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
        {helper}
      </p>
      <Announcer message={state === "sent" ? `Sign-in link sent to ${email}` : error ? "That does not look like an email address" : ""} />
    </div>
  )
})

export { EmailField, type EmailFieldProps }
