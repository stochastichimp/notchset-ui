"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, DrawCheck, RollingLabel, spoken, useTimeline, wait } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * The Split Button's shared parts (both builds use them; only the menu primitive differs): the actions,
 * the flow each one runs, the main button with its paper plane, and a menu row.
 */

interface SplitAction {
  id: string
  /** The menu row's text. */
  label: React.ReactNode
  /** The label while it runs, e.g. "Publishing". */
  busy: React.ReactNode
  /** The label when it's done, e.g. "Published". */
  done: React.ReactNode
  icon?: React.ReactNode | undefined
  /** The key hint at the end of the row, e.g. "S". */
  shortcut?: string | undefined
  /** Red row, a thud instead of a chime, and a separator above it. */
  destructive?: boolean | undefined
}

type SplitState = "idle" | "busy" | "done"


const SPLIT_ACTIONS: SplitAction[] = [
  {
    id: "publish",
    label: "Publish and notify",
    busy: "Publishing",
    done: "Published",
    shortcut: "⏎",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
        <path d="m21.854 2.147-10.94 10.939" />
      </svg>
    ),
  },
  {
    id: "schedule",
    label: "Schedule for 9:00",
    busy: "Scheduling",
    done: "Scheduled",
    shortcut: "S",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    id: "draft",
    label: "Save as draft",
    busy: "Saving",
    done: "Draft saved",
    shortcut: "D",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      </svg>
    ),
  },
  {
    id: "discard",
    label: "Discard draft",
    busy: "Discarding",
    done: "Discarded",
    shortcut: "⌫",
    destructive: true,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
]

interface SplitFlowOptions {
  actions: readonly SplitAction[]
  onAction?: ((id: string) => unknown) | undefined
  onError?: ((error: unknown, id: string) => void) | undefined
  /** Called as the done state shows, with the action's id. */
  onSuccess?: ((id: string) => void) | undefined
  minDuration: number
  resetAfter: number
  sound: boolean
}

/** Runs one action: its sound, the busy row for at least minDuration, then done (or a shake on failure). */
function useSplitFlow({ actions, onAction, onError, onSuccess, minDuration, resetAfter, sound }: SplitFlowOptions) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [state, setState] = React.useState<SplitState>("idle")
  const [active, setActive] = React.useState(actions[0])
  const [shakes, setShakes] = React.useState(0)
  const run = React.useRef(0)

  const start = async (action: SplitAction | undefined) => {
    if (!action || state !== "idle") return
    const id = ++run.current
    setActive(action)
    setState("busy")
    if (action.destructive) sfx.thud()
    else if (action.id === actions[0]?.id) sfx.whoosh()
    else sfx.press()
    try {
      await Promise.all([onAction?.(action.id), wait(minDuration)])
    } catch (error) {
      if (id !== run.current) return
      sfx.buzz()
      setShakes((n) => n + 1)
      setState("idle")
      onError?.(error, action.id)
      return
    }
    if (id !== run.current) return
    onSuccess?.(action.id)
    setState("done")
    if (!action.destructive) sfx.chime()
    timeline.after(resetAfter, () => setState("idle"))
  }
  return { state, active, shakes, start, sfx }
}

interface SplitMainProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  state: SplitState
  active: SplitAction | undefined
  shakes: number
  label: React.ReactNode
  planeIcon?: React.ReactNode | undefined
}

/** The main half: the plane leaves up and to the end edge, a check lands in its place, the label rolls. */
const SplitMain = React.forwardRef<HTMLButtonElement, SplitMainProps>(function SplitMain({ state, active, shakes, label, planeIcon, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      data-slot="split-button-main"
      data-state={state}
      aria-busy={state === "busy" || undefined}
      className={cn(
        "relative inline-flex h-11 w-[168px] shrink-0 cursor-pointer items-center justify-start gap-2 rounded-s-[var(--radius)] rounded-e-none border border-transparent bg-[var(--primary)] ps-[18px] pe-3 text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--primary-foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] origin-right not-disabled:active:scale-[var(--ns-press-depth)] hover:bg-[color-mix(in_oklab,var(--primary)_86%,var(--background))] focus-visible:z-10 focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 rtl:origin-left focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className="relative block size-4 shrink-0">
        <span
          className={cn(
            "absolute inset-0 rtl:-scale-x-100",
            state === "idle" && "translate-0 scale-100 opacity-100 [transition:transform_.6s_var(--ns-ease-pop),scale_.6s_var(--ns-ease-pop),translate_.6s_var(--ns-ease-pop),rotate_.6s_var(--ns-ease-pop),opacity_.25s]",
            state === "busy" && "translate-x-[18px] -translate-y-[18px] scale-60 opacity-0 [transition:transform_.42s_cubic-bezier(.6,0,.9,.5),scale_.42s_cubic-bezier(.6,0,.9,.5),translate_.42s_cubic-bezier(.6,0,.9,.5),rotate_.42s_cubic-bezier(.6,0,.9,.5),opacity_.4s_ease-in] rtl:-translate-x-[18px]",
            state === "done" && "-translate-x-4 translate-y-4 scale-60 opacity-0 transition-none rtl:translate-x-4"
          )}
        >
          {planeIcon ?? (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
              <path d="m21.854 2.147-10.94 10.939" />
            </svg>
          )}
        </span>
        <DrawCheck shown={state === "done"} className="absolute inset-0" />
      </span>
      <span key={shakes} className={cn("block min-w-0 flex-1", shakes > 0 && "animate-[ns-shake_.42s]")}>
        <RollingLabel align="start" index={state === "idle" ? 0 : state === "busy" ? 1 : 2} rows={[label, active?.busy, active?.done]} />
      </span>
      <Announcer message={state === "busy" ? spoken(active?.busy, "Working") : state === "done" ? spoken(active?.done, "Done") : ""} />
    </button>
  )
})

/** One menu row's content: icon, label and key hint, staggering in after the menu opens. */
function SplitItemContent({ action, index }: { action: SplitAction; index: number }) {
  return (
    <span className="flex w-full animate-[ns-menu-item_.35s_var(--ns-ease-reshape)_both] items-center gap-2.5" style={{ animationDelay: `${40 + index * 35}ms` }}>
      {action.icon}
      <span className="min-w-0 flex-1 truncate text-start">{action.label}</span>
      {action.shortcut && <span className="font-mono text-[11px] opacity-50">{action.shortcut}</span>}
    </span>
  )
}

export { SPLIT_ACTIONS, SplitItemContent, SplitMain, useSplitFlow, type SplitAction, type SplitState }
