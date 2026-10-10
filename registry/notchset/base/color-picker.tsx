"use client"

/**
 * Color Picker (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/color-picker
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Color Picker: a saturation and brightness pad, a hue rail and swatches, with a live WCAG check of white
 * text on the colour (AA pass, AA large or Fails). Dragging ticks once per step of hue, saturation or
 * brightness, pitched by hue. The HEX value is editable; arrow keys move both knobs. The pad and rail
 * keep their physical direction in mirrored layouts (colour, not reading order).
 */

type Hsv = { h: number; s: number; v: number }

const SWATCHES = ["#2563EB", "#7C3AED", "#0D9488", "#D97706", "#E11D48", "#18181B"]

function toRgb({ h, s, v }: Hsv) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return [f(5), f(3), f(1)].map((x) => Math.round(x * 255)) as [number, number, number]
}
const toHex = (c: Hsv) => `#${toRgb(c).map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()}`
function fromHex(hex: string): Hsv | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1]!, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max ? d / max : 0, v: max / 255 }
}
function luminance(rgb: [number, number, number]) {
  const [r, g, b] = rgb.map((x) => {
    const c = x / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

interface ColorPickerProps extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  /** "#RRGGBB". */
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((hex: string) => void) | undefined
  label?: React.ReactNode | undefined
  swatches?: readonly string[] | undefined
  sound?: boolean | undefined
}

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(function ColorPicker(
  { value, defaultValue = "#2C6BF5", onValueChange, label = "Colour", swatches = SWATCHES, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [inner, setInner] = React.useState<Hsv>(() => fromHex(defaultValue) ?? { h: 222, s: 0.82, v: 0.96 })
  const [drag, setDrag] = React.useState<"pad" | "hue" | null>(null)
  const [draft, setDraft] = React.useState<string | null>(null)
  const bucket = React.useRef("")
  const hsv = value !== undefined ? (fromHex(value) ?? inner) : inner
  const hex = toHex(hsv)
  const ratio = 1.05 / (luminance(toRgb(hsv)) + 0.05)
  const grade = ratio >= 4.5 ? "pass" : ratio >= 3 ? "large" : "fail"
  const id = React.useId()

  const set = (next: Hsv) => {
    const q = `${Math.round(next.h / 8)}|${Math.round(next.s * 12)}|${Math.round(next.v * 12)}`
    if (q !== bucket.current) {
      bucket.current = q
      sfx.tone(900 + next.h * 2, 0.01, "triangle", 0.016)
    }
    if (value === undefined) setInner(next)
    onValueChange?.(toHex(next))
  }
  const clamp = (n: number) => Math.max(0, Math.min(1, n))
  const padAt = (event: React.PointerEvent<HTMLDivElement>) => {
    const r = event.currentTarget.getBoundingClientRect()
    const x = clamp((event.clientX - r.left) / r.width)
    set({ ...hsv, s: x, v: clamp(1 - (event.clientY - r.top) / r.height) })
  }
  const hueAt = (event: React.PointerEvent<HTMLDivElement>) => {
    const r = event.currentTarget.getBoundingClientRect()
    const x = clamp((event.clientX - r.left) / r.width)
    set({ ...hsv, h: Math.min(359, x * 360) })
  }

  return (
    <div ref={ref} data-slot="color-picker" data-notchset="" className={cn("flex w-full max-w-[300px] flex-col gap-3 text-[var(--foreground)]", className)} {...props}>
      <div className="flex items-center gap-2.5 self-start rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] py-1.5 ps-1.5 pe-3.5">
        <span aria-hidden="true" className="size-8 rounded-[var(--radius)] shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]" style={{ background: hex }} />
        <span className="flex flex-col">
          <label htmlFor={`${id}-hex`} className="text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
            {label}
          </label>
          <input
            id={`${id}-hex`}
            value={draft ?? hex}
            spellCheck={false}
            maxLength={7}
            onChange={(event) => {
              setDraft(event.target.value)
              const next = fromHex(event.target.value)
              if (next) set(next)
            }}
            onBlur={() => setDraft(null)}
            className="w-[76px] bg-transparent p-0 font-mono text-[length:var(--ns-type-label)] font-medium uppercase outline-none focus-visible:underline focus-visible:underline-offset-4"
          />
        </span>
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setDrag("pad")
          padAt(event)
        }}
        onPointerMove={(event) => drag === "pad" && padAt(event)}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.02
          if (event.key === "ArrowRight") set({ ...hsv, s: clamp(hsv.s + step) })
          else if (event.key === "ArrowLeft") set({ ...hsv, s: clamp(hsv.s - step) })
          else if (event.key === "ArrowUp") set({ ...hsv, v: clamp(hsv.v + step) })
          else if (event.key === "ArrowDown") set({ ...hsv, v: clamp(hsv.v - step) })
          else return
          event.preventDefault()
        }}
        className="relative h-[150px] cursor-crosshair touch-none rounded-[min(var(--radius),14px)] shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${Math.round(hsv.h)}, 100%, 50%))` }}
      >
        <span
          aria-hidden="true"
          className={cn("pointer-events-none absolute size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white shadow-[0_0_0_1px_rgba(0,0,0,.25),0_2px_6px_rgba(0,0,0,.25)] [transition:transform_.2s_var(--ns-ease-rebound),scale_.2s_var(--ns-ease-rebound),translate_.2s_var(--ns-ease-rebound),rotate_.2s_var(--ns-ease-rebound)]", drag === "pad" ? "scale-[1.15]" : "scale-100")}
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }}
        />
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(hsv.h)}
        aria-valuetext={`${Math.round(hsv.h)} degrees`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setDrag("hue")
          hueAt(event)
        }}
        onPointerMove={(event) => drag === "hue" && hueAt(event)}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 15 : 2
          if (event.key === "ArrowRight" || event.key === "ArrowUp") set({ ...hsv, h: Math.min(359, hsv.h + step) })
          else if (event.key === "ArrowLeft" || event.key === "ArrowDown") set({ ...hsv, h: Math.max(0, hsv.h - step) })
          else return
          event.preventDefault()
        }}
        className="relative h-3.5 cursor-ew-resize touch-none rounded-[7px] bg-[linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white shadow-[0_0_0_1px_rgba(0,0,0,.25),0_2px_6px_rgba(0,0,0,.25)]"
          style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${Math.round(hsv.h)}, 100%, 50%)` }}
        />
      </div>
      <div className="flex gap-1.5">
        {swatches.map((s) => {
          const on = s.toUpperCase() === hex
          return (
            <button
              key={s}
              type="button"
              aria-label={s}
              aria-pressed={on}
              onClick={() => {
                const next = fromHex(s)
                if (!next) return
                sfx.pop()
                bucket.current = ""
                if (value === undefined) setInner(next)
                onValueChange?.(toHex(next))
              }}
              className="h-[26px] flex-1 cursor-pointer rounded-[min(var(--radius),8px)] outline-none [transition:transform_.2s_var(--ns-ease-rebound),scale_.2s_var(--ns-ease-rebound),translate_.2s_var(--ns-ease-rebound),rotate_.2s_var(--ns-ease-rebound),box-shadow_.2s] hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
              style={{ background: s, boxShadow: on ? `0 0 0 2px var(--background), 0 0 0 4px ${s}` : "inset 0 0 0 1px rgba(0,0,0,.08)" }}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2 rounded-[min(var(--radius),12px)] bg-[var(--muted)] px-3 py-2.5">
        <span aria-hidden="true" className="inline-flex h-[30px] shrink-0 items-center rounded-[var(--radius)] px-3 text-[length:var(--ns-type-note)] font-medium text-white" style={{ background: hex }}>
          Aa Button
        </span>
        <span className="flex flex-1 flex-col gap-px">
          <span className="font-mono text-[length:var(--ns-type-note)] tabular-nums">{ratio.toFixed(2)}:1 on white</span>
          <span className="text-[11px] text-[color-mix(in_oklab,var(--muted-foreground)_80%,var(--foreground))]">
            H {Math.round(hsv.h)}° · S {Math.round(hsv.s * 100)}% · B {Math.round(hsv.v * 100)}%
          </span>
        </span>
        <span
          className={cn(
            "inline-flex h-[22px] items-center rounded-[var(--radius)] px-2 font-mono text-[10.5px] font-semibold whitespace-nowrap [transition:background-color_.2s,color_.2s]",
            grade === "pass" && "bg-[color-mix(in_oklab,var(--success,var(--foreground))_16%,transparent)] text-[color-mix(in_oklab,var(--success,var(--foreground))_70%,var(--foreground))]",
            grade === "large" && "bg-[color-mix(in_oklab,var(--warning,var(--foreground))_16%,transparent)] text-[color-mix(in_oklab,var(--warning,var(--foreground))_62%,var(--foreground))]",
            grade === "fail" && "bg-[color-mix(in_oklab,var(--destructive)_16%,transparent)] text-[color-mix(in_oklab,var(--destructive)_70%,var(--foreground))]"
          )}
        >
          {grade === "pass" ? "AA pass" : grade === "large" ? "AA large" : "Fails"}
        </span>
      </div>
    </div>
  )
})

export { ColorPicker, type ColorPickerProps }
