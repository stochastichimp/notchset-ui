"use client"

/**
 * Password Strength (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/password-strength
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, DrawCheck, RollingLabel, useTimeline, wait } from "@/lib/notchset/shared"
import { FieldLabel, FieldShell, useControllable, useFocusWithin } from "@/lib/notchset/field"
import { typedSound, useSound } from "@/lib/notchset/sound"

/*
 * Password Strength: a tick grows for every character, each rule fills green with a drawn check as it's
 * met (a rising C–E–G–C as the password improves), and a word rolls from Weak to Excellent. Generate
 * fills a strong password like a slot machine; Save unlocks at Strong.
 */

type SaveState = "idle" | "saving" | "saved"

interface PasswordStrengthProps extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "title" | "onError"> {
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  /** Saves the password. Return a promise: Saved shows only when it resolves. */
  onSave?: ((password: string) => unknown) | undefined
  onError?: ((error: unknown) => void) | undefined
  title?: React.ReactNode | undefined
  /** Under the title, e.g. the account's email. */
  account?: React.ReactNode | undefined
  label?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const RULES = [
  { label: "Twelve characters or more", test: (v: string) => v.length >= 12 },
  { label: "Mixed upper and lower case", test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "Includes a digit", test: (v: string) => /\d/.test(v) },
  { label: "Includes a symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]
const WORDS = ["—", "Weak", "Fair", "Strong", "Excellent"]
const POOL = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
const SYMBOLS = "#$%&*@!?"
const TICKS = 16

/** A strong 16-character password from the browser's secure random source: upper, lower, digit and two symbols. */
function strongPassword() {
  const bytes = new Uint32Array(TICKS)
  crypto.getRandomValues(bytes)
  const chars = Array.from(bytes, (b, i) => (i === 4 || i === 11 ? SYMBOLS[b % SYMBOLS.length] : POOL[b % POOL.length])!)
  chars[2] = "ABCDEFGHJKLMNPQRSTUVWXYZ"[bytes[2]! % 24]!
  chars[7] = "abcdefghijkmnopqrstuvwxyz"[bytes[7]! % 25]!
  chars[13] = "23456789"[bytes[13]! % 8]!
  return chars.join("")
}

const PasswordStrength = React.forwardRef<HTMLDivElement, PasswordStrengthProps>(function PasswordStrength(
  { value, defaultValue = "", onValueChange, onSave, onError, title = "Choose a password", account, label = "New password", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [password, setPassword] = useControllable(value, defaultValue, onValueChange)
  const [focused, focusProps] = useFocusWithin()
  const [rolling, setRolling] = React.useState<string | null>(null)
  const [save, setSave] = React.useState<SaveState>("idle")
  const generator = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const inputId = React.useId()
  const shown = rolling ?? password
  const met = RULES.map((r) => r.test(shown))
  const score = rolling == null ? met.filter(Boolean).length : 0

  React.useEffect(() => () => {
    if (generator.current) clearInterval(generator.current)
  }, [])

  const change = (next: string) => {
    const before = RULES.filter((r) => r.test(password)).length
    const after = RULES.filter((r) => r.test(next)).length
    if (after > before) timeline.after(40, () => sfx.ding(after - 1))
    setPassword(next)
    setSave("idle")
  }

  const generate = () => {
    if (generator.current) clearInterval(generator.current)
    const target = strongPassword()
    sfx.tick()
    let locked = 0
    generator.current = setInterval(() => {
      locked += 1
      sfx.tone(1400 + locked * 60, 0.012, "triangle", 0.02)
      if (locked >= TICKS) {
        if (generator.current) clearInterval(generator.current)
        generator.current = null
        setRolling(null)
        change(target)
        timeline.after(260, () => sfx.sparkle())
        return
      }
      setRolling(target.slice(0, locked) + Array.from({ length: TICKS - locked }, () => POOL[Math.floor(Math.random() * POOL.length)]).join(""))
    }, 45)
  }

  const submit = async () => {
    if (save !== "idle" || score < 3) return
    sfx.press()
    setSave("saving")
    try {
      await Promise.all([onSave?.(password), wait(900)])
    } catch (error) {
      sfx.buzz()
      setSave("idle")
      onError?.(error)
      return
    }
    sfx.chime()
    setSave("saved")
    timeline.after(1700, () => setSave("idle"))
  }

  return (
    <div ref={ref} data-slot="password-strength" data-notchset="" className={cn("flex w-full flex-col gap-4", className)} {...props}>
      <div>
        <p className="m-0 text-[16px] font-semibold text-[var(--foreground)]">{title}</p>
        {account != null && <p className="m-0 mt-0.5 font-mono text-[length:var(--ns-type-note)] text-[var(--muted-foreground)]">{account}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel
          htmlFor={inputId}
          focused={focused}
          aside={<RollingLabel size="sm" index={score} rows={WORDS} className="w-[72px] text-end font-mono text-[11px] text-[var(--muted-foreground)] [&_span]:justify-end" />}
        >
          {label}
        </FieldLabel>
        <FieldShell focused={focused} {...focusProps}>
          <input
            id={inputId}
            type="text"
            autoComplete="new-password"
            spellCheck={false}
            value={shown}
            readOnly={rolling != null}
            onFocus={() => sfx.focus()}
            onChange={(event) => {
              typedSound(sfx, password, event.target.value)
              change(event.target.value)
            }}
            className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[length:var(--ns-type-copy)] tracking-[.04em] text-[var(--foreground)] outline-none pointer-coarse:text-[16px]"
          />
        </FieldShell>
        <div aria-hidden="true" className="flex h-3 items-end gap-[3px]">
          {Array.from({ length: TICKS }, (_, i) => (
            <span key={i} className={cn("block flex-1 rounded-[1px] [transition:height_.35s_var(--ns-ease-pop),background-color_.2s]", i < shown.length ? "h-3 bg-[var(--foreground)]" : "h-1.5 bg-[var(--border)]")} />
          ))}
        </div>
      </div>
      <ul aria-label="Password rules" className="m-0 flex list-none flex-col gap-2 p-0">
        {RULES.map((rule, i) => (
          <li key={rule.label} className={cn("flex items-center gap-2.5 text-[length:var(--ns-type-label)] [transition:color_.2s]", met[i] ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]")}>
            <span
              aria-hidden="true"
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] [transition:background-color_var(--ns-time-color),border-color_var(--ns-time-color)]",
                met[i] ? "border-[var(--success,var(--foreground))] bg-[var(--success,var(--foreground))] text-[var(--success-foreground,var(--background))]" : "border-[var(--border)] bg-transparent"
              )}
            >
              <DrawCheck shown={Boolean(met[i])} className="size-2.5" />
            </span>
            {rule.label}
            <span className="sr-only">{met[i] ? ", met" : ", not met"}</span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={generate}
          className="inline-flex h-[var(--ns-control-regular)] flex-1 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-4 text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)] outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
          Generate
        </button>
        <button
          type="button"
          aria-disabled={score < 3 || undefined}
          aria-busy={save === "saving" || undefined}
          onClick={() => void submit()}
          className={cn(
            "inline-flex h-[var(--ns-control-regular)] w-28 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] px-4 text-[length:var(--ns-type-copy)] font-medium text-[var(--primary-foreground)] outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),opacity_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
            score < 3 ? "cursor-not-allowed opacity-40" : "active:scale-[var(--ns-press-depth)]"
          )}
        >
          <RollingLabel index={save === "idle" ? 0 : save === "saving" ? 1 : 2} rows={["Save", "Saving", "Saved"]} />
        </button>
      </div>
      <Announcer message={rolling == null && password ? `${WORDS[score]} password` : save === "saved" ? "Password saved" : ""} />
    </div>
  )
})

export { PasswordStrength, type PasswordStrengthProps }
