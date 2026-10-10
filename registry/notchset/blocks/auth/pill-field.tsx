"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { typedSound, useSound } from "@/lib/notchset/sound"

/*
 * Pill Field: the blocks' text field. A 48px pill with a visible label; a focus ring; a success tick that
 * pops in when the value is valid; a destructive border and ring, with a shake, on an error. Typing
 * ticks.
 */

interface PillFieldProps extends Omit<React.ComponentPropsWithoutRef<"input">, "onChange" | "value" | "size"> {
  label: React.ReactNode
  /** A note beside the label, e.g. "Optional". */
  aside?: React.ReactNode | undefined
  value: string
  onValueChange: (value: string) => void
  valid?: boolean | undefined
  invalid?: boolean | undefined
  /** Bump to shake. */
  shakes?: number | undefined
  sound?: boolean | undefined
}

const PillField = React.forwardRef<HTMLInputElement, PillFieldProps>(function PillField({ label, aside, value, onValueChange, valid = false, invalid = false, shakes = 0, sound = true, className, id, ...props }, ref) {
  const { sfx } = useSound(sound)
  const own = React.useId()
  const fieldId = id ?? own
  return (
    <div data-slot="pill-field" className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={fieldId} className="flex justify-between text-[length:var(--ns-type-copy)] font-medium">
        {label}
        {aside && <span className="font-normal text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{aside}</span>}
      </label>
      <div
        className={cn(
          "box-border flex h-[var(--ns-control-roomy)] items-center rounded-[var(--ns-corner-control,var(--radius,999px))] border bg-[var(--background)] ps-[18px] pe-2 [transition:border-color_.2s,box-shadow_var(--ns-time-state)]",
          invalid
            ? "border-[var(--destructive)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--destructive)_14%,transparent)]"
            : "border-[var(--border)] focus-within:border-[color:var(--ns-focus-color,color-mix(in_oklab,var(--foreground)_55%,var(--border)))] focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]",
          shakes > 0 && (shakes % 2 ? "animate-[ns-shake-sm_.42s]" : "animate-[ns-shake-sm-b_.42s]")
        )}
      >
        <input
          ref={ref}
          id={fieldId}
          value={value}
          onChange={(e) => {
            typedSound(sfx, value, e.target.value)
            onValueChange(e.target.value)
          }}
          aria-invalid={invalid || undefined}
          className="h-full min-w-0 flex-1 border-none bg-transparent text-[15px] text-[var(--foreground)] pointer-coarse:text-[16px] outline-none placeholder:text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
          {...props}
        />
        <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--success,var(--primary))] text-[var(--success-foreground,var(--primary-foreground))] [transition:scale_.4s_cubic-bezier(.2,1.7,.4,1)] motion-reduce:transition-none" style={{ scale: valid ? 1 : 0 }}>
          <svg viewBox="0 0 24 24" className="block size-3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      </div>
    </div>
  )
})

export { PillField, type PillFieldProps }
