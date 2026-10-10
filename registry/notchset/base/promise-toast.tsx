"use client"

/**
 * Promise Toast (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/promise-toast
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Promise toast: one toast follows a whole request. A spinner while it runs (the bar eases towards the
 * end), then a drawn check or a shaking ×, a title that rolls to the outcome, and an action that fits it
 * (View, or Retry). The bar then drains over the auto-dismiss time. Call promiseToast() anywhere; render
 * <PromiseToaster /> once.
 */

type Phase = "loading" | "success" | "error"

interface PromiseToastMessages {
  loading: React.ReactNode
  success: React.ReactNode
  error: React.ReactNode
  /** The second line for each phase. */
  description?: Partial<Record<Phase, React.ReactNode>> | undefined
  /** The action after success, e.g. { label: "View", onClick }. */
  action?: { label: React.ReactNode; onClick?: (() => void) | undefined } | undefined
  /** The retry label after an error (only when the work is a function). Default "Retry". */
  retryLabel?: React.ReactNode | undefined
}

type Work = Promise<unknown> | (() => Promise<unknown>)

interface ToastState {
  id: number
  phase: Phase
  leaving: boolean
  work: Work
  messages: PromiseToastMessages
}

const DISMISS = { success: 4200, error: 6000 } as const

let current: ToastState | null = null
let seq = 0
let leaveTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const set = (next: ToastState | null) => {
  current = next
  emit()
}

function leave(id: number) {
  if (current?.id !== id) return
  set({ ...current, leaving: true })
  leaveTimer = setTimeout(() => {
    if (current?.id === id) set(null)
  }, 320)
}

/** Shows one toast that follows `work` (a promise, or a function returning one so Retry can run it again). */
function promiseToast(work: Work, messages: PromiseToastMessages) {
  clearTimeout(leaveTimer)
  const id = ++seq
  set({ id, phase: "loading", leaving: false, work, messages })
  const run = typeof work === "function" ? work() : work
  run.then(
    () => settle(id, "success"),
    () => settle(id, "error")
  )
  return run
}

function settle(id: number, phase: "success" | "error") {
  if (current?.id !== id) return
  set({ ...current, phase })
  leaveTimer = setTimeout(() => leave(id), DISMISS[phase])
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

interface PromiseToasterProps extends React.ComponentPropsWithoutRef<"div"> {
  sound?: boolean | undefined
}

const PromiseToaster = React.forwardRef<HTMLDivElement, PromiseToasterProps>(function PromiseToaster({ sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const toast = React.useSyncExternalStore(
    subscribe,
    () => current,
    () => null
  )
  const heard = React.useRef<string>("")

  // Each new toast presses; each outcome chimes or buzzes once.
  React.useEffect(() => {
    if (!toast) return
    const key = `${toast.id}:${toast.phase}`
    if (heard.current === key) return
    heard.current = key
    if (toast.phase === "loading") sfx.press()
    else if (toast.phase === "success") sfx.chime()
    else sfx.buzz()
  }, [toast, sfx])

  const phase = toast?.phase ?? "loading"
  const m = toast?.messages
  const canRetry = toast ? typeof toast.work === "function" : false
  const visible = Boolean(toast && !toast.leaving)

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      data-slot="promise-toast"
      data-notchset=""
      data-state={toast ? phase : "idle"}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto w-[min(300px,calc(100%-32px))] overflow-hidden rounded-[min(var(--radius),16px)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[0_18px_40px_-16px_rgba(0,0,0,.25)] [transition:transform_.5s_var(--ns-ease-reshape),scale_.5s_var(--ns-ease-reshape),translate_.5s_var(--ns-ease-reshape),rotate_.5s_var(--ns-ease-reshape),opacity_.25s]",
        visible ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "translate-y-7 scale-95 opacity-0",
        className
      )}
      {...props}
    >
      {toast && m && (
        <>
          <div className="flex items-center gap-3 py-3 ps-3 pe-2.5">
            <span
              aria-hidden="true"
              className={cn(
                "relative grid size-[30px] shrink-0 place-items-center rounded-full [transition:background-color_.3s,color_.3s]",
                phase === "loading" && "bg-[color-mix(in_oklab,var(--info,var(--foreground))_14%,transparent)] text-[color-mix(in_oklab,var(--info,var(--foreground))_80%,var(--foreground))]",
                phase === "success" && "bg-[color-mix(in_oklab,var(--success,var(--foreground))_16%,transparent)] text-[color-mix(in_oklab,var(--success,var(--foreground))_80%,var(--foreground))]",
                phase === "error" && "bg-[color-mix(in_oklab,var(--destructive)_14%,transparent)] text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]"
              )}
            >
              {phase === "loading" && (
                <svg viewBox="0 0 24 24" className="size-4 animate-[ns-spin_.7s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" strokeDasharray="20 40" />
                </svg>
              )}
              {phase === "success" && (
                <span key={`ok-${toast.id}`} className="grid animate-[ns-chip_.45s_cubic-bezier(.2,1.7,.4,1)_both]">
                  <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
              {phase === "error" && (
                <span key={`err-${toast.id}`} className="grid animate-[ns-shake_.4s_both]">
                  <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </span>
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-px">
              <span className="block h-[18px] overflow-hidden text-[length:var(--ns-type-label)] font-semibold">
                <span className="flex flex-col [transition:transform_.5s_var(--ns-ease-reshape),scale_.5s_var(--ns-ease-reshape),translate_.5s_var(--ns-ease-reshape),rotate_.5s_var(--ns-ease-reshape)]" style={{ transform: `translateY(${phase === "error" ? -36 : phase === "success" ? -18 : 0}px)` }}>
                  {[m.loading, m.success, m.error].map((row, i) => (
                    <span key={i} aria-hidden={["loading", "success", "error"][i] !== phase || undefined} className="flex h-[18px] items-center truncate whitespace-nowrap">
                      {row}
                    </span>
                  ))}
                </span>
              </span>
              {m.description?.[phase] && (
                <span key={phase} className="animate-[ns-menu-fade_.3s_both] truncate text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
                  {m.description[phase]}
                </span>
              )}
            </span>
            {(phase === "success" ? m.action : phase === "error" ? canRetry : null) && (
              <button
                type="button"
                onClick={() => {
                  if (phase === "error") promiseToast(toast.work, m)
                  else {
                    sfx.pop()
                    m.action?.onClick?.()
                    leave(toast.id)
                  }
                }}
                className="inline-flex h-[30px] shrink-0 animate-[ns-menu-fade_.3s_.15s_both] cursor-pointer items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-2.5 text-[length:var(--ns-type-note)] font-medium whitespace-nowrap outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                {phase === "error" ? (m.retryLabel ?? "Retry") : m.action?.label}
              </button>
            )}
          </div>
          <span
            key={`${toast.id}-${phase}`}
            aria-hidden="true"
            className={cn(
              "block h-0.5",
              phase === "loading" && "animate-[ns-bar-load_1.7s_cubic-bezier(.3,.7,.3,1)_forwards] bg-[var(--info,var(--foreground))]",
              phase === "success" && "animate-[ns-bar-drain_4.2s_linear_forwards] bg-[var(--success,var(--foreground))]",
              phase === "error" && "animate-[ns-bar-drain_6s_linear_forwards] bg-[var(--destructive)]"
            )}
          />
        </>
      )}
    </div>
  )
})

export { PromiseToaster, promiseToast, type PromiseToasterProps, type PromiseToastMessages }
