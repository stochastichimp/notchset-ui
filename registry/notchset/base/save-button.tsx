"use client"

/**
 * Save Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/save-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, DrawCheck, RollingLabel, spoken, Spinner, useTimeline, wait } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Save: the label rolls to Saving while your onSave promise runs (shown for at least minDuration so a fast
 * save still reads), then a check draws itself and it says Saved. A rejection shakes the button and buzzes,
 * then it is ready again. ⌘S / Ctrl+S presses it when `hotkey` is on.
 */

type SaveState = "idle" | "saving" | "saved"

interface SaveButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  /** The save. Return a promise: Saved shows only when it resolves. */
  onSave?: (() => unknown) | undefined
  /** Receives the rejection (the button shakes and resets). */
  onError?: ((error: unknown) => void) | undefined
  /** Called as the success state shows (after the work resolves and the minimum time), so anything that follows the button lands with it. */
  onSuccess?: (() => void) | undefined
  label?: React.ReactNode | undefined
  savingLabel?: React.ReactNode | undefined
  savedLabel?: React.ReactNode | undefined
  /** The shortcut shown beside the label; null hides it. Default "⌘S". */
  shortcut?: React.ReactNode | undefined
  /** Press it with ⌘S / Ctrl+S anywhere on the page. Default false. */
  hotkey?: boolean | undefined
  /** The least time Saving shows (ms). Default 1400. */
  minDuration?: number | undefined
  /** How long Saved shows before the button resets (ms). Default 1900. */
  resetAfter?: number | undefined
  sound?: boolean | undefined
}

const ROW = { idle: 0, saving: 1, saved: 2 } as const

const SaveButton = React.forwardRef<HTMLButtonElement, SaveButtonProps>(function SaveButton(
  {
    onSave,
    onError,
    onSuccess,
    label = "Save changes",
    savingLabel = "Saving",
    savedLabel = "Saved",
    shortcut = "⌘S",
    hotkey = false,
    minDuration = 1400,
    resetAfter = 1900,
    sound = true,
    disabled,
    className,
    ...props
  },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [state, setState] = React.useState<SaveState>("idle")
  const [shakes, setShakes] = React.useState(0)
  const run = React.useRef(0)

  const save = React.useCallback(async () => {
    if (state !== "idle" || disabled) return
    const id = ++run.current
    sfx.press()
    setState("saving")
    try {
      await Promise.all([onSave?.(), wait(minDuration)])
    } catch (error) {
      if (id !== run.current) return
      sfx.buzz()
      setShakes((n) => n + 1)
      setState("idle")
      onError?.(error)
      return
    }
    if (id !== run.current) return
    sfx.chime()
    onSuccess?.()
    setState("saved")
    timeline.after(resetAfter, () => setState("idle"))
  }, [state, disabled, sfx, onSave, minDuration, onError, onSuccess, timeline, resetAfter])

  const saveRef = React.useRef(save)
  React.useEffect(() => {
    saveRef.current = save
  })
  React.useEffect(() => {
    if (!hotkey) return
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault()
        void saveRef.current()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [hotkey])

  return (
    <button
      ref={ref}
      type="button"
      data-slot="save-button"
      data-notchset=""
      data-state={state}
      aria-busy={state === "saving" || undefined}
      aria-keyshortcuts={hotkey ? "Meta+S Control+S" : undefined}
      disabled={disabled}
      onClick={() => void save()}
      className={cn(
        "relative inline-flex h-11 w-[178px] max-w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius)] border border-transparent bg-[var(--primary)] px-4 text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--primary-foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] hover:bg-[color-mix(in_oklab,var(--primary)_86%,var(--background))] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className
      )}
      {...props}
    >
      <span key={shakes} className={cn("block w-full", shakes > 0 && "animate-[ns-shake_.42s]")}>
        <RollingLabel
          index={ROW[state]}
          rows={[
            <span key="idle" className="flex items-center gap-2.5">
              {label}
              {shortcut != null && <span className="font-mono text-[11px] opacity-70">{shortcut}</span>}
            </span>,
            <span key="saving" className="flex items-center gap-2">
              <Spinner />
              {savingLabel}
            </span>,
            <span key="saved" className="flex items-center gap-2">
              <DrawCheck shown={state === "saved"} className="size-[15px]" />
              {savedLabel}
            </span>,
          ]}
        />
      </span>
      <Announcer message={state === "saving" ? spoken(savingLabel, "Saving") : state === "saved" ? spoken(savedLabel, "Saved") : ""} />
    </button>
  )
})

export { SaveButton, type SaveButtonProps }
