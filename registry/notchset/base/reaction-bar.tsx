"use client"

/**
 * Reaction Bar (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/reaction-bar
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { HoverPill, ParticleBurst, useHoverPill } from "@/lib/notchset/capsule-group"
import { HEART } from "@/lib/notchset/heart"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { RollingLabel } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Reaction Bar: like, repost and save in one capsule. A hover pill glides between them; like squeezes
 * and bursts the heart with a ring and particles, repost spins its arrows 180° and turns green, save
 * fills the bookmark and drops it in. The line underneath rolls to whatever you did last.
 */

type Reaction = "like" | "repost" | "save"

interface ReactionBarProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  liked: boolean
  likes: number
  reposted: boolean
  reposts: number
  saved: boolean
  /** Toggle a reaction; update the flags and counts. */
  onReact: (reaction: Reaction, on: boolean) => void
  /** The rows under the bar: idle, then after a like, a repost and a save. */
  meta?: readonly [React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode] | undefined
  sound?: boolean | undefined
}

const fmt = (n: number) => n.toLocaleString("en-US")

const ReactionBar = React.forwardRef<HTMLDivElement, ReactionBarProps>(function ReactionBar({ liked, likes, reposted, reposts, saved, onReact, meta = ["Like, repost or save", "You liked this", "Reposted", "Saved"], sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const { box, enter, leave } = useHoverPill()
  const [last, setLast] = React.useState(0)
  const [bursts, setBursts] = React.useState(0)
  const [drops, setDrops] = React.useState(0)

  const like = () => {
    const on = !liked
    setLast(on ? 1 : 0)
    if (on) {
      setBursts((n) => n + 1)
      sfx.pop()
      sfx.tone(1320, 0.1, "sine", 0.03, 0.06)
    } else sfx.drop()
    onReact("like", on)
  }
  const repost = () => {
    const on = !reposted
    setLast(on ? 2 : 0)
    if (on) {
      sfx.noise(0.25, 0.03, 900, 2600)
      sfx.tone(880, 0.06, "triangle", 0.04, 0.08, 1180)
    } else sfx.tone(700, 0.05, "triangle", 0.03, 0, 500)
    onReact("repost", on)
  }
  const save = () => {
    const on = !saved
    setLast(on ? 3 : 0)
    if (on) {
      setDrops((n) => n + 1)
      sfx.tone(520, 0.08, "triangle", 0.05, 0, 760)
    } else sfx.drop()
    onReact("save", on)
  }

  return (
    <div ref={ref} data-slot="reaction-bar" data-notchset="" className={cn("flex flex-col items-center gap-3.5", className)} {...props}>
      <div role="group" aria-label="Reactions" onMouseLeave={leave} className="relative flex h-11 items-center rounded-full border border-[var(--border)] bg-[var(--background)] p-1 shadow-[0_8px_20px_-16px_rgba(0,0,0,.4)]">
        <HoverPill box={box} />
        <button
          type="button"
          aria-pressed={liked}
          aria-label={`Like, ${fmt(likes)}`}
          onMouseEnter={enter}
          onFocus={enter}
          onClick={like}
          className="relative flex h-[34px] w-[88px] cursor-pointer items-center justify-center gap-[7px] rounded-full outline-none [transition:scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.94]"
        >
          <span key={bursts} className={cn("relative flex [transition:color_var(--ns-time-color)]", liked ? "text-[var(--heart,var(--chart-5))]" : "text-[var(--foreground)]", bursts > 0 && liked && "animate-[ns-heart-pop_.45s_var(--ns-ease-rebound)] motion-reduce:animate-none")}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={HEART} />
            </svg>
            {bursts > 0 && liked && <ParticleBurst />}
          </span>
          <NumberFlow value={fmt(likes)} className={cn("font-mono text-[12.5px] [transition:color_var(--ns-time-color)]", liked ? "text-[var(--heart,var(--chart-5))]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")} />
        </button>
        <button
          type="button"
          aria-pressed={reposted}
          aria-label={`Repost, ${fmt(reposts)}`}
          onMouseEnter={enter}
          onFocus={enter}
          onClick={repost}
          className="relative flex h-[34px] w-20 cursor-pointer items-center justify-center gap-[7px] rounded-full outline-none [transition:scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.94]"
        >
          <span className={cn("flex [transition:rotate_.6s_var(--ns-ease-reshape),color_var(--ns-time-color)] motion-reduce:transition-none", reposted ? "rotate-180 text-[var(--success,var(--foreground))]" : "text-[var(--foreground)]")}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m17 2 4 4-4 4" />
              <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
              <path d="m7 22-4-4 4-4" />
              <path d="M21 13v1a4 4 0 0 1-4 4H3" />
            </svg>
          </span>
          <NumberFlow value={fmt(reposts)} className={cn("font-mono text-[12.5px] [transition:color_var(--ns-time-color)]", reposted ? "text-[var(--success,var(--foreground))]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")} />
        </button>
        <button
          type="button"
          aria-pressed={saved}
          aria-label="Save"
          onMouseEnter={enter}
          onFocus={enter}
          onClick={save}
          className="relative flex h-[34px] w-11 cursor-pointer items-center justify-center rounded-full outline-none [transition:scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.94]"
        >
          <span key={drops} className={cn("flex", drops > 0 && saved && "animate-[ns-drop-in_.5s_cubic-bezier(.2,1.4,.4,1)] motion-reduce:animate-none")}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 [transition:fill_.2s]" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
          </span>
        </button>
      </div>
      <span aria-live="polite" className="min-w-[260px] font-mono text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
        <RollingLabel size="sm" index={last} rows={meta} />
      </span>
    </div>
  )
})

export { ReactionBar, type Reaction, type ReactionBarProps }
