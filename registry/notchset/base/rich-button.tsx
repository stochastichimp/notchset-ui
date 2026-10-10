"use client"

/**
 * Rich Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/rich-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, DrawCheck, RollingLabel, Spinner, spoken, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Rich Button: a full-width choice with an icon tile, a title over a description, a shortcut and an
 * arrow. On hover the tile tips and the arrow nudges; on press the tile fills with a spinner and the
 * description rolls to your progress line, then to the done line as a check replaces the arrow. Inside
 * a RichButtonGroup the other choices fade while one runs, and only one runs at a time.
 */

type RichState = "idle" | "busy" | "done"

const RichGroupContext = React.createContext<{ busy: string | null; setBusy: (id: string | null) => void } | null>(null)

/** Stacks rich buttons (gap 10, up to 340 wide) and fades the others while one runs. */
function RichButtonGroup({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [busy, setBusy] = React.useState<string | null>(null)
  const value = React.useMemo(() => ({ busy, setBusy }), [busy])
  return (
    <RichGroupContext.Provider value={value}>
      <div data-slot="rich-button-group" className={cn("flex w-full max-w-[340px] flex-col gap-2.5", className)} {...props} />
    </RichGroupContext.Provider>
  )
}

interface RichButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children" | "title"> {
  icon: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
  /** The description while it runs, e.g. "Cloning 128 files…". */
  progressLabel: React.ReactNode
  /** The description when it's done, e.g. "Imported · opening". */
  doneLabel: React.ReactNode
  /** The key hint, e.g. "⌘I". */
  shortcut?: string | undefined
  /** Runs the choice. Return a promise: the done line shows only when it resolves. */
  onSelect?: (() => unknown) | undefined
  onError?: ((error: unknown) => void) | undefined
  /** Called as the success state shows (after the work resolves and the minimum time), so anything that follows the button lands with it. */
  onSuccess?: (() => void) | undefined
  /** How long the done line shows before it resets (ms). Default 1800. */
  resetAfter?: number | undefined
  sound?: boolean | undefined
}

const RichButton = React.forwardRef<HTMLButtonElement, RichButtonProps>(function RichButton(
  { icon, title, description, progressLabel, doneLabel, shortcut, onSelect, onError, onSuccess, resetAfter = 1800, sound = true, disabled, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const group = React.useContext(RichGroupContext)
  const id = React.useId()
  const [state, setState] = React.useState<RichState>("idle")
  const [shakes, setShakes] = React.useState(0)
  const other = group?.busy != null && group.busy !== id

  const select = async () => {
    if (state !== "idle" || disabled || other) return
    sfx.press()
    setState("busy")
    group?.setBusy(id)
    try {
      await onSelect?.()
    } catch (error) {
      sfx.buzz()
      setShakes((n) => n + 1)
      setState("idle")
      group?.setBusy(null)
      onError?.(error)
      return
    }
    sfx.chime()
    onSuccess?.()
    setState("done")
    timeline.after(resetAfter, () => {
      setState("idle")
      group?.setBusy(null)
    })
  }

  const active = state !== "idle"
  return (
    <button
      ref={ref}
      type="button"
      data-slot="rich-button"
      data-notchset=""
      data-state={state}
      aria-busy={state === "busy" || undefined}
      aria-disabled={other || undefined}
      disabled={disabled}
      onClick={() => void select()}
      className={cn(
        "group/rich relative flex w-full cursor-pointer items-center gap-3.5 rounded-[min(var(--radius),18px)] border bg-[var(--background)] py-3 ps-3 pe-4 text-start text-[var(--foreground)] outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),border-color_var(--ns-time-color),opacity_var(--ns-time-state)] active:scale-[.98] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        active ? "border-[color-mix(in_oklab,var(--foreground)_30%,var(--border))]" : "border-[var(--border)] hover:border-[color-mix(in_oklab,var(--foreground)_30%,var(--border))]",
        other && "opacity-45",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-[min(var(--radius),12px)] [transition:transform_.45s_var(--ns-ease-rebound),scale_.45s_var(--ns-ease-rebound),translate_.45s_var(--ns-ease-rebound),rotate_.45s_var(--ns-ease-rebound),background-color_var(--ns-time-color),color_var(--ns-time-color)] [&_svg]:size-[18px]",
          active ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--muted)] text-[var(--foreground)] group-hover/rich:scale-[1.06] group-hover/rich:-rotate-8"
        )}
      >
        {state === "busy" ? <Spinner className="size-4" /> : icon}
      </span>
      <span key={shakes} className={cn("flex min-w-0 flex-1 flex-col gap-0.5", shakes > 0 && "animate-[ns-shake_.42s]")}>
        <span className="text-[length:var(--ns-type-copy)] leading-5 font-medium">{title}</span>
        <RollingLabel
          size="sm"
          align="start"
          index={state === "idle" ? 0 : state === "busy" ? 1 : 2}
          className="text-[length:var(--ns-type-label)]"
          rows={[
            <span key="d" className="truncate text-[var(--muted-foreground)]">
              {description}
            </span>,
            <span key="p" className="truncate font-mono text-[length:var(--ns-type-note)] text-[var(--muted-foreground)]">
              {progressLabel}
            </span>,
            <span key="f" className="truncate text-[var(--foreground)]">
              {doneLabel}
            </span>,
          ]}
        />
      </span>
      {shortcut && <span className="shrink-0 font-mono text-[11px] text-[var(--muted-foreground)]">{shortcut}</span>}
      <span aria-hidden="true" className="relative block size-4 shrink-0">
        <svg
          viewBox="0 0 24 24"
          className={cn("absolute inset-0 size-4 [transition:transform_.35s_cubic-bezier(.2,1.4,.4,1),scale_.35s_cubic-bezier(.2,1.4,.4,1),translate_.35s_cubic-bezier(.2,1.4,.4,1),rotate_.35s_cubic-bezier(.2,1.4,.4,1),opacity_.25s] rtl:-scale-x-100", active ? "opacity-0" : "opacity-100 group-hover/rich:translate-x-1 rtl:group-hover/rich:-translate-x-1")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
        <DrawCheck shown={state === "done"} className="absolute inset-0" />
      </span>
      <Announcer message={state === "busy" ? spoken(progressLabel, "Working") : state === "done" ? spoken(doneLabel, "Done") : ""} />
    </button>
  )
})

export { RichButton, RichButtonGroup, type RichButtonProps }
