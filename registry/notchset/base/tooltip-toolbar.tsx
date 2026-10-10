"use client"

/**
 * Tooltip Toolbar (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/tooltip-toolbar
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Tooltip Toolbar: one tooltip for the whole toolbar. The first hover waits 450ms; after that it's
 * warm, so moving to another button slides the same bubble over (left and width, .35s) and rolls its
 * label, a name plus a key chip. It stays warm for 500ms after you leave; focus shows it at once.
 * Buttons toggle a selected state with a foreground fill.
 */

interface ToolbarTool {
  id: string
  label: string
  icon: React.ReactNode
  shortcut?: string | undefined
}

interface TooltipToolbarProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  tools: readonly ToolbarTool[]
  /** The selected tool, or null. */
  value: string | null
  onValueChange: (id: string | null) => void
  label: string
  sound?: boolean | undefined
}

const TooltipToolbar = React.forwardRef<HTMLDivElement, TooltipToolbarProps>(function TooltipToolbar({ tools, value, onValueChange, label, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const tipId = React.useId()
  const rows = React.useRef<HTMLSpanElement>(null)
  const show = React.useRef(0)
  const cool = React.useRef(0)
  const warm = React.useRef(false)
  const [tip, setTip] = React.useState<{ i: number; x: number; on: boolean; slide: boolean }>({ i: 0, x: 0, on: false, slide: false })
  const [widths, setWidths] = React.useState<number[]>([])
  React.useEffect(() => {
    const el = rows.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidths(Array.from(el.children).map((c) => (c as HTMLElement).scrollWidth)))
    ro.observe(el)
    return () => {
      ro.disconnect()
      window.clearTimeout(show.current)
      window.clearTimeout(cool.current)
    }
  }, [tools])

  const enter = (i: number, el: HTMLElement, now = false) => {
    window.clearTimeout(show.current)
    window.clearTimeout(cool.current)
    const x = el.offsetLeft + el.offsetWidth / 2
    if (warm.current || now) {
      setTip((t) => ({ i, x, on: true, slide: t.on }))
      if (tip.i !== i || !tip.on) sfx.tone(1300 + i * 60, 0.012, "triangle", 0.015)
      warm.current = true
      return
    }
    setTip((t) => ({ ...t, i, x, slide: false }))
    show.current = window.setTimeout(() => {
      warm.current = true
      setTip((t) => ({ ...t, on: true }))
      sfx.tone(1300 + i * 60, 0.012, "triangle", 0.015)
    }, 450)
  }
  const leave = () => {
    window.clearTimeout(show.current)
    setTip((t) => ({ ...t, on: false }))
    cool.current = window.setTimeout(() => {
      warm.current = false
      setTip((t) => ({ ...t, slide: false }))
    }, 500)
  }

  return (
    <div ref={ref} data-slot="tooltip-toolbar" data-notchset="" className={cn("relative flex", className)} onMouseLeave={leave} {...props}>
      <div role="toolbar" aria-label={label} className="flex h-[46px] items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--background)] p-[5px] shadow-[0_8px_20px_-16px_rgba(0,0,0,.4)]">
        {tools.map((t, i) => {
          const on = value === t.id
          return (
            <button
              key={t.id}
              type="button"
              aria-label={t.label}
              aria-pressed={on}
              aria-describedby={tip.on && tip.i === i ? tipId : undefined}
              aria-keyshortcuts={t.shortcut}
              onMouseEnter={(e) => enter(i, e.currentTarget)}
              onFocus={(e) => enter(i, e.currentTarget, true)}
              onBlur={leave}
              onClick={() => {
                sfx.tone(on ? 700 : 900 + i * 80, 0.035, "triangle", 0.035)
                onValueChange(on ? null : t.id)
              }}
              className={cn(
                "grid size-9 cursor-pointer place-items-center rounded-full outline-none [transition:background-color_.2s,color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-90 [&_svg]:size-4",
                on && "bg-[var(--foreground)] text-[var(--background)]",
                !on && tip.on && tip.i === i && "bg-[var(--accent)] text-[var(--foreground)]",
                !on && !(tip.on && tip.i === i) && "text-[var(--foreground)]"
              )}
            >
              {t.icon}
            </button>
          )
        })}
      </div>
      <span
        id={tipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+10px)] h-[30px] origin-bottom rounded-[9px] bg-[var(--foreground)] motion-reduce:transition-none!"
        style={{
          left: tip.x,
          width: widths[tip.i] || undefined,
          opacity: tip.on ? 1 : 0,
          translate: tip.on ? "-50% 0" : "-50% 4px",
          scale: tip.on ? "1" : ".92",
          transition: `${tip.slide ? "left .35s cubic-bezier(.2,1.2,.3,1), width .35s cubic-bezier(.2,1.2,.3,1), " : ""}opacity .15s, translate .3s cubic-bezier(.2,1.4,.3,1), scale .3s cubic-bezier(.2,1.4,.3,1)`,
        }}
      >
        <span className="block h-[30px] overflow-hidden rounded-[9px]">
          <span ref={rows} className="flex w-max flex-col [transition:translate_.4s_cubic-bezier(.2,1.2,.3,1)] motion-reduce:transition-none" style={{ translate: `0 ${-tip.i * 30}px` }}>
            {tools.map((t, k) => (
              <span key={t.id} aria-hidden={k === tip.i ? undefined : true} className="flex h-[30px] items-center gap-1.5 ps-[11px] pe-1.5 whitespace-nowrap">
                <span className="flex-1 text-[12.5px] font-semibold text-[var(--background)]">{t.label}</span>
                {t.shortcut && <span className="flex h-[18px] items-center rounded-[5px] bg-[color-mix(in_oklab,var(--background)_18%,transparent)] px-[5px] font-mono text-[10.5px] text-[var(--background)]">{t.shortcut}</span>}
              </span>
            ))}
          </span>
        </span>
      </span>
    </div>
  )
})

export { TooltipToolbar, type ToolbarTool, type TooltipToolbarProps }
