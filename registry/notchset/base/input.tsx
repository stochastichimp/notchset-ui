"use client"

/**
 * Input (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/input
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useComposedRefs } from "@/lib/notchset/shared"
import { FieldHelper, FieldIconButton, FieldLabel, FieldShell, useControllable, useFocusWithin } from "@/lib/notchset/field"
import { typedSound, useSound } from "@/lib/notchset/sound"

/*
 * Input: a labelled text field. A dot slides in before the label on focus and a character counter
 * fades up beside it (foreground near the limit); every key ticks softly. The clear button pops in
 * once there's text and sweeps it away, keeping focus in the field.
 */

interface InputProps extends Omit<React.ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange" | "size"> {
  label: React.ReactNode
  helper?: React.ReactNode | undefined
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  /** Show a counter against maxLength while focused. Default true when maxLength is set. */
  counter?: boolean | undefined
  /** Show the clear button when there's text. Default true. */
  clearable?: boolean | undefined
  sound?: boolean | undefined
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, value, defaultValue = "", onValueChange, counter, clearable = true, maxLength, sound = true, id, className, disabled, onFocus, onBlur, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [text, setText] = useControllable(value, defaultValue, onValueChange)
  const [focused, focusProps] = useFocusWithin()
  // The cleared text, swept out as a picture: the value itself empties at once.
  const [ghost, setGhost] = React.useState<{ text: string; key: number } | null>(null)
  const inner = React.useRef<HTMLInputElement>(null)
  const refs = useComposedRefs(inner, ref)
  const autoId = React.useId()
  const inputId = id ?? autoId
  const helperId = `${inputId}-helper`
  const showCounter = (counter ?? maxLength != null) && maxLength != null
  const near = maxLength != null && text.length > maxLength * 0.8

  const clear = () => {
    sfx.clear()
    setGhost({ text, key: Date.now() })
    setText("")
    inner.current?.focus()
  }

  return (
    <div data-slot="input" data-notchset="" className={cn("flex w-full flex-col gap-2", className)}>
      <FieldLabel
        htmlFor={inputId}
        focused={focused}
        aside={
          showCounter && (
            <span aria-hidden="true" className={cn("font-mono text-[11px] tabular-nums [transition:opacity_.25s,color_var(--ns-time-color)]", focused ? "opacity-100" : "opacity-0", near ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]")}>
              {text.length}/{maxLength}
            </span>
          )
        }
      >
        {label}
      </FieldLabel>
      <FieldShell focused={focused} {...focusProps}>
        <input
          ref={refs}
          id={inputId}
          value={text}
          maxLength={maxLength}
          disabled={disabled}
          aria-describedby={helper ? helperId : undefined}
          onFocus={(event) => {
            sfx.focus()
            onFocus?.(event)
          }}
          onBlur={onBlur}
          onChange={(event) => {
            typedSound(sfx, text, event.target.value)
            setText(event.target.value)
          }}
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[length:var(--ns-type-copy)] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:text-[16px]"
          {...props}
        />
        {ghost && (
          <span
            key={ghost.key}
            aria-hidden="true"
            onAnimationEnd={() => setGhost(null)}
            className="pointer-events-none absolute start-4 top-1/2 max-w-[calc(100%-56px)] -translate-y-1/2 animate-[ns-sweep-out_.18s_ease-in_forwards] truncate text-[length:var(--ns-type-copy)] whitespace-pre text-[var(--foreground)]"
          >
            {ghost.text}
          </span>
        )}
        {clearable && (
          <FieldIconButton
            aria-label="Clear"
            tabIndex={text ? 0 : -1}
            aria-hidden={!text || undefined}
            disabled={disabled}
            onClick={clear}
            className={cn(text ? "scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </FieldIconButton>
        )}
      </FieldShell>
      {helper != null && <FieldHelper id={helperId}>{helper}</FieldHelper>}
    </div>
  )
})

export { Input, type InputProps }
