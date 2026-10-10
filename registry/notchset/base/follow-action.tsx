"use client"

/**
 * Follow Action (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/follow-action
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { ActionPill, CHECK, Glyph } from "@/lib/notchset/action-pill"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Follow Action: the plus turns 135° into a check as the disc goes green, a burst plays and the follower
 * count rolls up.
 */

interface FollowActionProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  following: boolean
  onFollowingChange: (following: boolean) => void
  /** Followers, yours included when following. */
  followers?: number | undefined
  sound?: boolean | undefined
}

const FollowAction = React.forwardRef<HTMLButtonElement, FollowActionProps>(function FollowAction({ following, onFollowingChange, followers, sound = true, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [won, setWon] = React.useState(0)
  return (
    <ActionPill
      ref={ref}
      data-slot="follow-action"
      data-notchset=""
      aria-pressed={following}
      onClick={() => {
        if (!following) {
          sfx.pop()
          sfx.tone(1100, 0.12, "sine", 0.04, 0.07)
          setWon((n) => n + 1)
        } else sfx.drop()
        onFollowingChange(!following)
      }}
      index={following ? 1 : 0}
      labels={["Follow", "Following"]}
      meta={followers === undefined ? undefined : [<span key="f" className="inline-flex gap-1"><NumberFlow value={followers.toLocaleString("en-US")} /> followers</span>]}
      icons={[<Glyph key="p" d={["M12 5v14", "M5 12h14"]} />, <Glyph key="c" d={CHECK} width={2.8} />]}
      icon={following ? 1 : 0}
      iconOut={["rotate(135deg) scale(.4)", "rotate(-135deg) scale(.4)"]}
      disc={following ? "var(--success,var(--foreground))" : "var(--foreground)"}
      burst={following ? won : 0}
      {...props}
    />
  )
})

export { FollowAction, type FollowActionProps }
