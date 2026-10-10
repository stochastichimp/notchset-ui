"use client"

/**
 * Export Action (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/export-action
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { ActionPill, CHECK, Glyph, useStatusChange } from "@/lib/notchset/action-pill"
import { useSound } from "@/lib/notchset/sound"

/*
 * Export Action: three named stages roll through the label along one progress outline, a rising ding at
 * each, and it ends on the next action: Download export.zip.
 */

type ExportStatus = "idle" | "working" | "done"

interface ExportActionProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  status: ExportStatus
  /** 0–100 across all stages. */
  progress?: number | undefined
  stages?: readonly string[] | undefined
  doneLabel?: string | undefined
  /** The meta line before and after. */
  meta?: readonly [React.ReactNode, React.ReactNode] | undefined
  sound?: boolean | undefined
}

const ExportAction = React.forwardRef<HTMLButtonElement, ExportActionProps>(function ExportAction({ status, progress = 0, stages = ["Collecting rows", "Compressing", "Signing link"], doneLabel = "Download export.zip", meta = ["CSV export", "Link valid for 24 hours"], sound = true, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [won, setWon] = React.useState(0)
  const stage = status === "done" ? stages.length : status === "working" ? Math.min(stages.length, Math.floor((progress / 100) * stages.length) + 1) : 0
  useStatusChange(status, (s) => {
    if (s === "working") sfx.press()
    else if (s === "done") {
      sfx.chime()
      setWon((n) => n + 1)
    }
  })
  useStatusChange(stage, (n) => {
    if (status === "working" && n > 0) sfx.ding(Math.min(4, n))
  })
  const labels = ["Export", ...stages, doneLabel]
  const index = status === "idle" ? 0 : status === "done" ? labels.length - 1 : stage
  return (
    <ActionPill
      ref={ref}
      data-slot="export-action"
      data-notchset=""
      aria-busy={status === "working" || undefined}
      index={index}
      labels={labels}
      meta={[meta[0], <span key="s">Step {Math.max(1, stage)} of {stages.length}</span>, meta[1]]}
      metaIndex={status === "idle" ? 0 : status === "done" ? 2 : 1}
      icons={[<Glyph key="a" d={["M21 8 12 3 3 8v8l9 5 9-5z", "M3 8l9 5 9-5", "M12 13v8"]} />, <Glyph key="c" d={CHECK} width={2.8} />]}
      icon={status === "done" ? 1 : 0}
      discMotion={status === "working" && "pulse-slow"}
      disc={status === "idle" ? "var(--foreground)" : status === "done" ? "var(--success,var(--foreground))" : "var(--info,var(--chart-1))"}
      tone={status === "done" ? "color-mix(in oklab, var(--success,var(--foreground)) 75%, var(--foreground))" : "var(--foreground)"}
      outline={{ mode: status === "working" ? "progress" : status === "done" ? "ring" : "none", progress, color: status === "done" ? "var(--success,var(--foreground))" : "var(--info,var(--chart-1))" }}
      halo={status === "done" ? won : 0}
      {...props}
    />
  )
})

export { ExportAction, type ExportActionProps, type ExportStatus }
