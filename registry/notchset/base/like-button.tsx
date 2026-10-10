"use client"

/**
 * Like Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/like-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Like: the heart squashes and fills from the bottom up in --heart (falling back to --destructive),
 * three small hearts float off, and the count rolls up by one. Unliking drains it and deflates.
 */

interface LikeButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  liked?: boolean | undefined
  defaultLiked?: boolean | undefined
  onLikedChange?: ((liked: boolean) => void) | undefined
  /** The like count including yours; rolls by one as you like. */
  count?: number | undefined
  formatCount?: ((n: number) => string) | undefined
  /** The accessible name. Default "Like". */
  label?: string | undefined
  sound?: boolean | undefined
}

const HEART = "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
const MINIS = [
  { x: -7, delay: "0s", turn: "-25deg" },
  { x: 5, delay: ".12s", turn: "12deg" },
  { x: 14, delay: ".05s", turn: "30deg" },
]

const LikeButton = React.forwardRef<HTMLButtonElement, LikeButtonProps>(function LikeButton(
  { liked, defaultLiked = false, onLikedChange, count, formatCount = (n) => n.toLocaleString(), label = "Like", sound = true, disabled, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const clipId = React.useId()
  const [inner, setInner] = React.useState(defaultLiked)
  const on = liked ?? inner
  const [presses, setPresses] = React.useState(0)
  const [base] = React.useState(() => (count === undefined ? 0 : on ? count - 1 : count))

  const toggle = () => {
    const next = !on
    if (next) {
      sfx.heart()
    } else sfx.drop()
    setPresses((n) => n + 1)
    if (liked === undefined) setInner(next)
    onLikedChange?.(next)
  }

  return (
    <button
      ref={ref}
      type="button"
      data-slot="like-button"
      data-notchset=""
      aria-pressed={on}
      aria-label={count === undefined ? label : `${label}, ${formatCount(on ? base + 1 : base)}`}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className
      )}
      {...props}
    >
      <span
        key={presses}
        aria-hidden="true"
        className={cn(
          "relative block size-[18px] shrink-0 [transition:color_.3s]",
          on ? "text-[var(--heart,var(--destructive))]" : "text-current",
          presses > 0 && (on ? "animate-[ns-squish_.6s_cubic-bezier(.3,.7,.4,1)]" : "animate-[ns-deflate_.35s_ease-out]")
        )}
      >
        <svg viewBox="0 0 24 24" className="absolute inset-0 size-[18px] overflow-visible" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <clipPath id={clipId}>
              <rect x="-1" y="-1" width="26" height="26" className="[transition:transform_.55s_cubic-bezier(.3,1.25,.4,1),scale_.55s_cubic-bezier(.3,1.25,.4,1),translate_.55s_cubic-bezier(.3,1.25,.4,1),rotate_.55s_cubic-bezier(.3,1.25,.4,1)]" style={{ transform: `translateY(${on ? 0 : 25}px)` }} />
            </clipPath>
          </defs>
          <path d={HEART} fill="currentColor" stroke="none" clipPath={`url(#${clipId})`} />
          <path d={HEART} />
        </svg>
        {on &&
          presses > 0 &&
          MINIS.map((mini) => (
            <svg
              key={mini.x}
              viewBox="0 0 24 24"
              fill="currentColor"
              className="pointer-events-none absolute -top-0.5 size-[9px] animate-[ns-float_.95s_cubic-bezier(.2,.7,.3,1)_both]"
              style={{ left: mini.x, animationDelay: mini.delay, "--r": mini.turn } as React.CSSProperties}
            >
              <path d={HEART} />
            </svg>
          ))}
      </span>
      {count !== undefined && (
        <span aria-hidden="true" className="block h-5 overflow-hidden font-mono text-[length:var(--ns-type-label)] leading-5 tabular-nums">
          <span className="flex flex-col [transition:transform_.45s_cubic-bezier(.2,1.4,.3,1),scale_.45s_cubic-bezier(.2,1.4,.3,1),translate_.45s_cubic-bezier(.2,1.4,.3,1),rotate_.45s_cubic-bezier(.2,1.4,.3,1)]" style={{ transform: `translateY(${on ? -20 : 0}px)` }}>
            <span>{formatCount(base)}</span>
            <span>{formatCount(base + 1)}</span>
          </span>
        </span>
      )}
    </button>
  )
})

export { LikeButton, type LikeButtonProps }
