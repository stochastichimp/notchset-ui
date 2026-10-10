"use client"

/**
 * Sync Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/sync-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { Announcer, DrawCheck, RollingLabel, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Sync: the arrows spin while the count climbs (each item ticks a little higher), then it settles on a
 * check and Up to date. Your onSync reports each finished item with `progress(done, total)`.
 */

type SyncState = "idle" | "syncing" | "done"

interface SyncButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  /** Runs the sync; call `progress(done, total)` as items finish. Resolve when it's complete. */
  onSync: (progress: (done: number, total: number) => void) => Promise<unknown>
  onError?: ((error: unknown) => void) | undefined
  /** Called as the success state shows (after the work resolves and the minimum time), so anything that follows the button lands with it. */
  onSuccess?: (() => void) | undefined
  label?: React.ReactNode | undefined
  /** The busy row: receives the count. Default "Syncing 3/12". */
  syncingLabel?: ((done: number, total: number) => React.ReactNode) | undefined
  doneLabel?: React.ReactNode | undefined
  /** How long Up to date shows (ms). Default 2350. */
  resetAfter?: number | undefined
  sound?: boolean | undefined
}

const ROW = { idle: 0, syncing: 1, done: 2 } as const

function RefreshIcon({ spinning }: { spinning?: boolean | undefined }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-4", spinning && "animate-[ns-spin_.8s_linear_infinite]")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

const SyncButton = React.forwardRef<HTMLButtonElement, SyncButtonProps>(function SyncButton(
  { onSync, onError, onSuccess, label = "Sync now", syncingLabel = (done, total) => `Syncing ${done}/${total}`, doneLabel = "Up to date", resetAfter = 2350, sound = true, disabled, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [state, setState] = React.useState<SyncState>("idle")
  const [count, setCount] = React.useState({ done: 0, total: 0 })
  const [shakes, setShakes] = React.useState(0)
  const run = React.useRef(0)
  const highest = React.useRef(0)

  const sync = async () => {
    if (state !== "idle" || disabled) return
    const id = ++run.current
    sfx.press()
    highest.current = 0
    setCount({ done: 0, total: 0 })
    setState("syncing")
    const progress = (done: number, total: number) => {
      if (id !== run.current || !Number.isFinite(done) || !Number.isFinite(total)) return
      if (done > highest.current) {
        highest.current = done
        sfx.tone(900 + done * 35, 0.02, "triangle", 0.02)
      }
      setCount({ done: highest.current, total })
    }
    try {
      await onSync(progress)
      if (id !== run.current) return
      timeline.after(250, () => {
        onSuccess?.()
        setState("done")
        sfx.chime()
      })
      timeline.after(250 + resetAfter, () => setState("idle"))
    } catch (error) {
      if (id !== run.current) return
      sfx.buzz()
      setShakes((n) => n + 1)
      setState("idle")
      onError?.(error)
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      data-slot="sync-button"
      data-notchset=""
      data-state={state}
      aria-busy={state === "syncing" || undefined}
      disabled={disabled}
      onClick={() => void sync()}
      className={cn(
        "relative inline-flex h-[var(--ns-control-field)] w-[188px] max-w-full shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className
      )}
      {...props}
    >
      <span key={shakes} className={cn("block w-full", shakes > 0 && "animate-[ns-shake_.42s]")}>
        <RollingLabel
          index={ROW[state]}
          rows={[
            <span key="idle" className="flex items-center gap-2">
              <RefreshIcon />
              {label}
            </span>,
            <span key="syncing" className="flex items-center gap-2">
              <RefreshIcon spinning={state === "syncing"} />
              {(() => {
                const text = syncingLabel(count.done, count.total)
                return typeof text === "string" || typeof text === "number" ? <NumberFlow value={text} /> : text
              })()}
            </span>,
            <span key="done" className="flex items-center gap-2">
              <DrawCheck shown={state === "done"} />
              {doneLabel}
            </span>,
          ]}
        />
      </span>
      <Announcer message={state === "syncing" ? "Syncing" : state === "done" ? "Up to date" : ""} />
    </button>
  )
})

export { SyncButton, type SyncButtonProps }
