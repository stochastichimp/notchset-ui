"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"
import { useVerificationCode, type VerificationStatus } from "@/lib/notchset/verification-code"

/*
 * Code Input: six boxes over one real input (numeric, one-time-code autocomplete), so paste and SMS
 * autofill just work. Digits pop in with a rising tone; the sixth checks the code by itself: the boxes
 * wave while it's checked, turn success with a chime, or turn destructive, shake, buzz and clear. A
 * resend countdown runs under it and becomes a Resend code chip.
 */

type CodeStatus = VerificationStatus

interface CodeInputProps {
  /** Checks a complete code (on your server); resolve true when it's right. */
  verify: (code: string) => boolean | PromiseLike<boolean>
  onVerified?: ((code: string) => void) | undefined
  /** Sends a new code. */
  onResend?: (() => unknown) | undefined
  onStatusChange?: ((status: CodeStatus) => void) | undefined
  length?: number | undefined
  /** Seconds before Resend code shows. */
  resendAfter?: number | undefined
  /** The boxes' height, px. */
  size?: number | undefined
  /** Bump to focus the input (when the pane holding it appears). */
  focusKey?: number | undefined
  label?: string | undefined
  sound?: boolean | undefined
  className?: string | undefined
}

function CodeInput({ verify, onVerified, onResend, onStatusChange, length = 6, resendAfter = 30, size = 58, focusKey = 0, label = "Six digit code", sound = true, className }: CodeInputProps) {
  const { sfx } = useSound(sound)
  const [focused, setFocused] = React.useState(false)
  const [note, setNote] = React.useState("")
  const input = React.useRef<HTMLInputElement>(null)
  const { code, type: setTyped, status, shakes, left, queueSubmit, restart, later, locked } = useVerificationCode({
    verify,
    onVerified,
    resendAfter,
    input,
    onStatusChange: (s) => {
      if (s === "checking") sfx.tone(420, 0.5, "sine", 0.02, 0, 900)
      else if (s === "verified") sfx.chime()
      else if (s === "wrong") sfx.buzz()
      onStatusChange?.(s)
    },
  })

  React.useEffect(() => {
    if (!focusKey) return
    const t = window.setTimeout(() => input.current?.focus(), 60)
    return () => window.clearTimeout(t)
  }, [focusKey])

  const type = (raw: string) => {
    if (locked) return
    const v = raw.replace(/\D/g, "").slice(0, length)
    if (v === code) return
    if (v.length > code.length) {
      for (let j = code.length; j < v.length; j++) later(() => sfx.tone(500 + j * 80, 0.04, "triangle", 0.035), (j - code.length) * 50)
    } else sfx.tone(700, 0.02, "triangle", 0.02, 0, 500)
    setTyped(v)
    setNote("")
    // Sent a beat after the last digit; another keystroke first cancels it.
    if (v.length === length) queueSubmit(v, 160)
  }

  const active = focused && status === "idle" && code.length < length ? code.length : -1
  const half = Math.ceil(length / 2) - 1

  return (
    <div data-slot="code-input" className={cn("flex flex-col gap-3.5", className)}>
      <div className={cn("relative flex gap-2", shakes > 0 && (shakes % 2 ? "animate-[ns-shake-sm_.42s]" : "animate-[ns-shake-sm-b_.42s]"))}>
        <input
          ref={input}
          value={code}
          onChange={(e) => type(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          aria-label={label}
          aria-invalid={status === "wrong" || undefined}
          readOnly={locked}
          className="absolute inset-0 z-[2] size-full cursor-text border-none text-[16px] opacity-0"
        />
        {Array.from({ length }, (_, i) => {
          const d = code[i] ?? ""
          return (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                "relative box-border grid min-w-0 flex-1 place-items-center rounded-2xl border-[1.5px] text-[24px] font-semibold tracking-[-0.02em] [transition:border-color_.2s,background-color_.3s,box-shadow_.25s,color_.3s]",
                status === "verified" && "border-[var(--success,var(--foreground))] bg-[color-mix(in_oklab,var(--success,var(--primary))_12%,var(--background))] text-[color-mix(in_oklab,var(--success,var(--foreground))_70%,var(--foreground))]",
                status === "wrong" && "border-[var(--destructive)] bg-[color-mix(in_oklab,var(--destructive)_7%,var(--background))]",
                status !== "verified" && status !== "wrong" && i === active && "border-[color-mix(in_oklab,var(--foreground)_55%,var(--border))] bg-[var(--background)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]",
                status !== "verified" && status !== "wrong" && i !== active && d && "border-[color-mix(in_oklab,var(--foreground)_28%,var(--border))] bg-[color-mix(in_oklab,var(--foreground)_3%,var(--background))]",
                status !== "verified" && status !== "wrong" && i !== active && !d && "border-[var(--border)] bg-[var(--background)]",
                status === "checking" && "animate-[ns-otp-wave_.7s_ease-in-out_infinite] motion-reduce:animate-none"
              )}
              style={{ height: size, marginInlineEnd: i === half ? 10 : 0, animationDelay: status === "checking" ? `${i * 70}ms` : undefined }}
            >
              {d && (
                <span key={`${i}-${d}`} className="block animate-[ns-otp-digit_.32s_var(--ns-ease-rebound)] motion-reduce:animate-none">
                  {d}
                </span>
              )}
              {i === active && <span className="absolute top-1/2 start-1/2 -mt-3 -ms-px h-6 w-0.5 animate-[ns-caret_1s_steps(1)_infinite] rounded-[1px] bg-[var(--foreground)] motion-reduce:animate-none" />}
            </span>
          )
        })}
      </div>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <span
          aria-live="polite"
          className={cn(
            "flex items-center gap-[7px] text-[13.5px] [transition:color_var(--ns-time-color)]",
            status === "verified" && "text-[color-mix(in_oklab,var(--success,var(--foreground))_70%,var(--foreground))]",
            status === "wrong" && "text-[var(--destructive)]",
            status !== "verified" && status !== "wrong" && "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
          )}
        >
          {status === "verified" && (
            <span aria-hidden="true" className="grid size-[18px] animate-[ns-chip_.4s_var(--ns-ease-rebound)] place-items-center rounded-full bg-[var(--success,var(--primary))] text-[var(--success-foreground,var(--primary-foreground))] motion-reduce:animate-none">
              <svg viewBox="0 0 24 24" className="block size-2.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          )}
          {status === "checking" ? "Checking the code…" : status === "verified" ? "Verified" : status === "wrong" ? "That code is not right. Try again." : note || `Paste or type the ${length} digits`}
        </span>
        {status !== "verified" &&
          (left > 0 ? (
            <span className="flex items-baseline text-[13.5px] whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
              Resend in 0:
              <span className="flex">
                <NumberFlow tight value={String(left).padStart(2, "0")} />
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                restart()
                setNote("A new code is on its way")
                sfx.pop()
                onResend?.()
                input.current?.focus()
              }}
              className="h-[var(--ns-control-compact)] animate-[ns-chip_.4s_var(--ns-ease-pop)] cursor-pointer rounded-full bg-[var(--muted)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-label)] font-semibold whitespace-nowrap text-[var(--foreground)] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] motion-reduce:animate-none"
            >
              Resend code
            </button>
          ))}
      </div>
    </div>
  )
}

export { CodeInput, type CodeInputProps, type CodeStatus }
