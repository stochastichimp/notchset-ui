"use client"

/**
 * Stretch Tabs (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/stretch-tabs
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Stretch Tabs: a segmented tab list whose thumb reaches toward the next tab before its back edge
 * catches up (the leading edge moves first, .3s; the trailing edge follows, .44s after 80ms). Each tab
 * tints its icon and count in its colour while active, and the panel's rows slide in from the side you
 * moved toward, 45ms apart. StretchRow is a collapsible row for the panel: one open at a time is up
 * to you (pass open / onOpenChange).
 */

interface StretchTab {
  id: string
  label: string
  icon?: React.ReactNode | undefined
  count?: React.ReactNode | undefined
  color?: string | undefined
}

interface StretchTabsProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  tabs: readonly StretchTab[]
  value: string
  onValueChange: (id: string) => void
  label: string
  /** The panel's rows; each slides in on a tab change. */
  children?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const StretchTabs = React.forwardRef<HTMLDivElement, StretchTabsProps>(function StretchTabs({ tabs, value, onValueChange, label, children, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const base = React.useId()
  const list = React.useRef<HTMLDivElement>(null)
  const [boxes, setBoxes] = React.useState<{ left: number; width: number }[]>([])
  const [width, setWidth] = React.useState(0)
  const [move, setMove] = React.useState({ dir: 1, n: 0 })
  React.useEffect(() => {
    const el = list.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const btns = Array.from(el.querySelectorAll<HTMLElement>("[role=tab]"))
      setBoxes(btns.map((b) => ({ left: b.offsetLeft, width: b.offsetWidth })))
      setWidth(el.scrollWidth)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [tabs.length])

  const sel = Math.max(0, tabs.findIndex((t) => t.id === value))
  const go = (k: number) => {
    if (k === sel) return
    setMove((m) => ({ dir: k > sel ? 1 : -1, n: m.n + 1 }))
    sfx.tone(900 + k * 90, 0.03, "triangle", 0.035)
    sfx.noise(0.15, 0.012, 1200, 2600)
    onValueChange(tabs[k]!.id)
  }
  const box = boxes[sel]

  return (
    <div ref={ref} data-slot="stretch-tabs" data-notchset="" className={cn("flex w-full max-w-[470px] flex-col items-center gap-3.5", className)} {...props}>
      <div
        ref={list}
        role="tablist"
        aria-label={label}
        dir="ltr"
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
          e.preventDefault()
          const n = (sel + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length
          go(n)
          ;(e.currentTarget.querySelectorAll("[role=tab]")[n] as HTMLElement | undefined)?.focus()
        }}
        className="relative flex max-w-full overflow-x-auto rounded-full bg-[var(--muted)] p-1 [scrollbar-width:none]"
      >
        {box && (
          <span
            aria-hidden="true"
            className="absolute inset-y-1 rounded-full bg-[var(--background)] shadow-[0_1px_2px_rgba(0,0,0,.08),0_6px_14px_-6px_rgba(0,0,0,.18)] motion-reduce:transition-none!"
            style={{
              left: box.left,
              right: width - box.left - box.width,
              transition: move.dir > 0 ? "right .3s cubic-bezier(.2,1.1,.3,1), left .44s cubic-bezier(.2,1.1,.3,1) .08s" : "left .3s cubic-bezier(.2,1.1,.3,1), right .44s cubic-bezier(.2,1.1,.3,1) .08s",
            }}
          />
        )}
        {tabs.map((t, k) => {
          const on = k === sel
          const c = t.color ?? "var(--chart-1)"
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${base}-t${k}`}
              aria-selected={on}
              aria-controls={`${base}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => go(k)}
              className={cn(
                "relative flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap outline-none [transition:color_var(--ns-time-color),scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95 [&_svg]:size-3.5",
                on ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
              )}
            >
              {t.icon && (
                <span aria-hidden="true" className="flex [transition:color_.3s]" style={on ? { color: c } : undefined}>
                  {t.icon}
                </span>
              )}
              {t.label}
              {t.count != null && (
                <span
                  className={cn("grid h-[18px] min-w-5 place-items-center rounded-full px-1.5 font-mono text-[10.5px] font-semibold [transition:background-color_.3s,color_.3s]", !on && "bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]")}
                  style={on ? { background: `color-mix(in oklab, ${c} 16%, transparent)`, color: `color-mix(in oklab, ${c} 75%, var(--foreground))` } : undefined}
                >
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-t${sel}`} className="w-full overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--background)]">
        {React.Children.map(children, (child, j) => (
          <div
            key={`${move.n}-${j}`}
            className={cn("[&:not(:last-child)]:border-b [&:not(:last-child)]:border-[var(--border)]", move.n > 0 && (move.dir > 0 ? "animate-[ns-slide-from-right_.45s_var(--ns-ease-settle)_both]" : "animate-[ns-slide-from-left_.45s_var(--ns-ease-settle)_both]"), "motion-reduce:animate-none")}
            style={{ animationDelay: `${j * 45}ms` }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
})

interface StretchRowProps {
  title: React.ReactNode
  meta?: React.ReactNode | undefined
  /** The diamond's colour. */
  color?: string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Struck through and muted, e.g. for done items. */
  done?: boolean | undefined
  children?: React.ReactNode | undefined
  sound?: boolean | undefined
}

function StretchRow({ title, meta, color = "var(--chart-1)", open, onOpenChange, done = false, children, sound = true }: StretchRowProps) {
  const { sfx } = useSound(sound)
  const id = React.useId()
  return (
    <div data-slot="stretch-row">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (open) sfx.close()
          else sfx.open()
          onOpenChange(!open)
        }}
        className={cn("flex h-[52px] w-full cursor-pointer items-center gap-3 ps-4 pe-3 text-start outline-none [transition:background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-inset", open && "bg-[var(--accent)]")}
      >
        <span aria-hidden="true" className="size-[7px] shrink-0 rotate-45 rounded-[2px]" style={{ background: color }} />
        <span className={cn("min-w-0 flex-1 truncate text-[13.5px]", open ? "font-semibold" : "font-medium", done ? "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] line-through" : "text-[var(--foreground)]")}>{title}</span>
        {meta && <span className="font-mono text-[11px] whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{meta}</span>}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [transition:rotate_.4s_var(--ns-ease-pop)]" style={{ rotate: open ? "180deg" : "0deg" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        id={id}
        ref={(el) => {
          el?.toggleAttribute("inert", !open)
        }}
        className="grid [transition:grid-template-rows_.42s_var(--ns-ease-settle)] motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-3 ps-[35px] pe-4 pb-3.5 [transition:opacity_var(--ns-time-state),translate_.42s_cubic-bezier(.2,1.2,.3,1)]" style={{ opacity: open ? 1 : 0, translate: open ? "0 0" : "0 -4px" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export { StretchRow, StretchTabs, type StretchRowProps, type StretchTab, type StretchTabsProps }
