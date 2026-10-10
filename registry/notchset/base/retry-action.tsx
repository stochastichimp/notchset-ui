"use client"

/**
 * Retry Action (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/retry-action
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { ActionPill, CHECK, Glyph, useStatusChange } from "@/lib/notchset/action-pill"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Retry Action: it starts in the error state (red disc with !, a red outline at 45%). Retrying fills the
 * outline in blue; a retry that fails again shakes, buzzes and counts the tries left; success closes a
 * green ring.
 */

type RetryStatus = "error" | "retrying" | "done"

interface RetryActionProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  status: RetryStatus
  progress?: number | undefined
  triesLeft?: number | undefined
  labels?: readonly [React.ReactNode, React.ReactNode, React.ReactNode] | undefined
  /** The meta line once done. */
  doneNote?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const RetryAction = React.forwardRef<HTMLButtonElement, RetryActionProps>(function RetryAction({ status, progress = 0, triesLeft, labels = ["Retry upload", "Retrying…", "Uploaded"], doneNote = "Saved", sound = true, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [shakes, setShakes] = React.useState(0)
  const [won, setWon] = React.useState(0)
  useStatusChange(status, (s, was) => {
    if (s === "retrying") sfx.press()
    else if (s === "error" && was === "retrying") {
      sfx.buzz()
      setShakes((n) => n + 1)
    } else if (s === "done") {
      sfx.chime()
      setWon((n) => n + 1)
    }
  })
  const i = ["error", "retrying", "done"].indexOf(status)
  return (
    <ActionPill
      ref={ref}
      data-slot="retry-action"
      data-notchset=""
      aria-busy={status === "retrying" || undefined}
      index={i}
      labels={labels}
      meta={[
        triesLeft === undefined ? "Upload failed" : <span key="t" className="inline-flex gap-1">Upload failed · <NumberFlow value={triesLeft} /> {triesLeft === 1 ? "try" : "tries"} left</span>,
        "Reconnecting",
        doneNote,
      ]}
      metaIndex={i}
      icons={[<Glyph key="e" d={["M12 7v6", "M12 17h.01"]} width={2.8} />, <Glyph key="r" d={["M21 12a9 9 0 0 1-15.5 6.2L3 16", "M3 12a9 9 0 0 1 15.5-6.2L21 8", "M21 3v5h-5", "M3 21v-5h5"]} />, <Glyph key="c" d={CHECK} width={2.8} />]}
      icon={i}
      iconMotion={status === "retrying" && "spin"}
      disc={status === "error" ? "var(--destructive)" : status === "done" ? "var(--success,var(--foreground))" : "var(--info,var(--chart-1))"}
      discInk={status === "error" ? "var(--destructive-foreground,#fff)" : "var(--background)"}
      tone={status === "error" ? "color-mix(in oklab, var(--destructive) 80%, var(--foreground))" : status === "done" ? "color-mix(in oklab, var(--success,var(--foreground)) 75%, var(--foreground))" : "var(--foreground)"}
      outline={status === "retrying" ? { mode: "progress", progress, color: "var(--info,var(--chart-1))" } : { mode: "ring", color: status === "error" ? "color-mix(in oklab, var(--destructive) 45%, transparent)" : "var(--success,var(--foreground))" }}
      shake={shakes}
      halo={status === "done" ? won : status === "error" ? shakes : 0}
      haloColor={status === "error" ? "var(--destructive)" : "var(--success,var(--foreground))"}
      {...props}
    />
  )
})

export { RetryAction, type RetryActionProps, type RetryStatus }
