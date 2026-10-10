"use client"

/**
 * Toast Stack (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/toast-stack
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { inertRef } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Toast stack: new toasts push older ones back into a deck (each one 9px higher and 5% smaller, only the
 * front one readable). Hovering or focusing the deck fans it out and pauses every timer. Each toast has
 * its own two-note motif and a life bar in its tone. Call stackToast() anywhere; render <ToastStack /> once.
 */

type StackTone = "success" | "info" | "warning" | "error"

interface StackToast {
  id: number
  tone: StackTone
  title: React.ReactNode
  description?: React.ReactNode | undefined
  /** Time left, in ms. */
  life: number
}

const LIFE = 5000
const KEEP = 5
const TONE_VAR: Record<StackTone, string> = { success: "var(--success,var(--foreground))", info: "var(--info,var(--foreground))", warning: "var(--warning,var(--foreground))", error: "var(--destructive)" }
const TONE_INDEX: Record<StackTone, 0 | 1 | 2 | 3> = { success: 0, info: 1, warning: 2, error: 3 }

let toasts: StackToast[] = []
let seq = 0
const listeners = new Set<() => void>()
const set = (next: StackToast[]) => {
  toasts = next
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

// One clock for every deck on the page: life runs down every 100ms unless any deck is open.
let open = 0
let clock: ReturnType<typeof setInterval> | undefined
function run() {
  if (clock) return
  clock = setInterval(() => {
    if (open > 0) return
    set(toasts.map((t) => ({ ...t, life: t.life - 100 })).filter((t) => t.life > 0))
    if (!toasts.length) {
      clearInterval(clock)
      clock = undefined
    }
  }, 100)
}

/** Adds a toast to the front of the deck. */
function stackToast(toast: { tone?: StackTone | undefined; title: React.ReactNode; description?: React.ReactNode | undefined }) {
  const id = ++seq
  set([{ id, tone: toast.tone ?? "info", title: toast.title, description: toast.description, life: LIFE }, ...toasts].slice(0, KEEP))
  run()
  return id
}

function ToneIcon({ tone }: { tone: StackTone }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {tone === "success" && <path d="M20 6 9 17l-5-5" />}
      {tone === "info" && (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </>
      )}
      {tone === "warning" && (
        <>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </>
      )}
      {tone === "error" && (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      )}
    </svg>
  )
}

interface ToastStackProps extends React.ComponentPropsWithoutRef<"div"> {
  sound?: boolean | undefined
}

const ToastStack = React.forwardRef<HTMLDivElement, ToastStackProps>(function ToastStack({ sound = true, className, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) {
  const { sfx } = useSound(sound)
  const list = React.useSyncExternalStore(
    subscribe,
    () => toasts,
    () => toasts
  )
  const [hover, setHover] = React.useState(false)
  const [focus, setFocus] = React.useState(false)
  const expanded = hover || focus
  const heard = React.useRef(0)
  const visible = list.slice(0, 4)

  // Each new toast plays its tone's motif once.
  React.useEffect(() => {
    const front = list[0]
    if (!front || front.id <= heard.current) return
    heard.current = front.id
    sfx.toastSig(TONE_INDEX[front.tone])
  }, [list, sfx])

  // An open deck pauses the shared clock.
  React.useEffect(() => {
    if (!expanded) return
    open += 1
    return () => {
      open -= 1
    }
  }, [expanded])

  const close = (id: number) => {
    sfx.drop()
    set(toasts.filter((t) => t.id !== id))
  }

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Toast notifications"
      data-slot="toast-stack"
      data-notchset=""
      data-state={expanded ? "open" : "stacked"}
      onMouseEnter={(event) => {
        setHover(true)
        onMouseEnter?.(event)
      }}
      onMouseLeave={(event) => {
        setHover(false)
        onMouseLeave?.(event)
      }}
      onFocus={(event) => {
        setFocus(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocus(false)
        onBlur?.(event)
      }}
      className={cn("fixed end-3.5 bottom-3.5 z-50 w-[min(290px,calc(100%-28px))] [transition:height_.4s_cubic-bezier(.2,1.1,.3,1)]", className)}
      style={{ height: expanded && visible.length ? visible.length * 72 : 64 }}
      {...props}
    >
      <ol aria-live="polite" className="m-0 list-none p-0">
        {visible.map((t, i) => {
          const readable = i === 0 || expanded
          return (
            <li
              key={t.id}
              aria-hidden={!readable || undefined}
              className="absolute inset-x-0 bottom-0 h-16 origin-bottom animate-[ns-toast_.45s_var(--ns-ease-reshape)_both] overflow-hidden rounded-[min(var(--radius),16px)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[0_14px_30px_-14px_rgba(0,0,0,.28)] [transition:transform_.5s_cubic-bezier(.2,1.2,.3,1),scale_.5s_cubic-bezier(.2,1.2,.3,1),translate_.5s_cubic-bezier(.2,1.2,.3,1),rotate_.5s_cubic-bezier(.2,1.2,.3,1),opacity_var(--ns-time-state)]"
              style={{
                zIndex: 10 - i,
                transform: `translateY(${expanded ? -i * 72 : -i * 9}px) scale(${expanded ? 1 : 1 - i * 0.05})`,
                opacity: i > 2 && !expanded ? 0 : 1,
                ["--tone" as string]: TONE_VAR[t.tone],
              }}
            >
              <div className={cn("flex h-full items-center gap-2.5 ps-3 pe-2 [transition:opacity_.25s]", readable ? "opacity-100" : "opacity-0")} ref={inertRef(!readable)}>
                <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-[color-mix(in_oklab,var(--tone)_15%,transparent)] text-[color-mix(in_oklab,var(--tone)_80%,var(--foreground))]">
                  <ToneIcon tone={t.tone} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="truncate text-[length:var(--ns-type-label)] font-semibold">{t.title}</span>
                  {t.description && <span className="truncate font-mono text-[11.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{t.description}</span>}
                </span>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => close(t.id)}
                  className="grid size-[26px] shrink-0 cursor-pointer place-items-center rounded-[7px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] outline-none hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <span aria-hidden="true" className="absolute start-0 bottom-0 h-0.5 bg-[var(--tone)] opacity-70 [transition:width_.1s_linear]" style={{ width: `${(t.life / LIFE) * 100}%` }} />
            </li>
          )
        })}
      </ol>
    </div>
  )
})

export { stackToast, ToastStack, type StackTone, type ToastStackProps }
