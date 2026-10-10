"use client"

/**
 * Hold Delete Action (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/hold-delete-action
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { ActionPill, Glyph } from "@/lib/notchset/action-pill"
import { useSound } from "@/lib/notchset/sound"

/*
 * Hold Delete Action: press and hold for 1.2s. A red outline draws in, a red tint fills the pill and the
 * disc swells; past 60% the icon trembles. Letting go early springs it back; finishing deletes, and a tap
 * then undoes. From the keyboard, hold Space or Enter.
 */

interface HoldDeleteActionProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  deleted: boolean
  onDelete: () => void
  onUndo: () => void
  /** Hold time, ms. */
  duration?: number | undefined
  meta?: readonly [React.ReactNode, React.ReactNode, React.ReactNode] | undefined
  sound?: boolean | undefined
}

const HoldDeleteAction = React.forwardRef<HTMLButtonElement, HoldDeleteActionProps>(function HoldDeleteAction({ deleted, onDelete, onUndo, duration = 1200, meta = ["Hold to confirm", "Release to cancel", "Moved to trash · tap to undo"], sound = true, ...props }, ref) {
  const { sfx, holdTone } = useSound(sound)
  const [p, setP] = React.useState(0)
  const [holding, setHolding] = React.useState(false)
  const run = React.useRef<{ raf: number; tone: { stop(): void } | null; just: boolean }>({ raf: 0, tone: null, just: false })
  React.useEffect(() => {
    const r = run.current
    return () => {
      cancelAnimationFrame(r.raf)
      r.tone?.stop()
    }
  }, [])

  const start = () => {
    if (deleted || holding) return
    const r = run.current
    const t0 = performance.now()
    r.tone = holdTone(duration / 1000)
    setHolding(true)
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / duration)
      setP(k * 100)
      if (k < 1) {
        r.raf = requestAnimationFrame(step)
        return
      }
      r.tone?.stop()
      r.tone = null
      r.just = true
      setHolding(false)
      setP(0)
      sfx.thud()
      onDelete()
    }
    r.raf = requestAnimationFrame(step)
  }
  const end = () => {
    const r = run.current
    if (!holding) return
    cancelAnimationFrame(r.raf)
    r.tone?.stop()
    r.tone = null
    setHolding(false)
    setP(0)
    sfx.drop()
  }
  const state = deleted ? 2 : holding ? 1 : 0
  return (
    <ActionPill
      ref={ref}
      data-slot="hold-delete-action"
      data-notchset=""
      aria-label={deleted ? "Deleted, press to undo" : "Hold to delete"}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        start()
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault()
          start()
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          end()
        }
      }}
      onClick={() => {
        if (run.current.just) {
          run.current.just = false
          return
        }
        if (deleted) {
          sfx.pop()
          onUndo()
        }
      }}
      index={state}
      labels={["Hold to delete", "Keep holding…", "Deleted"]}
      meta={meta}
      metaIndex={state}
      icons={[<Glyph key="t" d={["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6"]} width={2.2} />, <Glyph key="u" d={["M9 14 4 9l5-5", "M4 9h11a5 5 0 0 1 0 10h-3"]} width={2.2} />]}
      icon={deleted ? 1 : 0}
      iconMotion={holding && p > 60 && "shake"}
      disc={state ? "var(--destructive)" : "var(--foreground)"}
      discInk={state ? "var(--destructive-foreground,#fff)" : "var(--background)"}
      discScale={holding ? 1 + p / 900 : 1}
      tone={state ? "color-mix(in oklab, var(--destructive) 82%, var(--foreground))" : "var(--foreground)"}
      outline={{ mode: "progress", progress: deleted ? 100 : p, color: "var(--destructive)", instant: holding }}
      fill={{ width: deleted ? 100 : p, color: "color-mix(in oklab, var(--destructive) 10%, transparent)", instant: holding }}
      {...props}
    />
  )
})

export { HoldDeleteAction, type HoldDeleteActionProps }
