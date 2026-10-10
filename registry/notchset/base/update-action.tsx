"use client"

/**
 * Update Action (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/update-action
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { ActionPill, CHECK, Glyph, useStatusChange } from "@/lib/notchset/action-pill"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Update Action: Update → a rolling percentage while it downloads (the arrow falls through the disc) →
 * Installing… with a marching outline → Up to date, the ring closing with a halo and a burst.
 */

type UpdateStatus = "idle" | "downloading" | "installing" | "done"

interface UpdateActionProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  status: UpdateStatus
  /** Download progress, 0–100. */
  progress?: number | undefined
  /** "Version 2.4.1 · 18 MB" and friends; one per status. */
  meta?: readonly React.ReactNode[] | undefined
  sound?: boolean | undefined
}

const ORDER: UpdateStatus[] = ["idle", "downloading", "installing", "done"]

const UpdateAction = React.forwardRef<HTMLButtonElement, UpdateActionProps>(function UpdateAction({ status, progress = 0, meta, sound = true, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [won, setWon] = React.useState(0)
  useStatusChange(status, (s, was) => {
    if (s === "downloading") {
      sfx.press()
      sfx.rise()
    } else if (s === "installing") sfx.noise(0.4, 0.04, 500, 2400)
    else if (s === "done") {
      sfx.chime()
      setWon((n) => n + 1)
    } else if (was === "done") sfx.tick()
  })
  const i = ORDER.indexOf(status)
  return (
    <ActionPill
      ref={ref}
      data-slot="update-action"
      data-notchset=""
      aria-busy={status === "downloading" || status === "installing" || undefined}
      index={i}
      labels={["Update", <NumberFlow key="p" value={`${Math.floor(progress)}%`} />, "Installing…", "Up to date"]}
      meta={meta}
      metaIndex={i}
      icons={[<Glyph key="a" d={["M12 5v14", "m19 12-7 7-7-7"]} />, <Glyph key="c" d={CHECK} width={2.8} />]}
      icon={status === "done" ? 1 : 0}
      iconMotion={status === "downloading" && "fall"}
      disc={status === "idle" ? "var(--foreground)" : status === "done" ? "var(--success,var(--foreground))" : "var(--info,var(--chart-1))"}
      tone={status === "done" ? "color-mix(in oklab, var(--success,var(--foreground)) 75%, var(--foreground))" : "var(--foreground)"}
      outline={{ mode: status === "downloading" ? "progress" : status === "installing" ? "march" : status === "done" ? "ring" : "none", progress, color: status === "done" ? "var(--success,var(--foreground))" : "var(--info,var(--chart-1))" }}
      halo={status === "done" ? won : 0}
      burst={status === "done" ? won : 0}
      {...props}
    />
  )
})

export { UpdateAction, type UpdateActionProps, type UpdateStatus }
