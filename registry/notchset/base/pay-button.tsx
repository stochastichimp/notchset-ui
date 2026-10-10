"use client"

/**
 * Pay Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/pay-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, DrawCheck, RollingLabel, Spinner, useTimeline, wait } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Pay + Receipt: Pay rolls to Charging while your onPay runs, then to Paid, and a receipt prints out
 * from under the button in ten jerks like a thermal printer, with the printer's ticks and a till's
 * three notes. It retracts on its own after a few seconds.
 */

type PayState = "idle" | "charging" | "paid"

interface ReceiptLine {
  label: React.ReactNode
  value: React.ReactNode
  /** Draw a dashed rule above this line. */
  divider?: boolean | undefined
  /** The value in the foreground colour (totals, status). */
  strong?: boolean | undefined
}

interface PayButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  /** The charge. Return a promise: Paid and the receipt show only when it resolves. */
  onPay?: (() => unknown) | undefined
  onError?: ((error: unknown) => void) | undefined
  /** Called as the success state shows (after the work resolves and the minimum time), so anything that follows the button lands with it. */
  onSuccess?: (() => void) | undefined
  /** Shown beside Pay, e.g. "$49.00". */
  amount?: React.ReactNode | undefined
  /** Shown beside Charging, e.g. "···· 4242". */
  method?: React.ReactNode | undefined
  label?: React.ReactNode | undefined
  chargingLabel?: React.ReactNode | undefined
  paidLabel?: React.ReactNode | undefined
  /** The receipt's lines; null prints nothing. */
  receipt?: readonly ReceiptLine[] | null | undefined
  /** The least time Charging shows (ms). Default 1300. */
  minDuration?: number | undefined
  /** How long the receipt stays out (ms). Default 3500. */
  receiptFor?: number | undefined
  sound?: boolean | undefined
}

const RECEIPT: ReceiptLine[] = [
  { label: "Pro plan", value: "$49.00", strong: true },
  { label: "Visa ···· 4242", value: "Yearly" },
  { label: "#INV-2041", value: "Paid", divider: true, strong: true },
]

const PayButton = React.forwardRef<HTMLButtonElement, PayButtonProps>(function PayButton(
  {
    onPay,
    onError,
    onSuccess,
    amount = "$49.00",
    method = "···· 4242",
    label = "Pay",
    chargingLabel = "Charging",
    paidLabel = "Paid",
    receipt = RECEIPT,
    minDuration = 1300,
    receiptFor = 3500,
    sound = true,
    disabled,
    className,
    ...props
  },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [state, setState] = React.useState<PayState>("idle")
  const [printed, setPrinted] = React.useState(false)
  const [shakes, setShakes] = React.useState(0)

  const pay = async () => {
    if (state !== "idle" || disabled) return
    sfx.press()
    setState("charging")
    try {
      await Promise.all([onPay?.(), wait(minDuration)])
    } catch (error) {
      sfx.buzz()
      setShakes((n) => n + 1)
      setState("idle")
      onError?.(error)
      return
    }
    onSuccess?.()
    setState("paid")
    if (receipt) {
      setPrinted(true)
      sfx.print(10)
      timeline.after(780, () => sfx.cash())
    } else sfx.chime()
    timeline.after(receiptFor, () => setPrinted(false))
    timeline.after(receiptFor + 500, () => setState("idle"))
  }

  return (
    <div data-slot="pay-button" data-notchset="" className={cn("inline-flex flex-col items-center", className)}>
      <button
        ref={ref}
        type="button"
        data-slot="pay-button-trigger"
        data-state={state}
        aria-busy={state === "charging" || undefined}
        disabled={disabled}
        onClick={() => void pay()}
        className="relative z-[2] inline-flex h-11 w-[204px] max-w-full shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius)] border border-transparent bg-[var(--primary)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--primary-foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] hover:bg-[color-mix(in_oklab,var(--primary)_86%,var(--background))] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        {...props}
      >
        <span key={shakes} className={cn("block w-full", shakes > 0 && "animate-[ns-shake_.42s]")}>
          <RollingLabel
            index={state === "idle" ? 0 : state === "charging" ? 1 : 2}
            rows={[
              <span key="pay" className="flex items-center gap-2">
                {label}
                {amount != null && <span className="font-mono text-[length:var(--ns-type-note)] tabular-nums opacity-70">{amount}</span>}
              </span>,
              <span key="charging" className="flex items-center gap-2">
                <Spinner />
                {chargingLabel}
                {method != null && <span className="font-mono text-[length:var(--ns-type-note)] opacity-70">{method}</span>}
              </span>,
              <span key="paid" className="flex items-center gap-2">
                <DrawCheck shown={state === "paid"} className="size-[15px]" />
                {paidLabel}
              </span>,
            ]}
          />
        </span>
        <Announcer message={state === "charging" ? "Charging" : state === "paid" ? "Paid" : ""} />
      </button>
      {receipt && (
        <div aria-hidden={!printed || undefined} className="relative z-[1] -mt-1.5 h-[98px] w-[178px] max-w-full overflow-hidden">
          <div
            data-slot="pay-button-receipt"
            className={cn(
              "flex flex-col gap-1.5 border border-t-0 border-[var(--border)] bg-[var(--background)] px-3.5 pt-4 pb-3.5 font-mono text-[11px] text-[var(--muted-foreground)] [mask:linear-gradient(#000_0_0)_top/100%_calc(100%-5px)_no-repeat,conic-gradient(from_-45deg_at_bottom,#0000,#000_1deg_89deg,#0000_90deg)_bottom/10px_5px_repeat-x]",
              printed ? "translate-y-0 [transition:transform_.75s_steps(10,end),scale_.75s_steps(10,end),translate_.75s_steps(10,end),rotate_.75s_steps(10,end)]" : "-translate-y-full [transition:transform_.45s_cubic-bezier(.4,0,.2,1),scale_.45s_cubic-bezier(.4,0,.2,1),translate_.45s_cubic-bezier(.4,0,.2,1),rotate_.45s_cubic-bezier(.4,0,.2,1)]"
            )}
          >
            {receipt.map((line, i) => (
              <div key={i} className={cn("flex justify-between gap-2", line.divider && "border-t border-dashed border-[var(--border)] pt-1.5")}>
                <span className="min-w-0 truncate">{line.label}</span>
                <span className={cn("shrink-0", line.strong && "text-[var(--foreground)]")}>{line.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export { PayButton, type PayButtonProps, type ReceiptLine }
