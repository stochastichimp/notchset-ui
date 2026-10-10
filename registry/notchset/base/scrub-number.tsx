"use client"

/**
 * Scrub Number (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/scrub-number
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { isRtl, useComposedRefs } from "@/lib/notchset/shared"
import { useControllable } from "@/lib/notchset/field"
import { useSound } from "@/lib/notchset/sound"

/*
 * Scrub Number: drag the label sideways to change the value, a detent ticking at every step, while a
 * ruler slides under a fixed marker. Type it, or use ↑ / ↓ (Shift for ten steps). The value is a whole
 * number; the field shows it with grouping, a prefix and a unit.
 */

interface ScrubNumberProps extends Omit<React.ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange" | "min" | "max" | "step" | "size" | "prefix"> {
  label: string
  value?: number | undefined
  defaultValue?: number | undefined
  onValueChange?: ((value: number) => void) | undefined
  min?: number | undefined
  max?: number | undefined
  /** One step: a 4px drag or one arrow press. Default 10. */
  step?: number | undefined
  /** Before the number, e.g. "$". */
  prefix?: React.ReactNode | undefined
  /** After it, e.g. "USD". */
  unit?: React.ReactNode | undefined
  /** Number formatting locale. Default "en-US". */
  locale?: string | undefined
  sound?: boolean | undefined
}

const PX_PER_STEP = 4
const TICK = 8

const ScrubNumber = React.forwardRef<HTMLInputElement, ScrubNumberProps>(function ScrubNumber(
  { label, value, defaultValue = 0, onValueChange, min = 0, max = 99990, step = 10, prefix, unit, locale = "en-US", sound = true, id, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const safeStep = Number.isFinite(step) && step > 0 ? step : 10
  const lo = Number.isFinite(min) ? min : 0
  const hi = Number.isFinite(max) && max > lo ? max : lo + safeStep * 1000
  const clamp = (n: number) => Math.max(lo, Math.min(hi, Math.round(n)))
  const [num, setNum] = useControllable(value, defaultValue, onValueChange)
  const [scrubbing, setScrubbing] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const start = React.useRef({ x: 0, v: 0 })
  const inner = React.useRef<HTMLInputElement>(null)
  const refs = useComposedRefs(inner, ref)
  const autoId = React.useId()
  const inputId = id ?? autoId

  const detent = (v: number) => sfx.tone(1000 + ((v / safeStep) % 12) * 40, 0.012, "triangle", 0.025)
  const offset = -((num - lo) / safeStep) * TICK

  return (
    <div data-slot="scrub-number" data-notchset="" className={cn("flex w-full flex-col gap-2", className)}>
      <label
        htmlFor={inputId}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          event.currentTarget.setPointerCapture?.(event.pointerId)
          start.current = { x: event.clientX, v: num }
          setScrubbing(true)
          sfx.tone(400, 0.05, "sine", 0.04, 0, 600)
        }}
        onPointerMove={(event) => {
          if (!scrubbing) return
          const dx = (event.clientX - start.current.x) * (isRtl(event.currentTarget as Element) ? -1 : 1)
          const next = clamp(start.current.v + Math.round(dx / PX_PER_STEP) * safeStep)
          if (next !== num) {
            detent(next)
            setNum(next)
          }
        }}
        onPointerUp={() => {
          if (!scrubbing) return
          setScrubbing(false)
          sfx.tone(600, 0.05, "sine", 0.04, 0, 380)
        }}
        onPointerCancel={() => setScrubbing(false)}
        className={cn(
          "inline-flex w-fit cursor-ew-resize touch-none items-center gap-1.5 rounded-[min(var(--radius),8px)] px-1.5 py-0.5 -ms-1.5 text-[length:var(--ns-type-label)] font-medium text-[var(--foreground)] select-none [transition:background-color_.15s]",
          scrubbing ? "bg-[var(--accent)]" : "hover:bg-[var(--accent)]"
        )}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 8 4 4-4 4" />
          <path d="M2 12h20" />
          <path d="m6 8-4 4 4 4" />
        </svg>
        {label}
      </label>
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-[var(--radius)] border bg-[var(--background)] px-4 [transition:border-color_.2s,box-shadow_var(--ns-time-state)]",
          focused || scrubbing ? "border-[color-mix(in_oklab,var(--foreground)_55%,var(--input))] shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]" : "border-[var(--input)]"
        )}
      >
        {prefix != null && <span className="font-mono text-[15px] text-[var(--muted-foreground)]">{prefix}</span>}
        <input
          ref={refs}
          id={inputId}
          role="spinbutton"
          inputMode="numeric"
          value={num.toLocaleString(locale)}
          aria-valuenow={num}
          aria-valuemin={lo}
          aria-valuemax={hi}
          onFocus={() => {
            setFocused(true)
            sfx.focus()
          }}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "")
            const next = clamp(Number(digits || "0"))
            if (next !== num) sfx.key()
            setNum(next)
          }}
          onKeyDown={(event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
            event.preventDefault()
            const by = (event.shiftKey ? 10 : 1) * safeStep * (event.key === "ArrowUp" ? 1 : -1)
            const next = clamp(num + by)
            detent(next)
            setNum(next)
          }}
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[15px] text-[var(--foreground)] tabular-nums outline-none pointer-coarse:text-[16px]"
          {...props}
        />
        {unit != null && <span className="font-mono text-[length:var(--ns-type-note)] text-[var(--muted-foreground)]">{unit}</span>}
      </div>
      <div aria-hidden="true" className="relative h-[22px] [mask-image:linear-gradient(90deg,transparent,#000_20%,#000_80%,transparent)]">
        <div
          className={cn(
            "absolute inset-0 [background-image:linear-gradient(90deg,var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--muted-foreground)_1px,transparent_1px)] [background-repeat:repeat-x] [background-size:8px_9px,40px_15px] [background-position-y:bottom]",
            scrubbing ? "transition-none" : "[transition:background-position_.35s_cubic-bezier(.2,1.2,.3,1)]"
          )}
          style={{ backgroundPositionX: `calc(50% + ${offset}px)` }}
        />
        <span className="absolute start-1/2 bottom-0 h-full w-0.5 -translate-x-1/2 rounded-full bg-[var(--foreground)] rtl:translate-x-1/2" />
      </div>
    </div>
  )
})

export { ScrubNumber, type ScrubNumberProps }
