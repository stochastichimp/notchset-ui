"use client"

/**
 * Password Input (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/password-input
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { DrawCheck, useComposedRefs, prefersCalm } from "@/lib/notchset/shared"
import { FieldIconButton, FieldLabel, FieldShell, useControllable, useFocusWithin } from "@/lib/notchset/field"
import { typedSound, useSound } from "@/lib/notchset/sound"

/*
 * Password Input: the eye blinks shut to hide and opens to show, and showing decodes the secret one
 * character at a time out of random glyphs. A chip warns while Caps Lock is on. The helper checks the
 * minimum length.
 */

interface PasswordInputProps extends Omit<React.ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange" | "type" | "size"> {
  label?: React.ReactNode | undefined
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  /** The least length the helper asks for. Default 8. */
  minLength?: number | undefined
  sound?: boolean | undefined
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789#$%&*@"
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { label = "Password", value, defaultValue = "", onValueChange, minLength = 8, sound = true, id, className, disabled, autoComplete = "current-password", ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [secret, setSecret] = useControllable(value, defaultValue, onValueChange)
  const [focused, focusProps] = useFocusWithin()
  const [shown, setShown] = React.useState(false)
  const [scramble, setScramble] = React.useState<string | null>(null)
  const [caps, setCaps] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const inner = React.useRef<HTMLInputElement>(null)
  const refs = useComposedRefs(inner, ref)
  const autoId = React.useId()
  const inputId = id ?? autoId
  const helperId = `${inputId}-helper`
  const long = secret.length >= minLength

  React.useEffect(() => () => {
    if (timer.current) clearInterval(timer.current)
  }, [])

  const toggle = () => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    if (shown) {
      sfx.tone(520, 0.05, "triangle", 0.04, 0, 320)
      setShown(false)
      setScramble(null)
      return
    }
    setShown(true)
    const calm = prefersCalm(inner.current)
    if (calm || !secret) return
    const real = secret
    const started = Date.now()
    setScramble(Array.from(real, randomGlyph).join(""))
    timer.current = setInterval(() => {
      const elapsed = Date.now() - started
      let resolved = 0
      const out = Array.from(real, (ch, i) => {
        if (elapsed > 80 + i * 22) {
          resolved += 1
          return ch
        }
        return randomGlyph()
      }).join("")
      sfx.decode()
      if (resolved >= real.length) {
        if (timer.current) clearInterval(timer.current)
        timer.current = null
        setScramble(null)
      } else setScramble(out)
    }, 32)
  }

  const readCaps = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const on = event.getModifierState?.("CapsLock") ?? false
    if (on === caps) return
    if (on) sfx.tone(700, 0.05, "triangle", 0.04)
    setCaps(on)
  }

  return (
    <div data-slot="password-input" data-notchset="" className={cn("flex w-full flex-col gap-2", className)}>
      <FieldLabel
        htmlFor={inputId}
        focused={focused}
        aside={
          <span
            aria-hidden={!(caps && focused) || undefined}
            className={cn("rounded-[4px] bg-[var(--foreground)] px-1.5 py-px font-mono text-[10px] text-[var(--background)] [transition:opacity_.2s,transform_.3s_var(--ns-ease-reshape),scale_.3s_var(--ns-ease-reshape),translate_.3s_var(--ns-ease-reshape),rotate_.3s_var(--ns-ease-reshape)]", caps && focused ? "translate-y-0 opacity-100" : "translate-y-[3px] opacity-0")}
          >
            ⇪ Caps Lock is on
          </span>
        }
      >
        {label}
      </FieldLabel>
      <FieldShell focused={focused} {...focusProps}>
        <input
          ref={refs}
          id={inputId}
          type={shown ? "text" : "password"}
          value={secret}
          autoComplete={autoComplete}
          spellCheck={false}
          disabled={disabled}
          aria-describedby={helperId}
          onFocus={() => sfx.focus()}
          onKeyDown={readCaps}
          onKeyUp={readCaps}
          onChange={(event) => {
            typedSound(sfx, secret, event.target.value)
            setSecret(event.target.value)
          }}
          className={cn(
            "h-full min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[length:var(--ns-type-copy)] tracking-[.04em] outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-[var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:text-[16px]",
            scramble != null ? "text-transparent" : "text-[var(--foreground)]"
          )}
          {...props}
        />
        {scramble != null && (
          <span aria-hidden="true" className="pointer-events-none absolute start-4 end-12 top-1/2 -translate-y-1/2 overflow-hidden font-mono text-[length:var(--ns-type-copy)] tracking-[.04em] whitespace-pre text-[var(--foreground)]">
            {scramble}
          </span>
        )}
        <FieldIconButton aria-label={shown ? "Hide secret" : "Show secret"} aria-pressed={shown} disabled={disabled} onClick={toggle} className="size-8">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px] overflow-visible" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <g className="origin-[12px_12px] [transform-box:view-box] [transition:transform_.3s_cubic-bezier(.2,1.4,.4,1),scale_.3s_cubic-bezier(.2,1.4,.4,1),translate_.3s_cubic-bezier(.2,1.4,.4,1),rotate_.3s_cubic-bezier(.2,1.4,.4,1)]" style={{ transform: `scaleY(${shown ? 1 : 0.12})` }}>
              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
              <circle cx="12" cy="12" r="3" />
            </g>
            <g className={cn("[transition:opacity_.2s]", shown ? "opacity-0" : "opacity-100")}>
              <path d="M6.5 14.5 5 17" />
              <path d="M12 15.5V18" />
              <path d="M17.5 14.5 19 17" />
            </g>
          </svg>
        </FieldIconButton>
      </FieldShell>
      <p id={helperId} className={cn("m-0 flex min-h-4 items-center gap-1.5 text-[length:var(--ns-type-note)] leading-4", long ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]")}>
        <DrawCheck shown={long} className="size-[13px] text-[var(--success,var(--foreground))]" />
        {long ? "Long enough" : `Minimum ${minLength} characters`}
      </p>
    </div>
  )
})

export { PasswordInput, type PasswordInputProps }
