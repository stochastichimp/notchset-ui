"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * The shared parts: the rolling label every state change goes through, the check that draws
 * itself, the spinner and the live dot, and a timeline that schedules a component's steps and clears
 * them when it unmounts. Every class string is a plain literal (the shadcn CLI only rewrites those for
 * apps with tailwind.prefix). Keyframes (ns-*) live in the foundation CSS.
 *
 * Easing vocabulary (the design's names): press var(--ns-ease-press) for scale on press; roll
 * var(--ns-ease-reshape) for label rolls, menus and width morphs; pop var(--ns-ease-pop) for
 * icon swaps and checks landing; draw cubic-bezier(.6,0,.2,1) for strokes and sweeps; exit
 * cubic-bezier(.6,0,.9,.5) for things leaving.
 */

/** Runs on the client before paint, and as an effect on the server (React 18 warns about layout effects there). */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

/** Points one ref (callback or object) at `node`. */
function assignRef<T>(ref: React.Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node)
  else if (ref) (ref as React.MutableRefObject<T | null>).current = node
}

/** Sets every ref passed (callback or object), so a component can keep its own ref and forward the caller's. */
function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  const latest = React.useRef(refs)
  useIsomorphicLayoutEffect(() => {
    latest.current = refs
  })
  return React.useCallback((node: T | null) => {
    for (const ref of latest.current) assignRef(ref, node)
  }, [])
}

/** Schedules a component's steps; every pending step is cleared on clear() and on unmount. */
function useTimeline() {
  const timers = React.useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  React.useEffect(() => {
    const set = timers.current
    return () => {
      for (const t of set) clearTimeout(t)
      set.clear()
    }
  }, [])
  return React.useMemo(
    () => ({
      after(ms: number, fn: () => void) {
        const t = setTimeout(() => {
          timers.current.delete(t)
          fn()
        }, ms)
        timers.current.add(t)
        return t
      },
      clear() {
        for (const t of timers.current) clearTimeout(t)
        timers.current.clear()
      },
    }),
    []
  )
}

/** Resolves after `ms` (a minimum time a state shows, so a fast promise still reads). */
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * A fixed-height window over a stack of rows; row `index` shows, the others roll past (.5s roll). Only
 * the showing row is in the accessibility tree, so the button's name is always the current label.
 */
function RollingLabel({ rows, index, size = "default", align = "center", fit = false, rowHeight, className }: { rows: readonly React.ReactNode[]; index: number; size?: "default" | "sm" | undefined; align?: "center" | "start" | undefined; /** Rows as wide as their own text (inside a window sized to the active row). */ fit?: boolean | undefined; /** A row height in px, for titles (overrides size). */ rowHeight?: number | undefined; className?: string | undefined }) {
  const height = rowHeight ?? (size === "sm" ? 18 : 20)
  return (
    <span data-slot="rolling-label" className={cn("relative block overflow-hidden", !rowHeight && (size === "sm" ? "h-[18px]" : "h-5"), className)} style={rowHeight ? { height: rowHeight } : undefined}>
      <span
        className={cn("flex flex-col transition-transform duration-500 ease-[var(--ns-ease-reshape)] motion-reduce:transition-none", fit && (align === "center" ? "items-center" : "items-start"))}
        style={{ transform: `translateY(${-index * height}px)` }}
      >
        {rows.map((row, i) => (
          <span
            key={i}
            aria-hidden={i === index ? undefined : true}
            className={cn("flex shrink-0 items-center gap-2 whitespace-nowrap", !rowHeight && (size === "sm" ? "h-[18px]" : "h-5"), align === "center" ? "justify-center" : "justify-start", fit && "w-max")}
            style={rowHeight ? { height: rowHeight, lineHeight: `${rowHeight}px` } : undefined}
          >
            {row}
          </span>
        ))}
      </span>
    </span>
  )
}

/** The check that draws itself in (.45s draw after .15s) when `shown`. */
function DrawCheck({ shown, className }: { shown: boolean; className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-4 shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M20 6 9 17l-5-5"
        className="[stroke-dasharray:24] transition-[stroke-dashoffset] delay-150 duration-[450ms] ease-[cubic-bezier(.6,0,.2,1)] motion-reduce:transition-none"
        style={{ strokeDashoffset: shown ? 0 : 24 }}
      />
    </svg>
  )
}

/** The 14px spinner: an arc turning every .7s. */
function Spinner({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-3.5 shrink-0 animate-[ns-spin_.7s_linear_infinite]", className)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" className="[stroke-dasharray:20_40]" />
    </svg>
  )
}

/** A 7px dot with a ring that keeps blooming out of it (live). */
function LiveDot({ className }: { className?: string | undefined }) {
  return (
    <span aria-hidden="true" className={cn("relative inline-flex size-[7px] shrink-0", className)}>
      <span className="absolute inset-0 animate-[ns-live_1.2s_ease-out_infinite] rounded-full bg-current" />
      <span className="relative size-full rounded-full bg-current" />
    </span>
  )
}

/**
 * Where overlays (menus, tooltips) portal to. Unset, they portal to document.body, where your
 * :root theme applies. Set it when the theme lives on an element instead of :root:
 *   <PortalContext.Provider value={element}>…</PortalContext.Provider>
 */
const PortalContext = React.createContext<HTMLElement | null>(null)

/** The container for an overlay's Portal: the provided element, else undefined (document.body). */
function usePortal() {
  return React.useContext(PortalContext) ?? undefined
}

/**
 * Writes text to the clipboard and resolves true only when it landed (falls back to a hidden textarea
 * where the async API is missing or blocked). Show "Copied" only on true.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Blocked (permissions, an insecure origin): try the fallback below.
  }
  try {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.opacity = "0"
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand("copy")
    area.remove()
    return copied
  } catch {
    return false
  }
}

/**
 * A callback ref that sets the inert attribute (React 18 has no inert prop): hidden panes and folded
 * sections stay out of the tab order and the accessibility tree.
 */
function inertRef(on: boolean) {
  return (node: HTMLElement | null) => {
    node?.toggleAttribute("inert", on)
  }
}

/** True while an IME is composing: key handlers that commit text ignore those keys. */
function composing(event: React.KeyboardEvent) {
  return event.nativeEvent.isComposing || event.keyCode === 229
}

/** True when focus is in a text field (single-key shortcuts stay out of the way). */
function typingInField() {
  const el = document.activeElement as HTMLElement | null
  return Boolean(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable))
}

/** A label's text for the live region: the label itself when it is text, else `fallback`. */
function spoken(label: React.ReactNode, fallback: string) {
  return typeof label === "string" || typeof label === "number" ? String(label) : fallback
}

/** A polite live region that says `message` whenever it changes (label rolls, outcomes). */
function Announcer({ message }: { message: string }) {
  return (
    <span aria-live="polite" className="sr-only">
      {message}
    </span>
  )
}

const REDUCED = "(prefers-reduced-motion: reduce)"

/**
 * Whether motion should be calm right now: the OS asks for reduced motion, or `el` sits under
 * data-motion="off". For event handlers and effects (it reads the DOM).
 */
function prefersCalm(el?: Element | null) {
  if (typeof window === "undefined") return false
  return Boolean(window.matchMedia?.(REDUCED).matches || el?.closest('[data-motion="off"]'))
}

/**
 * Whether `el` sits in an RTL scope: the nearest `dir`, as Tailwind's `rtl:` styles read it, so a
 * dir="rtl" panel inside an LTR page (or the reverse) maps pointer and arrow keys the way it's drawn.
 */
function isRtl(el?: Element | null) {
  if (typeof window === "undefined") return false
  if (!el) return document.dir === "rtl"
  try {
    return el.matches(":dir(rtl)")
  } catch {
    return el.closest("[dir]")?.getAttribute("dir") === "rtl"
  }
}

/**
 * The one failure contract every action callback follows: it failed if it threw (handled by the caller),
 * or resolved `false`, a failed Response (`!res.ok`) or an object with an `error` (any value).
 */
function isFailedResult(result: unknown): boolean {
  if (result === false) return true
  if (typeof Response !== "undefined" && result instanceof Response) return !result.ok
  return typeof result === "object" && result !== null && "error" in result && (result as { error: unknown }).error != null
}

/** The message a failure carries, if it has one: a thrown Error's, or `{ error: "text" }`'s / `{ error: { message } }`'s. */
function failureMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message
  if (typeof reason === "object" && reason !== null && "error" in reason) {
    const e = (reason as { error: unknown }).error
    if (typeof e === "string") return e
    if (typeof e === "object" && e !== null && typeof (e as { message?: unknown }).message === "string") return (e as { message: string }).message
  }
  return ""
}

const noSubscribe = () => () => {}
/**
 * Now, on the client only: null on the server and during hydration (so both render the same in every
 * time zone), then the visitor's clock. For anything that shows "today" without a `today` prop.
 */
function useClientNow(): Date | null {
  const mounted = React.useSyncExternalStore(noSubscribe, () => true, () => false)
  const [now] = React.useState(() => (typeof window === "undefined" ? null : new Date()))
  return mounted ? (now ?? new Date()) : null
}

const subscribeReduced = (onChange: () => void) => {
  const mq = window.matchMedia?.(REDUCED)
  mq?.addEventListener("change", onChange)
  return () => mq?.removeEventListener("change", onChange)
}

/**
 * The OS reduced-motion preference for render, following changes. False on the server and during
 * hydration (so both render the same), then the real value.
 */
function useCalm() {
  return React.useSyncExternalStore(subscribeReduced, () => Boolean(window.matchMedia?.(REDUCED).matches), () => false)
}

export {
  failureMessage,
  isFailedResult,
  isRtl,
  useClientNow,
  Announcer,
  composing,
  copyText,
  DrawCheck,
  inertRef,
  PortalContext,
  prefersCalm,
  LiveDot,
  RollingLabel,
  spoken,
  Spinner,
  typingInField,
  useCalm,
  useComposedRefs,
  useIsomorphicLayoutEffect,
  usePortal,
  useTimeline,
  wait,
}
