"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * NumberFlow: the fluid number every changing figure renders through (countdowns, times, counts, totals).
 * Each digit is its own 0–9 column that springs to the new digit with a slight motion blur; digits that
 * appear or disappear animate their width, so the text never jumps. Other characters (":", ",", " ")
 * swap in place. Screen readers get the plain value.
 */

const H = 1.15 // em, one digit row

function Digit({ d, enter, tight }: { d: number; enter: boolean; tight?: boolean | undefined }) {
  // Each change flips between two identical blur keyframes, so the blur restarts every time.
  const [seen, setSeen] = React.useState(d)
  const [flips, setFlips] = React.useState(0)
  if (seen !== d) {
    setSeen(d)
    setFlips((n) => n + 1)
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-block [clip-path:inset(0_-0.15em)]",
        // Tight digits are narrower than their glyphs: they clip only up and down (the clip-path bounds the sides), so a 1 isn't cut.
        tight ? "[overflow-x:visible] [overflow-y:clip] transition-[width] duration-[.55s] ease-[var(--ns-ease-settle)] motion-reduce:transition-none" : "w-[1ch] overflow-hidden",
        enter && "animate-[ns-num-in_.55s_var(--ns-ease-settle)_both] motion-reduce:animate-none"
      )}
      // Tight digits: a 1 is narrower than the rest, as in a headline price.
      style={{ height: `${H}em`, lineHeight: `${H}em`, width: tight ? (d === 1 ? "0.43em" : "0.58em") : undefined }}
    >
      <span
        className={cn(
          "flex flex-col",
          // Tight: each glyph keeps a box as wide as itself, centred in the narrower slot.
          tight && "items-center",
          "[transition:transform_.85s_var(--ns-ease-settle),scale_.85s_var(--ns-ease-settle),translate_.85s_var(--ns-ease-settle),rotate_.85s_var(--ns-ease-settle)] motion-reduce:transition-none",
          flips > 0 && (flips % 2 ? "animate-[ns-num-blur_.45s_ease-out]" : "animate-[ns-num-blur-b_.45s_ease-out]")
        )}
        style={{ transform: `translateY(${-d * H}em)` }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cn("block text-center", tight && "w-[0.76em] shrink-0")} style={{ height: `${H}em` }}>
            {i}
          </span>
        ))}
      </span>
    </span>
  )
}

interface NumberFlowProps extends Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  /** The value as it should read, e.g. 42, "09:30" or "1,204". */
  value: string | number
  /** Proportional digit widths (a 1 is 0.43em, the rest 0.58em), for large headline figures. */
  tight?: boolean | undefined
}

const NumberFlow = React.forwardRef<HTMLSpanElement, NumberFlowProps>(function NumberFlow({ value, tight, className, ...props }, ref) {
  const text = String(value)
  const chars = Array.from(text)
  // Positions are counted from the right, so the ones digit stays the ones digit when the length changes.
  const [initialLength] = React.useState(chars.length)
  const [prev, setPrev] = React.useState(text)
  const [leaving, setLeaving] = React.useState<{ id: string; ch: string }[]>([])
  if (prev !== text) {
    const old = Array.from(prev)
    if (old.length > chars.length) {
      const gone = old.slice(0, old.length - chars.length).filter((ch) => ch >= "0" && ch <= "9")
      setLeaving((l) => [...l, ...gone.map((ch, i) => ({ id: `${prev}>${text}:${i}`, ch }))].slice(-4))
    }
    setPrev(text)
  }

  return (
    <span ref={ref} data-slot="number-flow" className={cn("inline-flex whitespace-nowrap tabular-nums", className)} {...props}>
      <span className="sr-only">{text}</span>
      {leaving.map((g) => (
        <span
          key={`out-${g.id}`}
          aria-hidden="true"
          className="inline-block w-0 animate-[ns-num-out_.45s_var(--ns-ease-settle)_both] overflow-hidden text-center"
          style={{ height: `${H}em`, lineHeight: `${H}em` }}
          onAnimationEnd={() => setLeaving((l) => l.filter((x) => x.id !== g.id))}
        >
          {g.ch}
        </span>
      ))}
      {chars.map((ch, i) => {
        const pos = chars.length - i
        return ch >= "0" && ch <= "9" ? (
          <Digit key={`d${pos}`} d={Number(ch)} enter={pos > initialLength} tight={tight} />
        ) : (
          <span key={`s${pos}`} aria-hidden="true" className="inline-block whitespace-pre" style={{ height: `${H}em`, lineHeight: `${H}em` }}>
            {ch}
          </span>
        )
      })}
    </span>
  )
})

export { NumberFlow, type NumberFlowProps }
