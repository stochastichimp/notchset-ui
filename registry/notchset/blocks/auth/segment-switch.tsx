"use client"


import { cn } from "@/lib/utils"
import { Segmented } from "@/lib/notchset/segmented"

/*
 * Segment Switch: a radiogroup of two or three options with a sliding thumb (lib/segmented). solid: a
 * white pill with a foreground thumb that slides and resizes to the option; soft: a muted bar of equal
 * options with a white thumb. Arrow keys move the choice.
 */

interface SegmentOption<T extends string> {
  value: T
  label: string
}

interface SegmentSwitchProps<T extends string> {
  label: string
  options: readonly SegmentOption<T>[]
  value: T
  onValueChange: (value: T) => void
  variant?: "solid" | "soft" | undefined
  className?: string | undefined
}

function SegmentSwitch<T extends string>({ label, options, value, onValueChange, variant = "solid", className }: SegmentSwitchProps<T>) {
  const solid = variant === "solid"
  return (
    <Segmented
      label={label}
      options={options}
      value={value}
      onValueChange={onValueChange}
      data-slot="segment-switch"
      className={cn("rounded-full p-1", solid ? "flex bg-[var(--background)] shadow-[0_1px_2px_rgba(0,0,0,.05)]" : "grid bg-[var(--muted)]", className)}
      style={solid ? undefined : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      thumb={(style) => (
        <span
          aria-hidden="true"
          className={cn(
            "top-1 bottom-1 rounded-full [transition:translate_.5s_var(--ns-ease-reshape),width_.5s_var(--ns-ease-reshape)] motion-reduce:transition-none",
            solid ? "bg-[var(--foreground)]" : "bg-[var(--background)] shadow-[0_1px_2px_rgba(0,0,0,.1),0_2px_8px_-2px_rgba(0,0,0,.1)]",
          )}
          style={style}
        />
      )}
      option={({ option, on, props }) => (
        <button
          {...props}
          className={cn(
            "relative cursor-pointer outline-none rounded-full px-[var(--ns-inset-compact)] text-[13.5px] font-medium whitespace-nowrap [transition:color_var(--ns-time-state)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-1",
            solid ? "h-[var(--ns-control-compact)]" : "h-9",
            on && solid && "text-[var(--background)]",
            on && !solid && "text-[var(--foreground)]",
            !on && "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]",
          )}
        >
          {option.label}
        </button>
      )}
    />
  )
}

export { SegmentSwitch, type SegmentSwitchProps, type SegmentOption }
