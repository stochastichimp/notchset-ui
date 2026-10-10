"use client"

/**
 * Billing Period (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/billing-period
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { RollingLabel } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Billing Period: a Monthly / Yearly switch over a twelve-month strip and a plan list. Going yearly
 * turns the free months at the end of the strip green, lifting each 3px 110ms apart; prices count down,
 * the monthly price is struck out beside them, the billing lines roll, and the saving chip follows the
 * chosen plan. A rising triad plays on yearly.
 */

interface BillingPlan {
  id: string
  name: string
  description?: React.ReactNode | undefined
  /** Per month, billed monthly. */
  monthly: number
  /** Per month, billed yearly. */
  yearly: number
}

interface BillingPeriodProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange" | "title"> {
  plans: readonly BillingPlan[]
  value: string
  onValueChange: (id: string) => void
  yearly: boolean
  onYearlyChange: (yearly: boolean) => void
  title?: React.ReactNode | undefined
  currency?: string | undefined
  /** Months at the end of the strip that turn free on yearly. */
  freeMonths?: number | undefined
  months?: readonly string[] | undefined
  sound?: boolean | undefined
}

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]

const BillingPeriod = React.forwardRef<HTMLDivElement, BillingPeriodProps>(function BillingPeriod(
  { plans, value, onValueChange, yearly, onYearlyChange, title = "Pick a plan", currency = "$", freeMonths = 2, months = MONTHS, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const plan = plans.find((p) => p.id === value) ?? plans[0]
  const saving = plan ? (plan.monthly - plan.yearly) * 12 : 0
  const setYearly = (v: boolean) => {
    if (v === yearly) return
    if (v) {
      sfx.tone(880, 0.05, "triangle", 0.035, 0, 1100)
      sfx.tone(1320, 0.14, "sine", 0.035, 0.18)
      sfx.tone(1568, 0.16, "sine", 0.035, 0.3)
    } else sfx.tone(880, 0.05, "triangle", 0.035, 0, 660)
    onYearlyChange(v)
  }
  const keys = (e: React.KeyboardEvent<HTMLElement>, n: number, at: number, pick: (k: number) => void) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return
    e.preventDefault()
    const k = (at + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + n) % n
    pick(k)
    ;(e.currentTarget.querySelectorAll("[role=radio]")[k] as HTMLElement | undefined)?.focus()
  }
  const free = months.length - freeMonths

  return (
    <div ref={ref} data-slot="billing-period" data-notchset="" className={cn("flex w-full max-w-[470px] flex-col gap-4 rounded-[22px] border border-[var(--border)] bg-[var(--background)] p-[18px]", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[15px] font-semibold tracking-[var(--ns-tracking-control)]">{title}</span>
        <div role="radiogroup" aria-label="Billing period" dir="ltr" onKeyDown={(e) => keys(e, 2, yearly ? 1 : 0, (k) => setYearly(k === 1))} className="relative flex rounded-full bg-[var(--muted)] p-[3px]">
          <span aria-hidden="true" className="absolute start-[3px] top-[3px] h-8 w-[88px] rounded-full bg-[var(--background)] shadow-[0_1px_3px_rgba(0,0,0,.12)] [transition:translate_.45s_cubic-bezier(.2,1.25,.3,1)] motion-reduce:transition-none" style={{ translate: yearly ? "88px 0" : "0 0" }} />
          {(["Monthly", "Yearly"] as const).map((l, k) => {
            const on = (k === 1) === yearly
            return (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setYearly(k === 1)}
                className={cn("relative h-[var(--ns-control-compact)] w-[88px] cursor-pointer rounded-full text-[length:var(--ns-type-label)] font-medium outline-none [transition:color_var(--ns-time-color)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", on ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
              >
                {l}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-col gap-[7px]">
        <div aria-hidden="true" className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
          {months.map((m, j) => {
            const isFree = yearly && j >= free
            return (
              <span
                key={j}
                className={cn("grid h-[26px] place-items-center rounded-[6px] font-mono text-[10px] font-semibold [transition:background-color_.35s,color_.35s,translate_.45s_var(--ns-ease-rebound)] motion-reduce:transition-none", isFree ? "bg-[color-mix(in_oklab,var(--success,var(--chart-3))_20%,transparent)] text-[color-mix(in_oklab,var(--success,var(--chart-3))_70%,var(--foreground))]" : "bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
                style={{ translate: isFree ? "0 -3px" : "0 0", transitionDelay: isFree ? `${(j - free) * 110 + 150}ms` : "0ms" }}
              >
                {m}
              </span>
            )
          })}
        </div>
        <div className="flex items-center justify-between gap-2.5 text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
          <RollingLabel size="sm" align="start" index={yearly ? 1 : 0} rows={[
              <React.Fragment key="m">
                Billed every month<span className="max-[480px]:hidden">, cancel anytime</span>
              </React.Fragment>,
              `Pay for ${free} months, use all ${months.length}`,
            ]} />
          <span className="font-mono text-[11px] whitespace-nowrap text-[color-mix(in_oklab,var(--success,var(--chart-3))_70%,var(--foreground))] [transition:opacity_.3s_.2s]" style={{ opacity: yearly ? 1 : 0 }}>
            {freeMonths} months free
          </span>
        </div>
      </div>
      <div role="radiogroup" aria-label="Plan" onKeyDown={(e) => keys(e, plans.length, plans.indexOf(plan!), (k) => pickPlan(k))} className="flex flex-col border-t border-[var(--border)]">
        {plans.map((p, i) => {
          const on = p.id === plan?.id
          return (
            <div
              key={p.id}
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => pickPlan(i)}
              className="grid cursor-pointer grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-[var(--border)] px-1 py-3.5 outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-inset"
            >
              <span aria-hidden="true" className={cn("size-[18px] rounded-full [transition:border-width_.3s_var(--ns-ease-pop),border-color_var(--ns-time-state)]", on ? "border-[5.5px] border-[var(--foreground)]" : "border-[1.5px] border-[var(--border)]")} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[length:var(--ns-type-copy)] font-semibold">{p.name}</span>
                {p.description && <span className="truncate text-[12.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{p.description}</span>}
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="block overflow-hidden font-mono text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] line-through [transition:max-width_.45s_cubic-bezier(.2,1.2,.3,1),opacity_var(--ns-time-state)]" style={{ maxWidth: yearly ? 40 : 0, opacity: yearly ? 1 : 0 }}>
                    {currency}
                    {p.monthly}
                  </span>
                  <span className="flex items-baseline text-[22px] font-semibold tracking-[-0.03em]">
                    <span className="me-px text-[length:var(--ns-type-copy)] font-medium">{currency}</span>
                    <NumberFlow value={yearly ? p.yearly : p.monthly} />
                  </span>
                  <span className="text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">/mo</span>
                </span>
                <span className="text-[11.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
                  <span className="block h-4 overflow-hidden">
                    <span className="flex flex-col items-end [transition:translate_.5s_var(--ns-ease-reshape)] motion-reduce:transition-none" style={{ translate: yearly ? "0 -16px" : "0 0" }}>
                      <span aria-hidden={yearly || undefined} className="h-4 leading-4 whitespace-nowrap">
                        billed monthly
                      </span>
                      <span aria-hidden={!yearly || undefined} className="h-4 leading-4 whitespace-nowrap">
                        {currency}
                        {p.yearly * 12} billed yearly
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </div>
          )
        })}
      </div>
      {plan && (
        <div
          aria-live="polite"
          className={cn(
            "flex items-center gap-2 rounded-[12px] px-3 py-2.5 text-[length:var(--ns-type-label)] font-medium [transition:background-color_.35s,color_.35s]",
            yearly ? "bg-[color-mix(in_oklab,var(--success,var(--chart-3))_12%,transparent)] text-[color-mix(in_oklab,var(--success,var(--chart-3))_75%,var(--foreground))]" : "bg-[var(--muted)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
          )}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" />
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
          </svg>
          <span className="flex min-w-0 items-center gap-1 whitespace-nowrap">
            <span>{yearly ? "Saving" : "Yearly would save"}</span>
            <span className="flex items-center leading-none">
              {currency}
              <NumberFlow value={saving} />
            </span>
            <span className="truncate">a year on {plan.name}</span>
          </span>
        </div>
      )}
    </div>
  )

  function pickPlan(i: number) {
    const p = plans[i]
    if (!p || p.id === plan?.id) return
    sfx.tone(1000 + i * 120, 0.03, "triangle", 0.035)
    onValueChange(p.id)
  }
})

export { BillingPeriod, type BillingPeriodProps, type BillingPlan }
