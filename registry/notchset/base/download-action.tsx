"use client"

/**
 * Download Action (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/download-action
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { ActionPill, CHECK, Glyph, useStatusChange } from "@/lib/notchset/action-pill"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Download Action: Download → a rolling "12.4 / 18 MB" while a tinted fill grows behind it → Downloaded,
 * the fill turning green and the ring closing.
 */

type DownloadStatus = "idle" | "downloading" | "done"

interface DownloadActionProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  status: DownloadStatus
  /** 0–100. */
  progress?: number | undefined
  /** Total size, MB. */
  size: number
  /** Seconds left, for the meta line. */
  secondsLeft?: number | undefined
  /** The file's name for the meta line. */
  fileName?: string | undefined
  sound?: boolean | undefined
}

const DownloadAction = React.forwardRef<HTMLButtonElement, DownloadActionProps>(function DownloadAction({ status, progress = 0, size, secondsLeft, fileName = "file", sound = true, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [won, setWon] = React.useState(0)
  useStatusChange(status, (s) => {
    if (s === "downloading") sfx.press()
    else if (s === "done") {
      sfx.chime()
      setWon((n) => n + 1)
    } else sfx.tick()
  })
  const i = ["idle", "downloading", "done"].indexOf(status)
  const mb = ((progress / 100) * size).toFixed(1)
  return (
    <ActionPill
      ref={ref}
      data-slot="download-action"
      data-notchset=""
      aria-busy={status === "downloading" || undefined}
      index={i}
      labels={[
        "Download",
        <span key="mb" className="inline-flex items-baseline gap-1 font-mono text-[length:var(--ns-type-label)] tabular-nums">
          <NumberFlow value={mb} /> / {size} MB
        </span>,
        "Downloaded",
      ]}
      meta={[`${fileName} · ${size} MB`, <span key="l" className="inline-flex gap-1"><NumberFlow value={Math.max(1, secondsLeft ?? 1)} />s left</span>, "Saved to Downloads"]}
      metaIndex={i}
      icons={[<Glyph key="a" d={["M12 4v11", "m17 10-5 5-5-5", "M5 20h14"]} />, <Glyph key="c" d={CHECK} width={2.8} />]}
      icon={status === "done" ? 1 : 0}
      iconMotion={status === "downloading" && "fall"}
      disc={status === "idle" ? "var(--foreground)" : status === "done" ? "var(--success,var(--foreground))" : "var(--info,var(--chart-1))"}
      tone={status === "done" ? "color-mix(in oklab, var(--success,var(--foreground)) 75%, var(--foreground))" : "var(--foreground)"}
      fill={{ width: status === "idle" ? 0 : status === "done" ? 100 : progress, color: status === "done" ? "color-mix(in oklab, var(--success,var(--foreground)) 12%, transparent)" : "color-mix(in oklab, var(--info,var(--chart-1)) 14%, transparent)", instant: status === "downloading" }}
      outline={{ mode: status === "done" ? "ring" : "none", color: "var(--success,var(--foreground))" }}
      halo={status === "done" ? won : 0}
      {...props}
    />
  )
})

export { DownloadAction, type DownloadActionProps, type DownloadStatus }
