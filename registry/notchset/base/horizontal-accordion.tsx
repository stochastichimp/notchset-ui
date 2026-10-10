"use client"

/**
 * Horizontal Accordion (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/horizontal-accordion
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Horizontal Accordion: a row of photo panels. The active one widens to five times the others (.7s) and
 * its title and description rise in after it settles; the rest show a vertical label, dimmed. Hover,
 * focus or click opens a panel, and ←/→ move between them. Phones get a vertical stack.
 */

interface Panel {
  id: string
  title: string
  description?: React.ReactNode | undefined
  image?: string | undefined
  /** The marker colour, e.g. "var(--chart-1)". */
  color?: string | undefined
}

interface HorizontalAccordionProps extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  panels: readonly Panel[]
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((id: string) => void) | undefined
  sound?: boolean | undefined
}

const HorizontalAccordion = React.forwardRef<HTMLDivElement, HorizontalAccordionProps>(function HorizontalAccordion({ panels, value, defaultValue, onValueChange, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [inner, setInner] = React.useState(defaultValue ?? panels[0]?.id)
  const active = value ?? inner
  const at = Math.max(0, panels.findIndex((p) => p.id === active))
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([])

  const pick = (id: string) => {
    if (id === active) return
    sfx.noise(0.22, 0.025, 700, 2200)
    if (value === undefined) setInner(id)
    onValueChange?.(id)
  }

  return (
    <div
      ref={ref}
      data-slot="horizontal-accordion"
      data-notchset=""
      onKeyDown={(event) => {
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
        const d = event.key === "ArrowRight" ? (rtl ? -1 : 1) : event.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0
        if (!d) return
        event.preventDefault()
        const next = (at + d + panels.length) % panels.length
        buttons.current[next]?.focus()
      }}
      className={cn("flex h-[340px] w-full max-w-[960px] gap-2 max-sm:h-auto max-sm:flex-col", className)}
      {...props}
    >
      {panels.map((p, i) => {
        const on = p.id === active
        return (
          <button
            key={p.id}
            ref={(el) => {
              buttons.current[i] = el
            }}
            type="button"
            aria-expanded={on}
            aria-label={on ? undefined : p.title}
            onClick={() => pick(p.id)}
            onMouseEnter={() => pick(p.id)}
            onFocus={() => pick(p.id)}
            className={cn(
              "relative min-w-14 cursor-pointer overflow-hidden rounded-[20px] bg-[#222] bg-cover bg-center p-0 text-start text-white outline-none [transition:flex_.7s_var(--ns-ease-settle),height_.7s_var(--ns-ease-settle)] focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--foreground)_30%,transparent)] motion-reduce:transition-none",
              on ? "flex-[5] max-sm:h-[260px] max-sm:flex-none" : "flex-1 max-sm:h-14 max-sm:flex-none"
            )}
            style={{ backgroundImage: p.image ? `url(${p.image})` : undefined, height: undefined }}
          >
            <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.72),rgba(0,0,0,.12)_55%,rgba(0,0,0,.05))] [transition:opacity_.5s]" style={{ opacity: on ? 1 : 0.6 }} />
            <span aria-hidden="true" className="absolute inset-0 bg-[rgba(0,0,0,.35)] [transition:opacity_.5s]" style={{ opacity: on ? 0 : 1 }} />
            <span aria-hidden="true" className="motion-reduce:transition-none! absolute inset-x-0 bottom-[18px] flex flex-col items-center gap-2.5 max-sm:inset-y-0 max-sm:start-4 max-sm:end-auto max-sm:bottom-auto max-sm:flex-row" style={{ opacity: on ? 0 : 1, transition: `opacity .3s ease ${on ? "0s" : ".3s"}` }}>
              <span className="rotate-180 text-[length:var(--ns-type-copy)] font-semibold tracking-[.02em] whitespace-nowrap [writing-mode:vertical-rl] max-sm:rotate-0 max-sm:[writing-mode:horizontal-tb]">{p.title}</span>
              <span className="font-mono text-[11px] opacity-75">{String(i + 1).padStart(2, "0")}</span>
            </span>
            <span
              className="absolute inset-x-[22px] bottom-[22px] flex max-w-[340px] flex-col gap-2 motion-reduce:transition-none!"
              style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(14px)", transition: `opacity .35s ease ${on ? ".28s" : "0s"}, transform .55s cubic-bezier(.2,1.2,.3,1) ${on ? ".28s" : "0s"}` }}
            >
              <span className="flex items-center gap-2 font-mono text-[11px]">
                <span aria-hidden="true" className="size-2 rounded-[2px]" style={{ background: p.color ?? `var(--chart-${(i % 5) + 1})` }} />
                {String(i + 1).padStart(2, "0")} / {String(panels.length).padStart(2, "0")}
              </span>
              <span className="text-[26px] font-semibold tracking-[-0.03em]">{p.title}</span>
              {p.description && <span className="text-[length:var(--ns-type-copy)] leading-[var(--ns-leading-prose)] text-pretty opacity-85">{p.description}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
})

export { HorizontalAccordion, type HorizontalAccordionProps, type Panel }
