"use client"

/**
 * Drum Breadcrumb (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/drum-breadcrumb
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useCalm } from "@/lib/notchset/shared"
import { Collapse } from "@/lib/notchset/collapse"
import { CrumbIcon, type Crumb } from "@/lib/notchset/crumbs"
import { useSound } from "@/lib/notchset/sound"

/*
 * Drum Breadcrumb: every level is a drum over its siblings. Switching a level rolls its label; clicking
 * unrolls a list from the current item (clipped open, so the current sibling never moves), and ↑/↓ on a
 * focused level cycle siblings without opening it. Your app rebuilds the deeper levels where it can (keep
 * your place); new levels reveal one by one and a note says whether the same path was found.
 */

interface DrumBreadcrumbProps extends Omit<React.ComponentPropsWithoutRef<"nav">, "children"> {
  /** The path; each level's `siblings` includes itself. */
  items: readonly Crumb[]
  /** A sibling was chosen at `level`: update `items`. */
  onSwitch: (level: number, sibling: Crumb) => void
  /** A line under the trail after a switch: success when the path was kept. */
  note?: { text: React.ReactNode; tone: "success" | "warning" } | null | undefined
  sound?: boolean | undefined
}

const ROW = 30

const DrumBreadcrumb = React.forwardRef<HTMLElement, DrumBreadcrumbProps>(function DrumBreadcrumb({ items, onSwitch, note, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [open, setOpen] = React.useState(-1)
  const [from, setFrom] = React.useState<{ level: number; n: number }>({ level: 99, n: 0 })
  const pop = React.useRef<HTMLOListElement>(null)
  React.useEffect(() => {
    if (open < 0) return
    const down = (e: PointerEvent) => {
      if (!pop.current?.contains(e.target as Node)) setOpen(-1)
    }
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(-1)
    document.addEventListener("pointerdown", down)
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("pointerdown", down)
      document.removeEventListener("keydown", key)
    }
  }, [open])

  const pick = (level: number, sib: Crumb, stay = false) => {
    const cur = items[level]
    if (!stay) setOpen(-1)
    if (cur && sib.id === cur.id) {
      if (!stay) sfx.close()
      return
    }
    setFrom((f) => ({ level, n: f.n + 1 }))
    sfx.tone(950, 0.05, "triangle", 0.04, 0, 1200)
    onSwitch(level, sib)
  }
  const reduce = useCalm()

  return (
    <nav ref={ref} aria-label="Breadcrumb" data-slot="drum-breadcrumb" data-notchset="" className={cn("flex flex-col gap-1", className)} {...props}>
      <ol ref={pop} className="m-0 flex list-none flex-wrap items-center gap-x-1 gap-y-1 p-0">
        {items.map((c, i) => {
          const sibs = c.siblings?.length ? c.siblings : [c]
          const idx = Math.max(0, sibs.findIndex((s) => s.id === c.id))
          const many = sibs.length > 1
          const on = open === i
          const last = i === items.length - 1
          return (
            <li key={`${i}-${from.level < i ? from.n : 0}-${c.id}`} className={cn("relative flex items-center gap-1", i > from.level && "animate-[ns-reveal_.45s_cubic-bezier(.2,.8,.2,1)_both] motion-reduce:animate-none")} style={{ animationDelay: i > from.level ? `${(i - from.level - 1) * 70}ms` : undefined }}>
              {i > 0 && (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3 shrink-0 text-[color-mix(in_oklab,var(--foreground)_30%,transparent)] rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              )}
              <span className="relative">
                <button
                  type="button"
                  aria-haspopup={many ? "listbox" : undefined}
                  aria-expanded={many ? on : undefined}
                  aria-current={last ? "page" : undefined}
                  aria-label={many ? `${c.label}, ${idx + 1} of ${sibs.length}. Arrow keys switch.` : c.label}
                  onClick={() => {
                    if (!many) return
                    if (on) sfx.close()
                    else sfx.open()
                    setOpen(on ? -1 : i)
                  }}
                  onKeyDown={(e) => {
                    if (!many || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return
                    e.preventDefault()
                    pick(i, sibs[(idx + (e.key === "ArrowDown" ? 1 : -1) + sibs.length) % sibs.length]!, true)
                  }}
                  className={cn("flex h-[30px] items-center gap-1.5 rounded-[9px] ps-2 pe-1.5 text-[13.5px] outline-none [transition:background-color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", many ? "cursor-pointer hover:bg-[var(--accent)]" : "cursor-default", on && "bg-[var(--accent)]", last ? "font-semibold text-[var(--foreground)]" : "font-medium text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
                >
                  <CrumbIcon crumb={c} />
                  <span className="block h-5 overflow-hidden">
                    <span className="flex flex-col [transition:translate_.55s_var(--ns-ease-reshape)] motion-reduce:transition-none" style={{ translate: `0 ${-idx * 20}px` }}>
                      {sibs.map((s) => (
                        <span key={s.id} aria-hidden="true" className="h-5 leading-5 whitespace-nowrap">
                          {s.label}
                        </span>
                      ))}
                    </span>
                  </span>
                  {many && (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3 shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m7 15 5 5 5-5" />
                      <path d="m7 9 5-5 5 5" />
                    </svg>
                  )}
                </button>
                {many && (
                  <ul
                    role="listbox"
                    aria-label={`Switch ${c.label}`}
                    ref={(el) => {
  el?.toggleAttribute("inert", !on)
}}
                    className="absolute -start-1 z-10 m-0 min-w-[180px] list-none rounded-[12px] border border-[var(--border)] bg-[var(--background)] p-[5px] shadow-[0_22px_44px_-18px_rgba(0,0,0,.45)]"
                    style={{
                      top: -(5 + idx * ROW),
                      clipPath: reduce ? undefined : on ? "inset(0px 0px 0px 0px round 12px)" : `inset(${5 + idx * ROW}px 0px ${5 + (sibs.length - idx - 1) * ROW}px 0px round 9px)`,
                      opacity: on ? 1 : 0,
                      pointerEvents: on ? "auto" : "none",
                      transition: reduce ? "opacity .2s" : "clip-path .45s cubic-bezier(.2,1.1,.3,1), opacity .15s",
                    }}
                  >
                    {sibs.map((s, j) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={j === idx}
                          onClick={() => pick(i, s)}
                          className={cn("flex h-[30px] w-full cursor-pointer items-center gap-2 rounded-[8px] px-2 text-start text-[13.5px] outline-none hover:bg-[var(--accent)] focus-visible:bg-[var(--accent)]", j === idx ? "bg-[color-mix(in_oklab,var(--info,var(--chart-1))_11%,transparent)] text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
                        >
                          <CrumbIcon crumb={s} />
                          <span className="flex-1 whitespace-nowrap">{s.label}</span>
                          {j === idx && (
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 text-[var(--success,var(--foreground))]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </span>
            </li>
          )
        })}
      </ol>
      <Collapse open={Boolean(note)}>
        <span role="status" className="block pt-1 ps-2 text-[12.5px]" style={{ color: note?.tone === "warning" ? "color-mix(in oklab, var(--warning, var(--chart-4)) 60%, var(--foreground))" : "color-mix(in oklab, var(--success, var(--foreground)) 75%, var(--foreground))" }}>
          {note?.text}
        </span>
      </Collapse>
    </nav>
  )
})

export { DrumBreadcrumb, type DrumBreadcrumbProps }
