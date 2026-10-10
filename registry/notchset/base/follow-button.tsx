"use client"

/**
 * Follow Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/follow-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, DrawCheck, RollingLabel } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Follow: a primary button that cross-fades to outline once you follow; the plus turns and shrinks
 * away as a check draws in. Hovering while following offers Unfollow. With `count`, the follower count
 * rolls beneath it.
 */

interface FollowButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  following?: boolean | undefined
  defaultFollowing?: boolean | undefined
  onFollowingChange?: ((following: boolean) => void) | undefined
  /** The follower count including you; rolls by one as you follow. */
  count?: number | undefined
  /** Formats the count. Default: the visitor's locale (1,204). */
  formatCount?: ((n: number) => string) | undefined
  sound?: boolean | undefined
}

const FollowButton = React.forwardRef<HTMLButtonElement, FollowButtonProps>(function FollowButton(
  { following, defaultFollowing = false, onFollowingChange, count, formatCount = (n) => n.toLocaleString(), sound = true, disabled, className, onPointerEnter, onPointerLeave, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [inner, setInner] = React.useState(defaultFollowing)
  const on = following ?? inner
  const [hover, setHover] = React.useState(false)
  const [base] = React.useState(() => (count === undefined ? 0 : on ? count - 1 : count))

  const toggle = () => {
    const next = !on
    if (next) {
      sfx.pop()
      sfx.tone(1100, 0.12, "sine", 0.04, 0.07)
    } else sfx.drop()
    setHover(false)
    if (following === undefined) setInner(next)
    onFollowingChange?.(next)
  }

  const button = (
    <button
      ref={ref}
      type="button"
      data-slot="follow-button"
      data-notchset=""
      aria-pressed={on}
      disabled={disabled}
      onClick={toggle}
      onPointerEnter={(event) => {
        setHover(true)
        onPointerEnter?.(event)
      }}
      onPointerLeave={(event) => {
        setHover(false)
        onPointerLeave?.(event)
      }}
      className={cn(
        "relative inline-flex h-11 w-[142px] max-w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color),color_var(--ns-time-color),border-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        on ? "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)]" : "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_86%,var(--background))]",
        count === undefined && className
      )}
      {...props}
    >
      <span aria-hidden="true" className="relative block size-4 shrink-0">
        <svg
          viewBox="0 0 24 24"
          className={cn("absolute inset-0 size-4 [transition:transform_.5s_var(--ns-ease-pop),scale_.5s_var(--ns-ease-pop),translate_.5s_var(--ns-ease-pop),rotate_.5s_var(--ns-ease-pop),opacity_.2s]", on ? "scale-40 rotate-[135deg] opacity-0" : "scale-100 rotate-0 opacity-100")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
        <DrawCheck shown={on} className="absolute inset-0" />
      </span>
      <RollingLabel index={!on ? 0 : hover ? 2 : 1} rows={["Follow", "Following", "Unfollow"]} />
    </button>
  )
  if (count === undefined) return button
  return (
    <div data-slot="follow-button-group" className={cn("inline-flex flex-col items-center gap-3", className)}>
      {button}
      <span aria-hidden="true" className="block h-[18px] overflow-hidden font-mono text-[length:var(--ns-type-note)] leading-[18px] text-[var(--muted-foreground)] tabular-nums">
        <span className="flex flex-col [transition:transform_.45s_cubic-bezier(.2,1.4,.3,1),scale_.45s_cubic-bezier(.2,1.4,.3,1),translate_.45s_cubic-bezier(.2,1.4,.3,1),rotate_.45s_cubic-bezier(.2,1.4,.3,1)]" style={{ transform: `translateY(${on ? -18 : 0}px)` }}>
          <span>{formatCount(base)} followers</span>
          <span>{formatCount(base + 1)} followers</span>
        </span>
      </span>
      <Announcer message={on ? `Following · ${formatCount(base + 1)} followers` : ""} />
    </div>
  )
})

export { FollowButton, type FollowButtonProps }
