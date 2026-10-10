"use client"

/**
 * Verification Code (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/otp-input
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { Announcer, DrawCheck, useComposedRefs, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"
import { useVerificationCode } from "@/lib/notchset/verification-code"

/*
 * Verification Code: one real input under six boxes. Each digit pops in with a note that climbs as the
 * code fills; a pasted code fills one box at a time. While your onVerify runs the boxes ripple; a good
 * code folds them into one check, a wrong one shakes them red and clears. A resend countdown sits below.
 */


interface OtpInputProps extends Omit<React.ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange" | "maxLength" | "size"> {
  /** Checks a full code. Resolve true (or nothing) when it's right; false or a rejection when it's wrong. */
  onVerify: (code: string) => Promise<boolean | void> | boolean | void
  /** Asks for a new code; the countdown restarts. */
  onResend?: (() => unknown) | undefined
  /** Seconds before Resend is offered. Default 24; 0 hides the countdown. */
  resendAfter?: number | undefined
  /** The input's accessible name. Default "Verification code". */
  label?: string | undefined
  /** Number of digits. Default 6. */
  length?: number | undefined
  sound?: boolean | undefined
}

const OtpInput = React.forwardRef<HTMLInputElement, OtpInputProps>(function OtpInput(
  { onVerify, onResend, resendAfter = 24, label = "Verification code", length = 6, sound = true, className, disabled, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const size = Math.max(4, Math.min(8, Math.floor(length)))
  const [focused, setFocused] = React.useState(false)
  const inner = React.useRef<HTMLInputElement>(null)
  const refs = useComposedRefs(inner, ref)
  const { code, type, status: state, shakes, left, submit: verify, restart } = useVerificationCode({
    verify: onVerify,
    resendAfter,
    input: inner,
    onStatusChange: (s) => {
      if (s === "verified") timeline.after(300, () => sfx.chime())
      else if (s === "wrong") sfx.buzz()
    },
  })

  const set = (next: string) => {
    if (next.length > code.length) sfx.tone(500 + next.length * 80, 0.05, "triangle", 0.045)
    else if (next.length < code.length) sfx.del()
    type(next)
    if (next.length === size) void verify(next)
  }

  const locked = state !== "idle" || disabled
  const active = Math.min(code.length, size - 1)
  const verified = state === "verified"
  return (
    <div data-slot="otp-input" data-notchset="" className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <input
          ref={refs}
          value={code}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={size}
          aria-label={label}
          aria-invalid={state === "wrong" || undefined}
          disabled={disabled}
          readOnly={locked}
          onFocus={() => {
            setFocused(true)
            sfx.focus()
          }}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            if (locked) return
            set(event.target.value.replace(/\D/g, "").slice(0, size))
          }}
          onPaste={(event) => {
            event.preventDefault()
            if (locked) return
            const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, size)
            if (!digits) return
            type("")
            Array.from(digits).forEach((_, i) =>
              timeline.after(i * 60, () => {
                sfx.tone(500 + (i + 1) * 80, 0.05, "triangle", 0.045)
                type(digits.slice(0, i + 1))
                if (i + 1 === size) void verify(digits)
              })
            )
          }}
          className="absolute inset-0 z-[2] size-full cursor-text border-0 p-0 text-[16px] opacity-0 [caret-color:transparent]"
          {...props}
        />
        <div aria-hidden="true" className={cn("flex items-center gap-2", shakes > 0 && (shakes % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]"))}>
          {Array.from({ length: size }, (_, i) => {
            const digit = code[i]
            const isActive = focused && state === "idle" && i === active && !digit
            const half = (size - 1) / 2
            return (
              <React.Fragment key={i}>
                <span
                  className={cn(
                    "relative grid h-[54px] w-11 place-items-center rounded-[min(var(--radius),12px)] border bg-[var(--background)] font-mono text-[22px] font-medium text-[var(--foreground)] [transition:border-color_.2s,box-shadow_.25s,transform_.5s_cubic-bezier(.5,0,.2,1),scale_.5s_cubic-bezier(.5,0,.2,1),translate_.5s_cubic-bezier(.5,0,.2,1),rotate_.5s_cubic-bezier(.5,0,.2,1),opacity_var(--ns-time-state)] max-[380px]:h-12 max-[380px]:w-9",
                    state === "wrong" && "border-[var(--destructive)]",
                    state !== "wrong" && (isActive || state === "checking") && "border-[color-mix(in_oklab,var(--foreground)_55%,var(--input))] shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]",
                    state !== "wrong" && !isActive && state !== "checking" && digit && "border-[color-mix(in_oklab,var(--foreground)_28%,var(--input))]",
                    state !== "wrong" && !isActive && state !== "checking" && !digit && "border-[var(--input)]",
                    state === "checking" && "animate-[ns-wave_.7s_ease-in-out_infinite]",
                    verified && "scale-60 opacity-0"
                  )}
                  style={{
                    animationDelay: state === "checking" ? `${i * 70}ms` : undefined,
                    transitionDelay: verified ? `${i * 30}ms` : undefined,
                    translate: verified ? `${(half - i) * 52}px 0` : undefined,
                  }}
                >
                  {digit && <span className="animate-[ns-digit_.35s_var(--ns-ease-pop)_both]">{digit}</span>}
                  {isActive && <span className="block h-[22px] w-[1.5px] animate-[ns-blink_1s_steps(1)_infinite] bg-[var(--foreground)]" />}
                </span>
                {i === Math.floor(size / 2) - 1 && <span className={cn("block h-[1.5px] w-2 rounded-[1px] bg-[var(--muted-foreground)] [transition:opacity_var(--ns-time-state)]", verified ? "opacity-0" : "opacity-100")} />}
              </React.Fragment>
            )
          })}
        </div>
        <div
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 text-[15px] font-medium text-[var(--foreground)] [transition:opacity_.3s_.3s,transform_.55s_var(--ns-ease-pop)_.3s,scale_.55s_var(--ns-ease-pop)_.3s,translate_.55s_var(--ns-ease-pop)_.3s,rotate_.55s_var(--ns-ease-pop)_.3s]", verified ? "scale-100 opacity-100" : "scale-[.8] opacity-0")}
        >
          <span className="grid size-[30px] place-items-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
            <DrawCheck shown={verified} className="size-[15px]" />
          </span>
          Verified
        </div>
      </div>
      {resendAfter > 0 && onResend && (
        <div className="flex items-center gap-2 text-[length:var(--ns-type-note)] text-[var(--muted-foreground)]">
          {left > 0 ? (
            <span className="inline-flex items-center gap-1 font-mono">Resend in <NumberFlow value={`0:${String(left).padStart(2, "0")}`} /></span>
          ) : (
            <button
              type="button"
              onClick={() => {
                sfx.tick()
                restart()
                onResend()
              }}
              className="animate-[ns-fade-up_.3s_both] cursor-pointer rounded-sm text-[length:var(--ns-type-note)] font-medium text-[var(--foreground)] underline underline-offset-[3px] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
            >
              Resend code
            </button>
          )}
        </div>
      )}
      <Announcer message={state === "checking" ? "Checking code" : verified ? "Verified" : state === "wrong" ? "That code is not right" : ""} />
    </div>
  )
})

export { OtpInput, type OtpInputProps }
