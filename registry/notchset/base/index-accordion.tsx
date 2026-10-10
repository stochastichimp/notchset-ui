"use client"

/**
 * Index Accordion (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/index-accordion
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { accordionKeys, Collapse, useOpenSet } from "@/lib/notchset/collapse"
import { useSound } from "@/lib/notchset/sound"

/*
 * Index Accordion: numbered questions. The plus turns into a minus as its circle spins and fills, and
 * the answer sharpens in from a blur just after the height opens. One open or many; ↑/↓, Home and End
 * move between questions.
 */

interface IndexItem {
  id: string
  question: React.ReactNode
  answer: React.ReactNode
}

interface IndexAccordionProps extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  items: readonly IndexItem[]
  type?: "single" | "multiple" | undefined
  value?: readonly string[] | undefined
  defaultValue?: readonly string[] | undefined
  onValueChange?: ((open: string[]) => void) | undefined
  sound?: boolean | undefined
}

const IndexAccordion = React.forwardRef<HTMLDivElement, IndexAccordionProps>(function IndexAccordion({ items, type = "single", value, defaultValue, onValueChange, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const base = React.useId()
  const { open, toggle } = useOpenSet({ type, value, defaultValue, onValueChange })

  return (
    <div ref={ref} data-slot="index-accordion" data-notchset="" onKeyDown={accordionKeys} className={cn("border-t border-[var(--border)] text-[var(--foreground)]", className)} {...props}>
      {items.map((it, i) => {
        const on = open.includes(it.id)
        return (
          <div key={it.id} className="border-b border-[var(--border)]">
            <h3 className="m-0">
              <button
                id={`${base}-t-${i}`}
                type="button"
                data-accordion-trigger=""
                aria-expanded={on}
                aria-controls={`${base}-p-${i}`}
                onClick={() => {
                  if (toggle(it.id)) sfx.open()
                  else sfx.close()
                }}
                className="grid min-h-[62px] w-full cursor-pointer grid-cols-[30px_minmax(0,1fr)_28px] items-center gap-3 rounded-[12px] px-1 py-2.5 text-start outline-none focus-visible:shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--foreground)_14%,transparent)]"
              >
                <span className={cn("font-mono text-[length:var(--ns-type-note)] [transition:color_.3s]", on ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[15px] font-medium tracking-[var(--ns-tracking-control)] text-pretty">{it.question}</span>
                <span
                  aria-hidden="true"
                  className={cn("relative size-7 rounded-full [transition:background-color_.3s,color_.3s,rotate_.5s_var(--ns-ease-reshape)]", on ? "rotate-180 bg-[var(--foreground)] text-[var(--background)]" : "rotate-0 bg-[var(--muted)] text-[var(--foreground)]")}
                >
                  <span className="absolute start-2 top-[13px] h-0.5 w-3 rounded-[1px] bg-current" />
                  <span className={cn("absolute start-[13px] top-2 h-3 w-0.5 rounded-[1px] bg-current [transition:scale_.4s_var(--ns-ease-rebound)]", on ? "scale-y-0" : "scale-y-100")} />
                </span>
              </button>
            </h3>
            <Collapse id={`${base}-p-${i}`} open={on} labelledBy={`${base}-t-${i}`}>
              <div
                className="ps-[46px] pe-11 pb-5 text-[length:var(--ns-type-copy)] leading-[1.6] text-pretty text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] motion-reduce:transition-none!"
                style={{
                  opacity: on ? 1 : 0,
                  filter: on ? "blur(0px)" : "blur(4px)",
                  transform: on ? "none" : "translateY(-6px)",
                  transition: `opacity .35s ease ${on ? ".12s" : "0s"}, filter .45s ease ${on ? ".12s" : "0s"}, transform .5s cubic-bezier(.2,1.2,.3,1) ${on ? ".12s" : "0s"}`,
                }}
              >
                {it.answer}
              </div>
            </Collapse>
          </div>
        )
      })}
    </div>
  )
})

export { IndexAccordion, type IndexAccordionProps, type IndexItem }
