"use client"

/**
 * Add to Bag (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/add-to-bag
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Add to Bag: the button contracts into a quantity stepper once something is in the bag. Each step's
 * pitch climbs with the count, the digit rolls, the plus shakes and buzzes at the limit, and going below
 * one springs it back into the button (the minus turns into a red trash at one). Controlled (value) or
 * not (defaultValue). Pass `price` to show it after the label.
 */

interface AddToBagProps extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "children"> {
  value?: number | undefined
  defaultValue?: number | undefined
  onValueChange?: ((quantity: number) => void) | undefined
  /** The most it allows, 1–9. Default 9. */
  max?: number | undefined
  label?: React.ReactNode | undefined
  /** Shown after the label behind a hairline, e.g. "$18". */
  price?: React.ReactNode | undefined
  /** The product's name, for the stepper's accessible labels. */
  itemName?: string | undefined
  disabled?: boolean | undefined
  sound?: boolean | undefined
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

const AddToBag = React.forwardRef<HTMLDivElement, AddToBagProps>(function AddToBag(
  { value, defaultValue = 0, onValueChange, max = 9, label = "Add to bag", price, itemName = "item", disabled, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const limit = Math.max(1, Math.min(9, Math.floor(Number.isFinite(max) ? max : 9)))
  const [inner, setInner] = React.useState(defaultValue)
  const quantity = Math.max(0, Math.min(limit, Math.floor(value ?? inner)))
  const [shakes, setShakes] = React.useState(0)
  const add = React.useRef<HTMLButtonElement>(null)
  const minus = React.useRef<HTMLButtonElement>(null)

  const set = (next: number) => {
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }
  const open = quantity > 0
  return (
    <div
      ref={ref}
      data-slot="add-to-bag"
      data-notchset=""
      data-state={open ? "stepper" : "button"}
      className={cn("relative h-11 overflow-hidden rounded-[var(--radius)] [transition:width_.5s_cubic-bezier(.2,1.25,.3,1)]", open && "w-[124px]", !open && price == null && "w-[152px]", !open && price != null && "w-[196px]", className)}
      {...props}
    >
      <button
        ref={add}
        type="button"
        disabled={disabled}
        aria-hidden={open || undefined}
        tabIndex={open ? -1 : undefined}
        onClick={() => {
          sfx.pop()
          set(1)
          requestAnimationFrame(() => minus.current?.focus())
        }}
        className={cn(
          "absolute inset-0 flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] whitespace-nowrap text-[var(--primary-foreground)] outline-none [transition:opacity_.2s,transform_.35s_var(--ns-ease-reshape),scale_.35s_var(--ns-ease-reshape),translate_.35s_var(--ns-ease-reshape),rotate_.35s_var(--ns-ease-reshape)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-40",
          open ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100 active:scale-[var(--ns-press-depth)]"
        )}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
        {label}
        {price != null && (
          <>
            <span aria-hidden="true" className="h-4 w-px bg-[color-mix(in_oklab,var(--primary-foreground)_30%,transparent)]" />
            <span className="font-mono text-[length:var(--ns-type-label)] opacity-85">{price}</span>
          </>
        )}
      </button>
      <div
        role="group"
        aria-label={`Quantity of ${itemName}`}
        aria-hidden={!open || undefined}
        className={cn("absolute inset-0 flex items-center justify-between rounded-[var(--radius)] bg-[var(--primary)] px-[5px] text-[var(--primary-foreground)] [transition:opacity_.25s]", open ? "opacity-100" : "pointer-events-none opacity-0")}
      >
        <button
          ref={minus}
          type="button"
          aria-label={quantity <= 1 ? `Remove ${itemName}` : "Decrease"}
          tabIndex={open ? undefined : -1}
          disabled={disabled}
          onClick={() => {
            const next = quantity - 1
            if (next <= 0) {
              sfx.drop()
              set(0)
              requestAnimationFrame(() => add.current?.focus())
              return
            }
            sfx.step(next)
            set(next)
          }}
          className="grid size-[34px] cursor-pointer place-items-center rounded-[var(--radius)] outline-none [transition:background-color_.15s,transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[color-mix(in_oklab,var(--primary-foreground)_16%,transparent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[var(--primary-foreground)] active:scale-[.85]"
        >
          <span className="relative grid size-[15px] place-items-center">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="absolute size-[15px] [transition:opacity_.2s,scale_.35s_var(--ns-ease-pop)]" style={{ opacity: quantity <= 1 ? 0 : 1, scale: quantity <= 1 ? ".4" : "1" }} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="absolute size-[15px] text-[color-mix(in_oklab,var(--destructive)_70%,var(--primary-foreground))] [transition:opacity_.2s,scale_.35s_var(--ns-ease-pop)]" style={{ opacity: quantity <= 1 ? 1 : 0, scale: quantity <= 1 ? "1" : ".4" }} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </span>
        </button>
        <span aria-hidden="true" className="block h-5 w-3 overflow-hidden text-center font-mono text-[15px] leading-5 font-medium">
          <span className="flex flex-col [transition:transform_.45s_cubic-bezier(.2,1.4,.3,1),scale_.45s_cubic-bezier(.2,1.4,.3,1),translate_.45s_cubic-bezier(.2,1.4,.3,1),rotate_.45s_cubic-bezier(.2,1.4,.3,1)]" style={{ transform: `translateY(${-quantity * 20}px)` }}>
            {DIGITS.map((d) => (
              <span key={d} className="h-5">
                {d}
              </span>
            ))}
          </span>
        </span>
        <button
          type="button"
          aria-label="Increase"
          tabIndex={open ? undefined : -1}
          disabled={disabled}
          onClick={() => {
            if (quantity >= limit) {
              sfx.buzz()
              setShakes((n) => n + 1)
              return
            }
            sfx.step(quantity + 1)
            set(quantity + 1)
          }}
          className="grid size-[34px] cursor-pointer place-items-center rounded-[var(--radius)] outline-none [transition:background-color_.15s,transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[color-mix(in_oklab,var(--primary-foreground)_16%,transparent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[var(--primary-foreground)] active:scale-[.85]"
        >
          <span key={shakes} className={cn("grid place-items-center", shakes > 0 && "animate-[ns-shake_.4s]")}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </span>
        </button>
      </div>
      <Announcer message={open ? `${quantity} in bag` : ""} />
    </div>
  )
})

export { AddToBag, type AddToBagProps }
