"use client"

/**
 * Send Action (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/send-action
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { ActionPill, CHECK, Glyph, useStatusChange } from "@/lib/notchset/action-pill"
import { useSound } from "@/lib/notchset/sound"

/*
 * Send Action: the plane flies out of the disc, a short comet orbits the outline in --chart-1, then the
 * check lands and the ring closes. The meta line names who it goes to.
 */

type SendStatus = "idle" | "sending" | "sent"

interface SendActionProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  status: SendStatus
  meta?: readonly [React.ReactNode, React.ReactNode, React.ReactNode] | undefined
  sound?: boolean | undefined
}

const SendAction = React.forwardRef<HTMLButtonElement, SendActionProps>(function SendAction({ status, meta, sound = true, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [won, setWon] = React.useState(0)
  useStatusChange(status, (s) => {
    if (s === "sending") sfx.whoosh()
    else if (s === "sent") {
      sfx.chime()
      setWon((n) => n + 1)
    }
  })
  const i = ["idle", "sending", "sent"].indexOf(status)
  return (
    <ActionPill
      ref={ref}
      data-slot="send-action"
      data-notchset=""
      aria-busy={status === "sending" || undefined}
      index={i}
      labels={["Send", "Sending…", "Sent"]}
      meta={meta}
      metaIndex={i}
      icons={[<Glyph key="p" d={["M22 2 11 13", "M22 2 15 22l-4-9-9-4z"]} width={2.2} />, <Glyph key="c" d={CHECK} width={2.8} />]}
      icon={status === "sent" ? 1 : status === "idle" ? 0 : -1}
      iconOut={["translate(24px,-24px) scale(.6)", undefined]}
      disc={status === "idle" ? "var(--foreground)" : status === "sent" ? "var(--success,var(--foreground))" : "var(--chart-1)"}
      tone={status === "sent" ? "color-mix(in oklab, var(--success,var(--foreground)) 75%, var(--foreground))" : "var(--foreground)"}
      outline={{ mode: status === "sending" ? "orbit" : status === "sent" ? "ring" : "none", color: status === "sent" ? "var(--success,var(--foreground))" : "var(--chart-1)" }}
      halo={status === "sent" ? won : 0}
      {...props}
    />
  )
})

export { SendAction, type SendActionProps, type SendStatus }
