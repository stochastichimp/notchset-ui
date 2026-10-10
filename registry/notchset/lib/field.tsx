"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * Text fields' shared parts: the label whose focus dot slides in, the shell that carries the
 * border, the focus ring, the error state and the shake, the helper line, and controlled-or-not value
 * state. Every class is a plain literal so the shadcn CLI can prefix it.
 */

/** Value state that works controlled (value) or uncontrolled (defaultValue), reporting every change. */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [inner, setInner] = React.useState(defaultValue)
  const current = value === undefined ? inner : value
  const set = React.useCallback(
    (next: T) => {
      if (value === undefined) setInner(next)
      onChange?.(next)
    },
    [value, onChange]
  )
  return [current, set] as const
}

/** Focus tracking for a field: within the shell, so inner buttons keep the focused look. */
function useFocusWithin() {
  const [focused, setFocused] = React.useState(false)
  const props = {
    onFocus: () => setFocused(true),
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
    },
  }
  return [focused, props] as const
}

/** The label with the 6px focus dot that slides in before it while the field has focus. */
function FieldLabel({ htmlFor, id, focused, children, aside, className }: { htmlFor?: string | undefined; id?: string | undefined; focused: boolean; children: React.ReactNode; aside?: React.ReactNode | undefined; className?: string | undefined }) {
  return (
    <div data-slot="field-label" className={cn("flex min-h-[18px] items-center justify-between gap-2", className)}>
      <label htmlFor={htmlFor} id={id} className="flex items-center text-[length:var(--ns-type-label)] font-medium text-[var(--foreground)]">
        <span
          aria-hidden="true"
          className={cn(
            "block h-1.5 shrink-0 rounded-full bg-[var(--foreground)] [transition:width_.35s_var(--ns-ease-reshape),margin_.35s_var(--ns-ease-reshape),transform_.4s_var(--ns-ease-rebound),scale_.4s_var(--ns-ease-rebound),translate_.4s_var(--ns-ease-rebound),rotate_.4s_var(--ns-ease-rebound)]",
            focused ? "me-2 w-1.5 scale-100" : "me-0 w-0 scale-0"
          )}
        />
        {children}
      </label>
      {aside}
    </div>
  )
}

/**
 * The field's outline: 44px pill by default. Focus darkens the border and adds a soft ring; invalid
 * turns both destructive. Changing `shake` replays the error shake.
 */
const FieldShell = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div"> & { focused: boolean; invalid?: boolean | undefined; shake?: number | undefined }>(function FieldShell(
  { focused, invalid = false, shake = 0, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="field-shell"
      data-focused={focused || undefined}
      data-invalid={invalid || undefined}
      className={cn(
        "relative flex h-[var(--ns-control-field)] items-center gap-2 rounded-[var(--radius)] border bg-[var(--background)] ps-4 pe-1.5 text-[var(--foreground)] [transition:border-color_.2s,box-shadow_var(--ns-time-state)]",
        invalid && "border-[var(--destructive)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--destructive)_14%,transparent)]",
        !invalid && focused && "border-[color:var(--ns-focus-color,color-mix(in_oklab,var(--foreground)_55%,var(--input)))] shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]",
        !invalid && !focused && "border-[var(--input)] shadow-[0_0_0_0_transparent]",
        // Two identical keyframes, alternated: a new name restarts the shake without remounting the input.
        shake > 0 && (shake % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]"),
        className
      )}
      {...props}
    />
  )
})

/** The helper line under a field (12px muted; destructive when it reports an error). */
function FieldHelper({ id, tone = "muted", children, className }: { id?: string | undefined; tone?: "muted" | "error" | "strong" | undefined; children: React.ReactNode; className?: string | undefined }) {
  return (
    <p
      id={id}
      data-slot="field-helper"
      className={cn(
        "m-0 min-h-4 text-[length:var(--ns-type-note)] leading-[var(--ns-leading-note)]",
        tone === "error" ? "text-[var(--destructive)]" : tone === "strong" ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]",
        className
      )}
    >
      {children}
    </p>
  )
}

/** A 30px ghost button inside a shell that keeps the input focused when pressed. */
const FieldIconButton = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>(function FieldIconButton({ className, onMouseDown, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onMouseDown={(event) => {
        event.preventDefault()
        onMouseDown?.(event)
      }}
      className={cn(
        "relative grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-[var(--radius)] text-[var(--muted-foreground)] outline-none [transition:background-color_.15s,color_.15s,opacity_.2s,transform_.35s_var(--ns-ease-rebound),scale_.35s_var(--ns-ease-rebound),translate_.35s_var(--ns-ease-rebound),rotate_.35s_var(--ns-ease-rebound)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] pointer-coarse:after:absolute pointer-coarse:after:-inset-[7px] pointer-coarse:after:content-[''] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className
      )}
      {...props}
    />
  )
})

export { FieldHelper, FieldIconButton, FieldLabel, FieldShell, useControllable, useFocusWithin }
