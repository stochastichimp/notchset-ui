"use client"

/**
 * Billing Switch (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/billing-switch
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Segmented } from "@/lib/notchset/segmented"
import { useSound } from "@/lib/notchset/sound"

/*
 * The blocks' Monthly / Yearly switch: a pill whose thumb slides and widens to the chosen option (Yearly
 * is wider, it carries a saving chip that scales up when chosen). soft: a muted pill with a white thumb;
 * solid: a white pill with a foreground thumb. Yearly plays a two-note rise and three sparkle ticks;
 * Monthly a falling tick.
 */

interface BillingSwitchProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  yearly: boolean
  onYearlyChange: (yearly: boolean) => void
  monthlyLabel?: string | undefined
  yearlyLabel?: string | undefined
  /** The chip beside Yearly, e.g. "2 months free"; omit for none. */
  saving?: string | undefined
  /** soft (muted pill, white thumb) or solid (white pill, foreground thumb). */
  variant?: "soft" | "solid" | undefined
  /** The Monthly and Yearly option widths, px. */
  widths?: readonly [number, number] | undefined
  /** default (38px options) or sm (36px); solid defaults to sm. */
  size?: "default" | "sm" | undefined
  sound?: boolean | undefined
}

const BillingSwitch = React.forwardRef<HTMLDivElement, BillingSwitchProps>(function BillingSwitch(
  { yearly, onYearlyChange, monthlyLabel = "Monthly", yearlyLabel = "Yearly", saving, variant = "soft", widths, size, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const set = (v: boolean) => {
    if (v === yearly) return
    if (v) sfx.yearly()
    else sfx.monthly()
    onYearlyChange(v)
  }
  // Widths in px: Yearly is wider when it carries the chip. The options can shrink in a narrow
  // container; the thumb follows their measured widths (lib/segmented).
  const w = widths ?? (variant === "solid" ? [104, saving ? 168 : 104] : [112, saving ? 176 : 112])
  const solid = variant === "solid"
  const short = size ? size === "sm" : solid

  return (
    <Segmented
      ref={ref}
      label="Billing period"
      value={yearly ? "yearly" : "monthly"}
      onValueChange={(v) => set(v === "yearly")}
      options={[
        { value: "monthly", label: monthlyLabel },
        {
          value: "yearly",
          label: (
            <>
              {yearlyLabel}
              {saving && (
                <span
                  className={cn(
                    "flex h-[22px] items-center rounded-full px-2 text-[length:var(--ns-type-note)] font-semibold whitespace-nowrap [transition:scale_.45s_cubic-bezier(.2,1.7,.4,1),color_var(--ns-time-state)] motion-reduce:transition-none",
                    solid ? "bg-[color-mix(in_oklab,var(--success,var(--primary))_22%,transparent)]" : "bg-[color-mix(in_oklab,var(--success,var(--primary))_16%,transparent)]",
                    solid && yearly ? "text-[color-mix(in_oklab,var(--success,var(--foreground))_60%,var(--background))]" : "text-[color-mix(in_oklab,var(--success,var(--foreground))_70%,var(--foreground))]"
                  )}
                  style={{ scale: yearly || solid ? 1 : 0.92 }}
                >
                  {saving}
                </span>
              )}
            </>
          ),
        },
      ]}
      data-slot="billing-switch"
      data-notchset=""
      data-variant={variant}
      className={cn("flex max-w-full rounded-full p-1", solid ? "bg-[var(--background)] shadow-[0_1px_2px_rgba(0,0,0,.05)]" : "bg-[var(--muted)]", className)}
      thumb={(style) => (
        <span
          aria-hidden="true"
          className={cn(
            "top-1 rounded-full [transition:translate_.5s_var(--ns-ease-reshape),width_.5s_var(--ns-ease-reshape)] motion-reduce:transition-none",
            short ? "h-9" : "h-[38px]",
            solid ? "bg-[var(--foreground)]" : "bg-[var(--background)] shadow-[0_1px_2px_rgba(0,0,0,.1),0_2px_8px_-2px_rgba(0,0,0,.1)]",
          )}
          style={style}
        />
      )}
      option={({ option, on, index: i, props }) => (
        <button
          {...props}
          className={cn(
            "relative cursor-pointer outline-none rounded-full px-2.5 text-[length:var(--ns-type-copy)] font-medium whitespace-nowrap [transition:color_var(--ns-time-color)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-1",
            i === 1 && "flex items-center justify-center gap-2",
            short ? "h-9" : "h-[38px]",
            !on && "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]",
            on && solid && "text-[var(--background)]",
            on && !solid && "text-[var(--foreground)]",
          )}
          style={{ flex: `0 1 ${w[i] ?? 0}px` }}
        >
          {option.label}
        </button>
      )}
      // Before measuring: the padding (4px), then the options at their set widths.
      estimate={(i) => ({ x: 4 + (i ? w[0] ?? 0 : 0), w: w[i] ?? 0 })}
      {...props}
    />
  )
})

export { BillingSwitch, type BillingSwitchProps }
