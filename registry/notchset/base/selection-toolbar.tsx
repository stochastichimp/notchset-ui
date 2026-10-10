"use client"

/**
 * Selection Toolbar (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/selection-toolbar
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Selection Toolbar: select text inside it and a dark pill rises over the first line of the selection
 * (10px above, kept inside the container) with your formats; link and note buttons widen the pill into
 * an inline field (Enter applies, Esc goes back, an empty field shakes). It reads the native Selection
 * API, so it works over any text; what a format does is up to you.
 */

interface ToolbarFormat {
  id: string
  label: string
  icon: React.ReactNode
}

interface ToolbarField {
  id: string
  label: string
  icon: React.ReactNode
  placeholder: string
  /** Its colour, e.g. "var(--chart-1)". */
  color?: string | undefined
}

interface SelectionToolbarProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  formats: readonly ToolbarFormat[]
  /** Whether a format is on for the current selection (aria-pressed). */
  isActive?: ((id: string, range: Range) => boolean) | undefined
  onFormat: (id: string, range: Range) => void
  fields?: readonly ToolbarField[] | undefined
  onApply?: ((id: string, value: string, range: Range) => void) | undefined
  sound?: boolean | undefined
}

const SelectionToolbar = React.forwardRef<HTMLDivElement, SelectionToolbarProps>(function SelectionToolbar({ formats, isActive, onFormat, fields = [], onApply, sound = true, className, children, ...props }, ref) {
  const { sfx } = useSound(sound)
  const box = React.useRef<HTMLDivElement>(null)
  const input = React.useRef<HTMLInputElement>(null)
  const range = React.useRef<Range | null>(null)
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null)
  const [mode, setMode] = React.useState<ToolbarField | null>(null)
  const [text, setText] = React.useState("")
  const [shakes, setShakes] = React.useState(0)
  const [, force] = React.useState(0)
  const half = (mode ? 150 : 95) + 8

  const place = React.useCallback(
    (r: Range) => {
      const el = box.current
      if (!el) return
      const cr = el.getBoundingClientRect()
      const rects = Array.from(r.getClientRects()).filter((x) => x.width > 0)
      if (!rects.length) return
      const top = Math.min(...rects.map((x) => x.top))
      const line = rects.filter((x) => Math.abs(x.top - top) < 6)
      const l = Math.min(...line.map((x) => x.left))
      const rr = Math.max(...line.map((x) => x.right))
      const x = Math.max(half, Math.min(cr.width - half, (l + rr) / 2 - cr.left))
      const y = top - cr.top - 10
      // Only move past half a pixel, or a resize can loop.
      setPos((p) => (p && Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5 ? p : { x, y }))
    },
    [half]
  )

  React.useEffect(() => {
    let words = 0
    const onChange = () => {
      const sel = document.getSelection()
      const el = box.current
      if (!sel || !el || sel.rangeCount === 0) return
      const r = sel.getRangeAt(0)
      const inside = el.contains(r.commonAncestorContainer) && !el.querySelector("[data-selection-toolbar]")?.contains(r.commonAncestorContainer)
      if (!inside) return
      if (r.collapsed) {
        if (!mode && range.current) {
          range.current = null
          setPos(null)
        }
        return
      }
      const n = r.toString().split(/\s+/).filter(Boolean).length
      if (n !== words) {
        words = n
        sfx.tone(1500 + (n % 6) * 40, 0.008, "triangle", 0.012)
      }
      range.current = r.cloneRange()
      place(r)
      force((k) => k + 1)
    }
    document.addEventListener("selectionchange", onChange)
    return () => document.removeEventListener("selectionchange", onChange)
  }, [place, mode, sfx])
  React.useEffect(() => {
    const onResize = () => range.current && place(range.current)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [place])

  const restore = () => {
    const r = range.current
    const sel = document.getSelection()
    if (r && sel) {
      sel.removeAllRanges()
      sel.addRange(r)
    }
  }
  const back = () => {
    sfx.close()
    setMode(null)
    restore()
  }
  const apply = () => {
    const r = range.current
    if (!mode || !r) return
    if (!text.trim()) {
      sfx.buzz()
      setShakes((n) => n + 1)
      return
    }
    onApply?.(mode.id, text.trim(), r)
    sfx.ding(3)
    setMode(null)
    setPos(null)
    range.current = null
    document.getSelection()?.removeAllRanges()
  }
  const open = pos !== null && range.current !== null

  return (
    <div ref={ref} data-slot="selection-toolbar" data-notchset="" className={cn("relative", className)} {...props}>
      <div ref={box} className="relative">
        {children}
        <div
          data-selection-toolbar=""
          role="toolbar"
          aria-label="Format selection"
          aria-hidden={open ? undefined : true}
          ref={(el) => {
  el?.toggleAttribute("inert", !open)
}}
          onMouseDown={(e) => {
            if (!(e.target instanceof HTMLInputElement)) e.preventDefault()
          }}
          className="absolute z-10 -translate-x-1/2 -translate-y-full [transition:left_.4s_cubic-bezier(.2,1.2,.3,1),top_.4s_cubic-bezier(.2,1.2,.3,1),opacity_.2s,scale_.3s_cubic-bezier(.2,1.4,.3,1)] motion-reduce:[transition:opacity_.2s] rtl:translate-x-1/2"
          style={{ left: pos?.x ?? 0, top: pos?.y ?? 0, opacity: open ? 1 : 0, scale: open ? "1" : ".9", translate: open ? undefined : undefined, pointerEvents: open ? "auto" : "none" }}
        >
          <div className="relative h-[42px] overflow-hidden rounded-full bg-[var(--foreground)] text-[var(--background)] shadow-[0_14px_30px_-12px_rgba(0,0,0,.45)] [transition:width_.45s_cubic-bezier(.2,1.2,.3,1)]" style={{ width: mode ? 300 : 190 }}>
            <div className={cn("absolute inset-0 flex items-center gap-0.5 px-[5px] [transition:opacity_.2s,translate_.4s_cubic-bezier(.2,1.2,.3,1)]", mode && "pointer-events-none")} style={{ opacity: mode ? 0 : 1, translate: mode ? "-24px 0" : "0 0" }}>
              {formats.map((f) => {
                const on = range.current && isActive ? isActive(f.id, range.current) : false
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-label={f.label}
                    aria-pressed={on}
                    tabIndex={mode ? -1 : 0}
                    onClick={() => {
                      if (!range.current) return
                      if (on) sfx.drop()
                      else sfx.pop()
                      onFormat(f.id, range.current)
                      force((k) => k + 1)
                      window.setTimeout(() => range.current && place(range.current), 30)
                    }}
                    className={cn("grid size-[var(--ns-control-compact)] shrink-0 cursor-pointer place-items-center rounded-full outline-none [transition:background-color_.2s] hover:bg-[color-mix(in_oklab,var(--background)_14%,transparent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] [&_svg]:size-[15px]", on && "bg-[color-mix(in_oklab,var(--background)_24%,transparent)]")}
                  >
                    {f.icon}
                  </button>
                )
              })}
              {fields.length > 0 && <span aria-hidden="true" className="mx-1 h-[18px] w-px bg-[color-mix(in_oklab,var(--background)_25%,transparent)]" />}
              {fields.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-label={f.label}
                  tabIndex={mode ? -1 : 0}
                  onClick={() => {
                    sfx.open()
                    setText("")
                    setMode(f)
                    window.setTimeout(() => input.current?.focus(), 60)
                  }}
                  className="grid size-[var(--ns-control-compact)] shrink-0 cursor-pointer place-items-center rounded-full outline-none [transition:background-color_.2s] hover:bg-[color-mix(in_oklab,var(--background)_14%,transparent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] [&_svg]:size-[15px]"
                  style={{ color: f.color }}
                >
                  {f.icon}
                </button>
              ))}
            </div>
            <div className={cn("absolute inset-0 flex items-center gap-2 ps-3 pe-[5px] [transition:opacity_.2s,translate_.4s_cubic-bezier(.2,1.2,.3,1)]", !mode && "pointer-events-none")} style={{ opacity: mode ? 1 : 0, translate: mode ? "0 0" : "24px 0" }}>
              <span aria-hidden="true" className="grid shrink-0 [&_svg]:size-[15px]" style={{ color: mode?.color }}>
                {mode?.icon}
              </span>
              <input
                ref={input}
                value={text}
                aria-label={mode?.label ?? "Value"}
                placeholder={mode?.placeholder}
                tabIndex={mode ? 0 : -1}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    apply()
                  } else if (e.key === "Escape") {
                    e.preventDefault()
                    e.stopPropagation()
                    back()
                  }
                }}
                className={cn("min-w-0 flex-1 bg-transparent text-[length:var(--ns-type-label)] text-[var(--background)] outline-none placeholder:text-[color-mix(in_oklab,var(--background)_55%,transparent)]", shakes > 0 && (shakes % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]"))}
              />
              <button type="button" tabIndex={mode ? 0 : -1} onClick={apply} className="h-[var(--ns-control-compact)] shrink-0 cursor-pointer rounded-full bg-[var(--background)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-note)] font-medium text-[var(--foreground)] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]">
                Add
              </button>
            </div>
          </div>
          <span aria-hidden="true" className="absolute start-1/2 -bottom-[5px] -ms-[5px] size-2.5 rotate-45 rounded-[2px] bg-[var(--foreground)]" />
        </div>
      </div>
    </div>
  )
})

export { SelectionToolbar, type SelectionToolbarProps, type ToolbarField, type ToolbarFormat }
