"use client"

/**
 * Step Accordion (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/step-accordion
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Collapse } from "@/lib/notchset/collapse"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { RollingLabel, Spinner } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Step Accordion: a checkout in one card. Each step's number turns into a green check when it's done,
 * its summary slides open under the title, and Edit brings it back. Continue validates the step (an
 * invalid one shakes and buzzes) and opens the next unfinished one. Place order stays muted until every
 * step is done, then rolls Placing… → ✓ Order placed.
 */

interface Step {
  id: string
  title: React.ReactNode
  /** Shown under the title once the step is done. */
  summary?: React.ReactNode | undefined
  content: React.ReactNode
  /** Return false to block Continue (show your own field error). */
  validate?: (() => boolean) | undefined
}

interface StepAccordionProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  steps: readonly Step[]
  /** The order total, e.g. "$137.00"; it rolls when it changes. */
  total?: string | undefined
  /** Resolve when the order is placed. */
  onPlace: () => Promise<void> | void
  continueLabel?: string | undefined
  placeLabels?: readonly [React.ReactNode, React.ReactNode, React.ReactNode] | undefined
  sound?: boolean | undefined
}

/** A radio option row for step content: dot pops in, border and ring darken. */
function StepOption({ checked, onSelect, title, note, aside, sound = true }: { checked: boolean; onSelect: () => void; title: React.ReactNode; note?: React.ReactNode | undefined; aside?: React.ReactNode | undefined; sound?: boolean | undefined }) {
  const { sfx } = useSound(sound)
  return (
    <button
      type="button"
      data-slot="step-option"
      role="radio"
      aria-checked={checked}
      onClick={() => {
        if (checked) return
        sfx.tick()
        onSelect()
      }}
      className={cn(
        "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[12px] border bg-[var(--background)] px-[var(--ns-inset-compact)] py-1.5 text-start text-[var(--foreground)] outline-none [transition:border-color_var(--ns-time-color),box-shadow_.25s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]",
        checked ? "border-[var(--foreground)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--foreground)_8%,transparent)]" : "border-[var(--border)]"
      )}
    >
      <span aria-hidden="true" className={cn("grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] [transition:border-color_var(--ns-time-color)]", checked ? "border-[var(--foreground)]" : "border-[var(--border)]")}>
        <span className={cn("size-2 rounded-full bg-[var(--foreground)] [transition:scale_.4s_cubic-bezier(.2,1.7,.4,1)]", checked ? "scale-100" : "scale-0")} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-[length:var(--ns-type-copy)] font-medium">{title}</span>
        {note && <span className="text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{note}</span>}
      </span>
      {aside && <span className="font-mono text-[length:var(--ns-type-label)] whitespace-nowrap">{aside}</span>}
    </button>
  )
}

const StepAccordion = React.forwardRef<HTMLDivElement, StepAccordionProps>(function StepAccordion(
  { steps, total, onPlace, continueLabel = "Continue", placeLabels = ["Place order", "Placing…", "✓ Order placed"], sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const base = React.useId()
  const [open, setOpen] = React.useState<string | null>(steps[0]?.id ?? null)
  const [done, setDone] = React.useState<string[]>([])
  const [shake, setShake] = React.useState<{ id: string; n: number } | null>(null)
  const [place, setPlace] = React.useState<0 | 1 | 2>(0)
  const all = steps.every((s) => done.includes(s.id))

  const next = (s: Step, i: number) => {
    if (s.validate && !s.validate()) {
      sfx.buzz()
      setShake((x) => ({ id: s.id, n: (x?.n ?? 0) + 1 }))
      return
    }
    const nowDone = done.includes(s.id) ? done : [...done, s.id]
    setDone(nowDone)
    sfx.ding(Math.min(4, i + 1))
    setOpen(steps.find((x) => !nowDone.includes(x.id))?.id ?? null)
  }
  const placeOrder = async () => {
    if (place) return
    if (!all) {
      sfx.buzz()
      return
    }
    sfx.press()
    setPlace(1)
    try {
      await onPlace()
      setPlace(2)
      sfx.chime()
    } catch {
      sfx.buzz()
      setPlace(0)
    }
  }

  return (
    <div ref={ref} data-slot="step-accordion" data-notchset="" className={cn("flex w-full max-w-[420px] flex-col gap-3 text-[var(--foreground)]", className)} {...props}>
      <ol className="m-0 list-none overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--background)] p-0">
        {steps.map((s, i) => {
          const on = open === s.id
          const ok = done.includes(s.id)
          return (
            <li key={s.id} className={cn("-mt-px border-t border-[var(--border)] [transition:background-color_.3s]", on ? "bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)]" : "bg-transparent")}>
              <div className="flex min-h-[52px] items-center gap-3 py-2 ps-3.5 pe-2.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative grid size-[22px] shrink-0 place-items-center rounded-full font-mono text-[length:var(--ns-type-note)] [transition:background-color_.35s,color_.35s,box-shadow_.35s]",
                    ok && "bg-[var(--success,var(--foreground))] text-[var(--success-foreground,var(--background))]",
                    !ok && on && "bg-[var(--foreground)] text-[var(--background)]",
                    !ok && !on && "shadow-[inset_0_0_0_1px_var(--border)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
                  )}
                >
                  <span className={cn("[transition:opacity_.2s]", ok ? "opacity-0" : "opacity-100")}>{i + 1}</span>
                  <svg viewBox="0 0 24 24" className={cn("absolute size-3 [transition:scale_.45s_cubic-bezier(.2,1.7,.4,1)]", ok ? "scale-100" : "scale-0")} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span id={`${base}-t-${i}`} className="text-[length:var(--ns-type-copy)] font-medium">
                    {s.title}
                    <span className="sr-only">{ok ? ", done" : on ? ", current step" : ""}</span>
                  </span>
                  <Collapse open={ok && !on}>
                    <span className="block truncate pt-0.5 font-mono text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{s.summary}</span>
                  </Collapse>
                </span>
                <button
                  type="button"
                  aria-label={`Edit ${typeof s.title === "string" ? s.title : "step"}`}
                  tabIndex={ok && !on && !place ? 0 : -1}
                  onClick={() => {
                    sfx.open()
                    setOpen(s.id)
                  }}
                  className={cn("h-[30px] cursor-pointer rounded-[var(--radius)] px-2.5 text-[length:var(--ns-type-label)] font-medium outline-none [transition:opacity_.25s,background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", ok && !on && !place ? "opacity-100" : "pointer-events-none opacity-0")}
                >
                  Edit
                </button>
              </div>
              <Collapse open={on} labelledBy={`${base}-t-${i}`}>
                <div key={shake?.id === s.id ? shake.n : 0} className={cn("flex flex-col gap-2 ps-12 pe-3.5 pb-3.5", shake?.id === s.id && "animate-[ns-shake_.42s] motion-reduce:animate-none")}>
                  {s.content}
                  <button
                    type="button"
                    onClick={() => next(s, i)}
                    className="inline-flex h-[var(--ns-control-compact)] cursor-pointer items-center self-start rounded-[var(--radius)] bg-[var(--primary)] px-3.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap text-[var(--primary-foreground)] outline-none [transition:scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95"
                  >
                    {continueLabel}
                  </button>
                </div>
              </Collapse>
            </li>
          )
        })}
      </ol>
      <div className="flex items-center justify-between gap-3 px-1">
        {total !== undefined && (
          <span className="flex flex-col">
            <span className="text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">Total</span>
            <span className="font-mono text-[18px] font-medium tabular-nums">
              <NumberFlow value={total} />
            </span>
          </span>
        )}
        <button
          type="button"
          aria-disabled={!all || undefined}
          aria-busy={place === 1 || undefined}
          onClick={() => void placeOrder()}
          className={cn(
            "ms-auto inline-flex h-[var(--ns-control-regular)] cursor-pointer items-center justify-center rounded-[var(--radius)] px-5 text-[length:var(--ns-type-copy)] font-medium outline-none [transition:background-color_.3s,color_.3s,scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.97]",
            !all && "bg-[var(--muted)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]",
            all && place === 2 && "bg-[var(--success,var(--foreground))] text-[var(--success-foreground,var(--background))]",
            all && place !== 2 && "bg-[var(--primary)] text-[var(--primary-foreground)]"
          )}
        >
          <RollingLabel
            index={place}
            rows={[
              <React.Fragment key="a">{placeLabels[0]}</React.Fragment>,
              <React.Fragment key="b">
                <Spinner className="size-3.5" />
                {placeLabels[1]}
              </React.Fragment>,
              <React.Fragment key="c">{placeLabels[2]}</React.Fragment>,
            ]}
          />
        </button>
      </div>
    </div>
  )
})

export { StepAccordion, StepOption, type Step, type StepAccordionProps }
