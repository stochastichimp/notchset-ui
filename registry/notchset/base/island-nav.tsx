"use client"

/**
 * Island Nav (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/island-nav
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { inertRef, useIsomorphicLayoutEffect } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"


const clock = () => performance.now()
/*
 * Island Nav: a floating nav that becomes its own menu. One pill glides behind the item under the
 * pointer (measured, never hard-coded); a click opens that item's menu and the island grows to fit it.
 * Moving to another menu waits for intent (140ms, and 320ms after the last switch), then slides the
 * content the way you travelled while the island resizes. Leaving the island or pressing Esc closes it.
 */

interface IslandNavItem {
  label: string
  /** A link item. */
  href?: string | undefined
  /** A menu item: its panel, and the island's width while it's open. */
  menu?: React.ReactNode | undefined
  width?: number | undefined
}

interface IslandNavProps extends Omit<React.ComponentPropsWithoutRef<"nav">, "children"> {
  brand: React.ReactNode
  items: readonly IslandNavItem[]
  /** The call to action at the end. */
  action?: React.ReactNode | undefined
  /** The island's width while closed. */
  width?: number | undefined
  sound?: boolean | undefined
}

const IslandNav = React.forwardRef<HTMLElement, IslandNavProps>(function IslandNav({ brand, items, action, width = 470, sound = true, className, onPointerLeave, onKeyDown, ...props }, ref) {
  const { sfx } = useSound(sound)
  const panelId = React.useId()
  const triggers = React.useRef<(HTMLElement | null)[]>([])
  const panel = React.useRef<HTMLDivElement>(null)
  const [hot, setHot] = React.useState(-1)
  const [pill, setPill] = React.useState<{ x: number; w: number } | null>(null)
  const [open, setOpen] = React.useState<{ i: number; dir: 1 | -1; key: number } | null>(null)
  const intent = React.useRef(0)
  const last = React.useRef(0)
  const focusPanel = React.useRef(false)

  useIsomorphicLayoutEffect(() => {
    const el = hot >= 0 ? triggers.current[hot] : null
    if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth })
  }, [hot])
  React.useEffect(() => () => window.clearTimeout(intent.current), [])
  React.useEffect(() => {
    if (!open || !focusPanel.current) return
    focusPanel.current = false
    panel.current?.querySelector<HTMLElement>("a,button,[tabindex]")?.focus({ preventScroll: true })
  }, [open])

  const show = (i: number, toggle: boolean) => {
    last.current = clock()
    if (open?.i === i) {
      if (toggle) {
        sfx.swooshOut()
        setOpen(null)
      }
      return
    }
    if (!open) sfx.swooshIn()
    else sfx.turn(i > open.i ? 1 : -1)
    setOpen((o) => ({ i, dir: o && i < o.i ? -1 : 1, key: o ? o.key + 1 : 0 }))
  }
  const close = (refocus: boolean) => {
    window.clearTimeout(intent.current)
    if (!open) return
    sfx.swooshOut()
    if (refocus) triggers.current[open.i]?.focus()
    setOpen(null)
  }
  const enter = (i: number) => {
    if (hot !== i) sfx.tone(1200 + i * 120, 0.012, "triangle", 0.018)
    setHot(i)
    window.clearTimeout(intent.current)
    if (!open || open.i === i || !items[i]?.menu) return
    // Hover intent: switching on a pass-through restarts the panel's motion and leaves it faded.
    intent.current = window.setTimeout(() => show(i, false), Math.max(140, 320 - (clock() - last.current)))
  }

  const current = open ? items[open.i] : undefined

  return (
    <nav
      ref={ref}
      data-slot="island-nav"
      data-notchset=""
      data-state={open ? "open" : "closed"}
      onPointerLeave={(event) => {
        setHot(-1)
        close(false)
        onPointerLeave?.(event)
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault()
          close(true)
        }
        onKeyDown?.(event)
      }}
      className={cn(
        "mx-auto max-w-[calc(100%-24px)] overflow-hidden border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[var(--ns-shadow-layer)] [transition:width_.55s_cubic-bezier(.2,1.1,.3,1),border-radius_.5s_var(--ns-ease-settle)] motion-reduce:transition-none",
        open ? "rounded-[22px]" : "rounded-[28px]",
        className
      )}
      style={{ width: current?.width ?? width }}
      {...props}
    >
      <div className="relative flex h-[54px] items-center gap-0.5 ps-2 pe-1.5">
        <span className="me-2 flex shrink-0 items-center gap-2 text-[length:var(--ns-type-copy)] font-semibold tracking-[-0.02em]">{brand}</span>
        <div className="relative flex min-w-0 items-center">
          {pill && (
            <span
              aria-hidden="true"
              className={cn("absolute top-0 h-8 rounded-full bg-[var(--accent)] [transition:left_.4s_cubic-bezier(.2,1.25,.3,1),width_.4s_cubic-bezier(.2,1.25,.3,1),opacity_.2s]", hot >= 0 ? "opacity-100" : "opacity-0")}
              style={{ left: pill.x, width: pill.w }}
            />
          )}
          {items.map((item, i) =>
            item.menu ? (
              <button
                key={item.label}
                ref={(el) => {
                  triggers.current[i] = el
                }}
                type="button"
                aria-expanded={open?.i === i}
                aria-controls={panelId}
                onPointerEnter={() => enter(i)}
                onFocus={() => setHot(i)}
                onClick={(event) => {
                  window.clearTimeout(intent.current)
                  focusPanel.current = event.detail === 0
                  show(i, true)
                }}
                className="relative inline-flex h-[var(--ns-control-compact)] cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius)] px-2.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap text-[var(--foreground)] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
              >
                {item.label}
                <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-3.5 [transition:rotate_.4s_var(--ns-ease-pop)]", open?.i === i && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            ) : (
              <a
                key={item.label}
                ref={(el) => {
                  triggers.current[i] = el
                }}
                href={item.href}
                onPointerEnter={() => enter(i)}
                onFocus={() => setHot(i)}
                className="relative inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius)] px-2.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap text-[var(--foreground)] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
              >
                {item.label}
              </a>
            )
          )}
        </div>
        <span className="flex-1" />
        {action}
      </div>
      <div id={panelId} className={cn("grid [transition:grid-template-rows_.55s_var(--ns-ease-settle)] motion-reduce:transition-none", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div ref={inertRef(!open)} className="min-h-0 overflow-hidden">
          <div ref={panel} className={cn("relative px-2 pt-1 pb-2 [transition:opacity_.25s]", open ? "opacity-100" : "opacity-0")}>
            {open && current?.menu && (
              <div
                key={open.key}
                className={cn(
                  "motion-reduce:animate-none",
                  open.key === 0 && "animate-[ns-fade-up_.35s_.08s_both]",
                  open.key > 0 && open.dir > 0 && "animate-[ns-slide-l_.4s_var(--ns-ease-settle)_both] rtl:animate-[ns-slide-r_.4s_var(--ns-ease-settle)_both]",
                  open.key > 0 && open.dir < 0 && "animate-[ns-slide-r_.4s_var(--ns-ease-settle)_both] rtl:animate-[ns-slide-l_.4s_var(--ns-ease-settle)_both]"
                )}
              >
                {current.menu}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
})

interface IslandNavGridProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  items: readonly { title: string; description?: string | undefined; icon?: React.ReactNode | undefined; href: string }[]
  /** Beside the grid: a featured card. */
  aside?: React.ReactNode | undefined
  sound?: boolean | undefined
}

/** A menu panel: a two-column grid of links with one highlight that glides between them. */
function IslandNavGrid({ items, aside, sound = true, className, ...props }: IslandNavGridProps) {
  const { sfx } = useSound(sound)
  const [hot, setHot] = React.useState(-1)
  const go = (i: number) => {
    if (hot === i) return
    sfx.tone(1100 + i * 90, 0.015, "triangle", 0.02)
    setHot(i)
  }
  return (
    <div data-slot="island-nav-grid" className={cn("grid gap-2", aside ? "grid-cols-[minmax(0,1fr)_170px] max-sm:grid-cols-[minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)]", className)} {...props}>
      <div className="relative grid auto-rows-[58px] grid-cols-2 max-[480px]:grid-cols-1" onPointerLeave={() => setHot(-1)}>
        <span
          aria-hidden="true"
          className={cn("absolute start-0 top-0 h-[58px] w-1/2 rounded-[12px] bg-[var(--accent)] [--sx:1] [transition:translate_.4s_cubic-bezier(.2,1.25,.3,1),opacity_.2s] max-[480px]:hidden rtl:[--sx:-1]", hot >= 0 ? "opacity-100" : "opacity-0")}
          style={{ translate: `calc(${(Math.max(0, hot) % 2) * 100}% * var(--sx)) ${Math.floor(Math.max(0, hot) / 2) * 58}px` }}
        />
        {items.map((it, i) => (
          <a key={it.title} href={it.href} onPointerEnter={() => go(i)} onFocus={() => go(i)} className="relative flex items-center gap-2.5 rounded-[12px] px-2.5 text-[var(--foreground)] no-underline outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] max-[480px]:hover:bg-[var(--accent)]">
            {it.icon && (
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[var(--muted)] [&_svg]:size-[15px]">
                {it.icon}
              </span>
            )}
            <span className="flex min-w-0 flex-col leading-[1.3]">
              <span className="text-[length:var(--ns-type-label)] font-semibold">{it.title}</span>
              {it.description && <span className="truncate text-[11.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{it.description}</span>}
            </span>
          </a>
        ))}
      </div>
      {aside && <div className="max-sm:hidden">{aside}</div>}
    </div>
  )
}

export { IslandNav, IslandNavGrid, type IslandNavGridProps, type IslandNavItem, type IslandNavProps }
