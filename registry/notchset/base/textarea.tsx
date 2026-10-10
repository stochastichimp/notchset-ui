"use client"

/**
 * Textarea (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/textarea
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { Announcer, RollingLabel, useComposedRefs, useIsomorphicLayoutEffect, useTimeline } from "@/lib/notchset/shared"
import { FieldLabel, useControllable } from "@/lib/notchset/field"
import { typedSound, useSound } from "@/lib/notchset/sound"

/*
 * Textarea: grows with its text (96–220px). A ring in the corner fills toward the limit and turns red
 * near it, with the count of what's left; a key past the limit shakes the field. ⌘↵ / Ctrl+↵ saves and
 * the helper rolls to Saved for a moment.
 */

interface TextareaProps extends Omit<React.ComponentPropsWithoutRef<"textarea">, "value" | "defaultValue" | "onChange"> {
  label: React.ReactNode
  helper?: React.ReactNode | undefined
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  /** ⌘↵ / Ctrl+↵ runs it; the helper says Saved when it resolves. */
  onSave?: ((value: string) => unknown) | undefined
  /** The most characters. Default 280. */
  limit?: number | undefined
  savedLabel?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const MIN = 96
const MAX = 220

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helper, value, defaultValue = "", onValueChange, onSave, limit = 280, savedLabel = "Saved · just now", sound = true, id, className, disabled, onFocus, onBlur, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [text, setText] = useControllable(value, defaultValue, onValueChange)
  const [focused, setFocused] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [shakes, setShakes] = React.useState(0)
  const [height, setHeight] = React.useState(MIN)
  const inner = React.useRef<HTMLTextAreaElement>(null)
  const refs = useComposedRefs(inner, ref)
  const autoId = React.useId()
  const inputId = id ?? autoId
  const helperId = `${inputId}-helper`
  const max = Math.max(1, Math.floor(Number.isFinite(limit) ? limit : 280))
  const left = max - text.length
  const atLimit = text.length >= max
  const warn = text.length > max * 0.9

  useIsomorphicLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const previous = el.style.height
    el.style.height = "auto"
    const next = Math.max(MIN, Math.min(MAX, el.scrollHeight))
    el.style.height = previous
    setHeight(next)
  }, [text])

  const save = async () => {
    try {
      await onSave?.(text)
    } catch {
      sfx.buzz()
      setShakes((n) => n + 1)
      return
    }
    sfx.chime()
    setSaved(true)
    timeline.after(2000, () => setSaved(false))
  }

  return (
    <div data-slot="textarea" data-notchset="" className={cn("flex w-full flex-col gap-2", className)}>
      <FieldLabel
        htmlFor={inputId}
        focused={focused}
        aside={onSave && <span aria-hidden="true" className={cn("font-mono text-[11px] text-[var(--muted-foreground)] [transition:opacity_.25s]", focused ? "opacity-100" : "opacity-0")}>⌘↵ to save</span>}
      >
        {label}
      </FieldLabel>
      <div className={cn("relative", shakes > 0 && (shakes % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]"))}>
        <textarea
          ref={refs}
          id={inputId}
          value={text}
          maxLength={max}
          disabled={disabled}
          aria-describedby={helper || onSave ? helperId : undefined}
          aria-invalid={atLimit || undefined}
          onFocus={(event) => {
            setFocused(true)
            sfx.focus()
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          onChange={(event) => {
            typedSound(sfx, text, event.target.value)
            setText(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && onSave) {
              event.preventDefault()
              void save()
            } else if (atLimit && event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
              sfx.buzz()
              setShakes((n) => n + 1)
            }
          }}
          style={{ height }}
          className={cn(
            "block w-full resize-none rounded-[min(var(--radius),18px)] border bg-[var(--background)] px-4 pt-3 pb-8 text-[length:var(--ns-type-copy)] leading-[1.55] text-[var(--foreground)] outline-none [transition:height_.2s,border-color_.2s,box-shadow_var(--ns-time-state)] placeholder:text-[var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:text-[16px]",
            atLimit && "border-[var(--destructive)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--destructive)_14%,transparent)]",
            !atLimit && focused && "border-[color-mix(in_oklab,var(--foreground)_55%,var(--input))] shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]",
            !atLimit && !focused && "border-[var(--input)]"
          )}
          {...props}
        />
        <span aria-hidden="true" className="pointer-events-none absolute end-3 bottom-2.5 flex items-center gap-2">
          {text.length > max * 0.78 && <span className={cn("font-mono text-[11px] tabular-nums", warn ? "text-[var(--destructive)]" : "text-[var(--muted-foreground)]")}><NumberFlow value={left} /></span>}
          <svg viewBox="0 0 18 18" className="size-[18px] -rotate-90">
            <circle cx="9" cy="9" r="7" fill="none" stroke="var(--border)" strokeWidth="2" />
            <circle
              cx="9"
              cy="9"
              r="7"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength={1}
              className={cn("[stroke-dasharray:1] [transition:stroke-dashoffset_.2s,stroke_.2s]", warn ? "stroke-[var(--destructive)]" : "stroke-[var(--foreground)]")}
              style={{ strokeDashoffset: 1 - Math.min(1, text.length / max) }}
            />
          </svg>
        </span>
      </div>
      {(helper != null || onSave) && (
        <div id={helperId} className="text-[length:var(--ns-type-note)] text-[var(--muted-foreground)]">
          <RollingLabel size="sm" align="start" index={saved ? 1 : 0} rows={[helper ?? "", <span key="s" className="text-[var(--foreground)]">{savedLabel}</span>]} />
        </div>
      )}
      <Announcer message={saved ? "Saved" : atLimit ? "Character limit reached" : ""} />
    </div>
  )
})

export { Textarea, type TextareaProps }
