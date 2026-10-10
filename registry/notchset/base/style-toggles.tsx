"use client"

/**
 * Style Toggles (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/style-toggles
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Style Toggles: bold, italic, underline and strikethrough as pressed toggles, then an alignment radio
 * group with a sliding thumb. Neighbouring active toggles merge: each drops its inner corner from 10px
 * to 4px so a run of them reads as one shape.
 */

type Mark = "bold" | "italic" | "underline" | "strike"
type Align = "left" | "center" | "right"

interface StyleTogglesProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  marks: readonly Mark[]
  onMarksChange: (marks: Mark[]) => void
  align: Align
  onAlignChange: (align: Align) => void
  sound?: boolean | undefined
}

const MARKS: readonly { id: Mark; label: string; paths: readonly string[] }[] = [
  { id: "bold", label: "Bold", paths: ["M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"] },
  { id: "italic", label: "Italic", paths: ["M19 4h-9", "M14 20H5", "M15 4 9 20"] },
  { id: "underline", label: "Underline", paths: ["M6 4v6a6 6 0 0 0 12 0V4", "M4 20h16"] },
  { id: "strike", label: "Strikethrough", paths: ["M16 4H9a3 3 0 0 0-2.83 4", "M14 12a4 4 0 0 1 0 8H6", "M4 12h16"] },
]
const ALIGNS: readonly { id: Align; label: string; paths: readonly string[] }[] = [
  { id: "left", label: "Align left", paths: ["M15 12H3", "M17 18H3", "M21 6H3"] },
  { id: "center", label: "Align center", paths: ["M17 12H7", "M19 18H5", "M21 6H3"] },
  { id: "right", label: "Align right", paths: ["M21 12H9", "M21 18H7", "M21 6H3"] },
]

const StyleToggles = React.forwardRef<HTMLDivElement, StyleTogglesProps>(function StyleToggles({ marks, onMarksChange, align, onAlignChange, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const ai = Math.max(0, ALIGNS.findIndex((a) => a.id === align))
  const pickAlign = (k: number) => {
    const a = ALIGNS[(k + ALIGNS.length) % ALIGNS.length]!
    if (a.id === align) return
    sfx.tone(900 + ALIGNS.indexOf(a) * 80, 0.03, "triangle", 0.03)
    onAlignChange(a.id)
  }

  return (
    <div ref={ref} role="toolbar" aria-label="Text style" data-slot="style-toggles" data-notchset="" className={cn("flex h-[42px] w-fit items-center gap-1 rounded-[15px] border border-[var(--border)] bg-[var(--background)] p-1 shadow-[0_8px_20px_-16px_rgba(0,0,0,.4)]", className)} {...props}>
      <div role="group" aria-label="Marks" className="flex gap-0.5">
        {MARKS.map((m, j) => {
          const on = marks.includes(m.id)
          const before = j > 0 && marks.includes(MARKS[j - 1]!.id)
          const after = j < MARKS.length - 1 && marks.includes(MARKS[j + 1]!.id)
          const s = on && before ? 4 : 10
          const e = on && after ? 4 : 10
          return (
            <button
              key={m.id}
              type="button"
              aria-label={m.label}
              aria-pressed={on}
              onClick={() => {
                sfx.tone(!on ? 1000 + j * 60 : 700, 0.035, "triangle", 0.035)
                onMarksChange(on ? marks.filter((x) => x !== m.id) : [...marks, m.id])
              }}
              className={cn(
                "grid size-[var(--ns-control-compact)] cursor-pointer place-items-center outline-none [transition:border-radius_.35s_var(--ns-ease-reshape),background-color_.2s,color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.88] motion-reduce:transition-none",
                on ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--foreground)] hover:bg-[var(--accent)]"
              )}
              style={{ borderStartStartRadius: s, borderEndStartRadius: s, borderStartEndRadius: e, borderEndEndRadius: e }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                {m.paths.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
            </button>
          )
        })}
      </div>
      <span aria-hidden="true" className="mx-1 h-[18px] w-px bg-[var(--border)]" />
      <div
        role="radiogroup"
        aria-label="Alignment"
        dir="ltr"
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "ArrowDown" && e.key !== "ArrowUp") return
          e.preventDefault()
          const k = ai + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1)
          pickAlign(k)
          ;(e.currentTarget.querySelectorAll("[role=radio]")[(k + ALIGNS.length) % ALIGNS.length] as HTMLElement | undefined)?.focus()
        }}
        className="relative flex gap-0.5"
      >
        <span aria-hidden="true" className="pointer-events-none absolute start-0 top-0 size-8 rounded-[10px] bg-[var(--muted)] [transition:translate_.45s_var(--ns-ease-reshape)] motion-reduce:transition-none" style={{ translate: `${ai * 34}px 0` }} />
        {ALIGNS.map((a, k) => (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={k === ai}
            aria-label={a.label}
            tabIndex={k === ai ? 0 : -1}
            onClick={() => pickAlign(k)}
            className={cn("relative grid size-[var(--ns-control-compact)] cursor-pointer place-items-center rounded-[10px] outline-none [transition:color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.88]", k === ai ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              {a.paths.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
})

export { StyleToggles, type Align, type Mark, type StyleTogglesProps }
