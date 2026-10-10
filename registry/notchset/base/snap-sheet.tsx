"use client"

/**
 * Snap Sheet (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/snap-sheet
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Snap Sheet: a bottom sheet with three stops (full, half, closed). Drag the handle with rubber banding
 * above the top; on release it snaps to the nearest stop, and a flick over 0.6px/ms skips toward its
 * direction. The scrim follows the position, and `more` (the details only worth showing at full height)
 * fades in as it rises. The handle is a button too: Enter toggles half and full, Esc closes. It fills
 * the viewport by default; pass `inline` to keep it inside a relative container.
 */

type SnapPoint = "full" | "half" | "closed"

interface SnapSheetProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children" | "title"> {
  snap: SnapPoint
  onSnapChange: (snap: SnapPoint) => void
  /** The sheet's accessible name. */
  title: string
  children: React.ReactNode
  /** Shown as the sheet rises to full. */
  more?: React.ReactNode | undefined
  /** The sheet's height at full. */
  height?: number | undefined
  /** How much shows at half. */
  peek?: number | undefined
  inline?: boolean | undefined
  sound?: boolean | undefined
}

const clock = () => performance.now()

const SnapSheet = React.forwardRef<HTMLDivElement, SnapSheetProps>(function SnapSheet({ snap, onSnapChange, title, children, more, height = 370, peek = 170, inline = false, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const stops: Record<SnapPoint, number> = { full: 0, half: height - peek, closed: height + 30 }
  const [drag, setDrag] = React.useState<number | null>(null)
  const d = React.useRef<{ sy: number; y0: number; ly: number; lt: number; v: number } | null>(null)
  const sheet = React.useRef<HTMLDivElement | null>(null)
  const y = drag ?? stops[snap]
  const open = snap !== "closed"
  React.useEffect(() => {
    if (!open) return
    sheet.current?.focus({ preventScroll: true })
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      sfx.noise(0.22, 0.03, 2600, 600)
      onSnapChange("closed")
    }
    document.addEventListener("keydown", key)
    return () => document.removeEventListener("keydown", key)
  }, [open, onSnapChange, sfx])

  const go = (s: SnapPoint) => {
    sfx.tone(s === "full" ? 1000 : s === "half" ? 800 : 560, 0.04, "triangle", 0.035)
    onSnapChange(s)
  }
  const half = stops.half

  return (
    <div ref={ref} data-slot="snap-sheet" data-notchset="" className={cn(inline ? "absolute" : "fixed", "inset-0 z-50 overflow-hidden", !open && drag === null && "pointer-events-none", className)} {...props}>
      <div
        aria-hidden="true"
        onClick={() => go("closed")}
        className="absolute inset-0 bg-[rgba(0,0,0,.32)]"
        style={{ opacity: Math.max(0, Math.min(1, (stops.closed - 30 - y) / half)), pointerEvents: open ? "auto" : "none", transition: drag === null ? "opacity .4s" : "none" }}
      />
      <div
        ref={(el) => {
          sheet.current = el
          el?.toggleAttribute("inert", !open && drag === null)
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 rounded-t-[26px] bg-[var(--background)] shadow-[0_-12px_30px_-18px_rgba(0,0,0,.35)] outline-none motion-reduce:transition-none"
        style={{ height, transform: `translateY(${y}px)`, transition: drag === null ? "transform .55s var(--ns-ease-settle)" : "none" }}
      >
        <button
          type="button"
          aria-label={snap === "full" ? `Collapse ${title}` : `Expand ${title}`}
          onPointerDown={(e) => {
            if (e.button) return
            try {
              e.currentTarget.setPointerCapture(e.pointerId)
            } catch {}
            d.current = { sy: e.clientY, y0: y, ly: e.clientY, lt: clock(), v: 0 }
            setDrag(y)
          }}
          onPointerMove={(e) => {
            const g = d.current
            if (!g) return
            const now = clock()
            g.v = (e.clientY - g.ly) / Math.max(1, now - g.lt)
            g.ly = e.clientY
            g.lt = now
            let next = g.y0 + (e.clientY - g.sy)
            if (next < 0) next /= 4
            setDrag(Math.min(stops.closed + 20, next))
          }}
          onPointerUp={(e) => {
            const g = d.current
            d.current = null
            if (!g) return
            const at = drag ?? y
            setDrag(null)
            if (Math.abs(e.clientY - g.sy) < 4) return
            let s: SnapPoint = (Object.keys(stops) as SnapPoint[]).reduce((a, b) => (Math.abs(stops[b] - at) < Math.abs(stops[a] - at) ? b : a), "half")
            if (g.v > 0.6) s = at < half ? "half" : "closed"
            else if (g.v < -0.6) s = at > half ? "half" : "full"
            go(s)
          }}
          onClick={(e) => {
            if (e.detail === 0) go(snap === "full" ? "half" : "full")
          }}
          className="grid h-[26px] w-full cursor-grab touch-none place-items-center rounded-t-[26px] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-inset active:cursor-grabbing"
        >
          <span aria-hidden="true" className="h-[5px] w-[38px] rounded-[3px] bg-[var(--border)]" />
        </button>
        <div className="flex flex-col gap-3.5 px-[18px]">
          {children}
          {more && (
            <div aria-hidden={y > half / 2 || undefined} className="[transition:opacity_var(--ns-time-state)]" style={{ opacity: Math.max(0, Math.min(1, (half - y) / (half * 0.6))) }}>
              {more}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export { SnapSheet, type SnapPoint, type SnapSheetProps }
