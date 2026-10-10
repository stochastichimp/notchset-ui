"use client"

/**
 * Save Action (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/save-action
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { ActionPill, CHECK, Glyph, useStatusChange } from "@/lib/notchset/action-pill"
import { useSound } from "@/lib/notchset/sound"

/*
 * Save Action: shows ⌘S and answers to ⌘/Ctrl+S. While saving the disc pulses and a short comet orbits
 * the outline; saved closes the ring with a bump of the disc.
 */

type SaveStatus = "idle" | "saving" | "saved"

interface SaveActionProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children" | "onClick"> {
  status: SaveStatus
  onSave: () => void
  /** Bind ⌘/Ctrl+S on the page. */
  shortcut?: boolean | undefined
  meta?: readonly [React.ReactNode, React.ReactNode, React.ReactNode] | undefined
  sound?: boolean | undefined
}

const SaveAction = React.forwardRef<HTMLButtonElement, SaveActionProps>(function SaveAction({ status, onSave, shortcut = true, meta = ["Unsaved changes · or press ⌘S", "Writing changes", "All changes saved"], sound = true, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [won, setWon] = React.useState(0)
  const latest = React.useRef({ onSave, status })
  React.useEffect(() => {
    latest.current = { onSave, status }
  })
  React.useEffect(() => {
    if (!shortcut) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "s" || !(e.metaKey || e.ctrlKey)) return
      e.preventDefault()
      if (latest.current.status === "idle") latest.current.onSave()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shortcut])
  useStatusChange(status, (s) => {
    if (s === "saving") sfx.press()
    else if (s === "saved") {
      sfx.chime()
      setWon((n) => n + 1)
    }
  })
  const i = ["idle", "saving", "saved"].indexOf(status)
  return (
    <ActionPill
      ref={ref}
      data-slot="save-action"
      data-notchset=""
      aria-keyshortcuts={shortcut ? "Meta+S Control+S" : undefined}
      aria-busy={status === "saving" || undefined}
      onClick={() => status === "idle" && onSave()}
      index={i}
      labels={[
        <React.Fragment key="s">
          Save
          {shortcut && <kbd className="rounded-[5px] bg-[var(--muted)] px-1.5 font-mono text-[11px] font-medium text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">⌘S</kbd>}
        </React.Fragment>,
        "Saving…",
        "Saved",
      ]}
      meta={meta}
      metaIndex={i}
      icons={[<Glyph key="d" d={["M5 3h11l3 3v15H5z", "M8 3v5h7V3", "M8 14h8v7H8z"]} width={2.2} />, <Glyph key="c" d={CHECK} width={2.8} />]}
      icon={status === "saved" ? 1 : 0}
      discMotion={status === "saving" ? "pulse-fast" : status === "saved" && "bump"}
      disc={status === "saved" ? "var(--success,var(--foreground))" : "var(--foreground)"}
      tone={status === "saved" ? "color-mix(in oklab, var(--success,var(--foreground)) 75%, var(--foreground))" : "var(--foreground)"}
      outline={{ mode: status === "saving" ? "orbit" : status === "saved" ? "ring" : "none", color: status === "saved" ? "var(--success,var(--foreground))" : "color-mix(in oklab, var(--foreground) 40%, transparent)" }}
      halo={status === "saved" ? won : 0}
      {...props}
    />
  )
})

export { SaveAction, type SaveActionProps, type SaveStatus }
