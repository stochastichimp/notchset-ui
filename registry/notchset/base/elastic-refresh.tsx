"use client"

/**
 * Elastic Refresh (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/elastic-refresh
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { prefersCalm } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Elastic Refresh: a feed you pull to refresh and swipe to clear. Pulling meets rising resistance; a pill
 * stretches with an arrow that flips once you pass 64px, and releasing there turns it into a spinner
 * while the list holds open. Swipe a row sideways (past 90px) to mark it done: it slides out, its row
 * folds away, and a toast offers Undo for 3.2s. Each row also has a check button for mouse and keyboard.
 */

interface FeedItem {
  id: string
  who: string
  action: string
  object: string
  meta: string
  avatar?: string | undefined
  /** Instead of an avatar. */
  icon?: React.ReactNode | undefined
  /** The icon tile's colour. */
  tone?: string | undefined
}

interface ElasticRefreshProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  title: React.ReactNode
  /** The sync line: "Synced 3 min ago"; it rolls when it changes. */
  status: string
  items: readonly FeedItem[]
  refreshing: boolean
  onRefresh: () => void
  /** A row marked done; remove it from `items`. */
  onDone: (item: FeedItem) => void
  /** Undo: put the item back at `index`. */
  onUndo?: ((item: FeedItem, index: number) => void) | undefined
  sound?: boolean | undefined
}

const THRESHOLD = 64
const SWIPE = 90

const ElasticRefresh = React.forwardRef<HTMLDivElement, ElasticRefreshProps>(function ElasticRefresh(
  { title, status, items, refreshing, onRefresh, onDone, onUndo, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [pull, setPull] = React.useState(0)
  const [pulling, setPulling] = React.useState(false)
  const [swipe, setSwipe] = React.useState<{ id: string; dx: number; drag: boolean } | null>(null)
  const [gone, setGone] = React.useState<string[]>([])
  const [undo, setUndo] = React.useState<{ item: FeedItem; index: number } | null>(null)
  const [seen] = React.useState(() => new Set(items.map((x) => x.id)))
  const [restored, setRestored] = React.useState<string | null>(null)
  const [roll, setRoll] = React.useState({ from: status, to: status, n: 0 })
  if (status !== roll.to) setRoll({ from: roll.to, to: status, n: roll.n + 1 })
  const gesture = React.useRef<{ x: number; y: number; row: string | null; axis: "x" | "y" | null; past: boolean; arm: boolean } | null>(null)
  const rowDown = React.useRef<string | null>(null)
  const timers = React.useRef<number[]>([])
  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const wasRefreshing = React.useRef(refreshing)
  React.useEffect(() => {
    if (wasRefreshing.current && !refreshing) sfx.chime()
    wasRefreshing.current = refreshing
  }, [refreshing, sfx])

  const done = (item: FeedItem, sign: 1 | -1) => {
    const index = items.findIndex((x) => x.id === item.id)
    if (index < 0) return
    setSwipe({ id: item.id, dx: sign * 380, drag: false })
    sfx.markDone()
    later(() => setGone((g) => [...g, item.id]), 200)
    later(() => {
      setGone((g) => g.filter((x) => x !== item.id))
      setSwipe(null)
      onDone(item)
      setUndo({ item, index })
    }, 620)
  }
  React.useEffect(() => {
    if (!undo) return
    const t = window.setTimeout(() => setUndo(null), 3200)
    return () => window.clearTimeout(t)
  }, [undo])

  const p = pull
  const past = p >= THRESHOLD
  const hot = past || refreshing

  return (
    <div ref={ref} data-slot="elastic-refresh" data-notchset="" className={cn("relative flex h-[460px] w-full max-w-[340px] flex-col overflow-hidden rounded-[var(--ns-corner-box,min(26px,calc(var(--radius,999px)*2.6)))] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]", className)} {...props}>
      <div className="relative z-[2] flex h-[66px] shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] ps-[18px] pe-3.5">
        <span className="flex flex-col gap-px">
          <span className="text-[16px] font-semibold tracking-[-0.02em]">{title}</span>
          <span aria-live="polite" className={cn("block h-[17px] overflow-hidden text-[length:var(--ns-type-note)]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>
            <span key={roll.n} className={cn("flex flex-col", roll.n > 0 && "animate-[ns-roll-up_.5s_var(--ns-ease-reshape)_both] motion-reduce:animate-none")}>
              {roll.n > 0 && (
                <span aria-hidden="true" className="h-[17px] leading-[17px] whitespace-nowrap">
                  {roll.from}
                </span>
              )}
              <span className="h-[17px] leading-[17px] whitespace-nowrap">{roll.to}</span>
            </span>
          </span>
        </span>
        <button
          type="button"
          aria-label="Refresh"
          aria-busy={refreshing || undefined}
          onClick={() => {
            if (refreshing) return
            sfx.pop()
            onRefresh()
          }}
          className={cn("grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--border)] outline-none [transition:background-color_.2s,color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-90", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-[15px]", refreshing && "animate-[ns-spin_.8s_linear_infinite] motion-reduce:animate-none")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>
      <div
        onPointerDown={(event) => {
          if (refreshing || event.button !== 0) return
          gesture.current = { x: event.clientX, y: event.clientY, row: rowDown.current, axis: null, past: false, arm: false }
          rowDown.current = null
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          const g = gesture.current
          if (!g) return
          const dx = event.clientX - g.x
          const dy = event.clientY - g.y
          if (!g.axis) {
            if (Math.hypot(dx, dy) < 6) return
            g.axis = Math.abs(dx) > Math.abs(dy) && g.row ? "x" : "y"
            if (g.axis === "y") setPulling(true)
          }
          if (g.axis === "x") {
            const arm = Math.abs(dx) > SWIPE
            if (arm !== g.arm) {
              g.arm = arm
              sfx.tone(arm ? 1100 : 800, 0.025, "triangle", 0.03)
            }
            setSwipe({ id: g.row!, dx, drag: true })
            return
          }
          if (prefersCalm(event.currentTarget)) return
          const raw = Math.max(0, dy)
          const next = 120 * (1 - Math.exp(-raw / 160))
          const now = next >= THRESHOLD
          if (now !== g.past) {
            g.past = now
            sfx.threshold(now)
          }
          setPull(next)
        }}
        onPointerUp={() => {
          const g = gesture.current
          gesture.current = null
          if (!g) return
          if (g.axis === "x") {
            const item = items.find((x) => x.id === g.row)
            if (g.arm && item && swipe) done(item, swipe.dx > 0 ? 1 : -1)
            else setSwipe(null)
            return
          }
          setPulling(false)
          if (g.axis === "y" && pull >= THRESHOLD) {
            sfx.pop()
            onRefresh()
          }
          setPull(0)
        }}
        onPointerCancel={() => {
          gesture.current = null
          setPulling(false)
          setPull(0)
          setSwipe(null)
        }}
        className="relative flex-1 cursor-grab touch-none overflow-hidden select-none"
      >
        <div
          aria-hidden="true"
          className="motion-reduce:transition-none! absolute start-1/2 top-3 grid place-items-center overflow-hidden rounded-[15px] ltr:-translate-x-1/2 rtl:translate-x-1/2"
          style={{
            width: refreshing ? 30 : 26 - Math.min(p * 0.05, 5),
            height: refreshing ? 30 : Math.max(6, 6 + p * 0.3),
            opacity: refreshing || p > 3 ? 1 : 0,
            background: hot ? "var(--foreground)" : "var(--muted)",
            color: hot ? "var(--background)" : "var(--muted-foreground)",
            transition: pulling ? "opacity .2s, background-color .2s, color .2s" : "width .45s var(--ns-ease-pop), height .45s var(--ns-ease-pop), opacity .3s, background-color .2s, color .2s",
          }}
        >
          <svg viewBox="0 0 24 24" className={cn("absolute start-1/2 bottom-[7px] -ms-[7px] size-3.5 [transition:rotate_.35s_var(--ns-ease-pop),opacity_.2s]", past && "rotate-180")} style={{ opacity: !refreshing && p > 22 ? 1 : 0 }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
          <span className="absolute inset-[7px] animate-[ns-spin_.7s_linear_infinite] rounded-full border-2 border-current border-e-transparent [transition:opacity_.2s]" style={{ opacity: refreshing ? 1 : 0 }} />
        </div>
        <ul
          aria-label={typeof title === "string" ? title : "Feed"}
          className="relative m-0 list-none bg-[var(--background)] p-0"
          style={{ transform: `translateY(${(refreshing ? 54 : p).toFixed(1)}px)`, transition: pulling ? "none" : "transform .55s var(--ns-ease-reshape)" }}
        >
          {items.map((x) => {
            const sw = swipe?.id === x.id ? swipe : null
            const dx = sw ? sw.dx : 0
            const arm = Math.abs(dx) > SWIPE
            const fresh = !seen.has(x.id) || restored === x.id
            return (
              <li
                key={x.id}
                onPointerDown={() => {
                  rowDown.current = x.id
                }}
                className={cn("grid [transition:grid-template-rows_.4s_var(--ns-ease-settle)]", gone.includes(x.id) ? "grid-rows-[0fr]" : "grid-rows-[1fr]", fresh && "animate-[ns-bubble_.5s_var(--ns-ease-reshape)_both] motion-reduce:animate-none")}
              >
                <div className="relative min-h-0 overflow-hidden border-b border-[var(--border)]">
                  <div
                    aria-hidden="true"
                    className={cn("absolute inset-0 flex items-center gap-1.5 px-[22px] text-[length:var(--ns-type-label)] font-medium [transition:background-color_.2s,color_.2s]", dx > 0 ? "justify-start" : "justify-end")}
                    style={{
                      opacity: dx !== 0 ? 1 : 0,
                      background: arm ? "var(--success,var(--foreground))" : "color-mix(in oklab, var(--success, var(--foreground)) 22%, var(--background))",
                      color: arm ? "var(--success-foreground,var(--background))" : "color-mix(in oklab, var(--success, var(--foreground)) 75%, var(--foreground))",
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Done
                  </div>
                  <div className="group/row relative flex gap-3 bg-[var(--background)] py-3 ps-[18px] pe-2.5" style={{ transform: `translateX(${dx}px)`, transition: sw?.drag ? "transform .05s linear" : "transform .45s cubic-bezier(.2,1.2,.3,1)" }}>
                    {x.avatar ? (
                      <span aria-hidden="true" className="size-8 shrink-0 rounded-full bg-[var(--muted)] bg-cover bg-center shadow-[0_0_0_1px_var(--border)]" style={{ backgroundImage: `url(${x.avatar})` }} />
                    ) : (
                      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full [&_svg]:size-[15px]" style={{ background: `color-mix(in oklab, ${x.tone ?? "var(--chart-1)"} 16%, transparent)`, color: x.tone ?? "var(--chart-1)" }}>
                        {x.icon}
                      </span>
                    )}
                    <span className="flex min-w-0 flex-col gap-[3px] text-[length:var(--ns-type-label)] leading-[1.4]">
                      <span className="text-pretty">
                        <span className="font-medium">{x.who}</span> <span className={"text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"}>{x.action}</span> <span className="font-medium">{x.object}</span>
                      </span>
                      <span className={cn("font-mono text-[11px]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{x.meta}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Mark done: ${x.who} ${x.action} ${x.object}`}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => done(x, -1)}
                      className={cn("ms-auto grid size-[30px] shrink-0 cursor-pointer place-items-center self-center rounded-full border border-[var(--border)] bg-[var(--background)] outline-none [transition:background-color_.2s,color_.2s,border-color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:border-transparent hover:bg-[var(--success,var(--foreground))] hover:text-[var(--success-foreground,var(--background))] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-90", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      <div
        role="status"
        className={cn("absolute inset-x-0 bottom-3.5 z-[3] mx-auto flex h-[38px] w-fit items-center gap-2.5 rounded-[var(--radius)] bg-[var(--foreground)] ps-3.5 pe-[5px] text-[length:var(--ns-type-label)] whitespace-nowrap text-[var(--background)] [transition:translate_.45s_cubic-bezier(.2,1.4,.3,1),opacity_.25s]", undo ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[70px] opacity-0")}
      >
        {undo && (
          <>
            <span className="text-[var(--success,var(--background))]">✓</span>
            Marked done
            {onUndo && (
              <button
                type="button"
                onClick={() => {
                  sfx.pop()
                  setRestored(undo.item.id)
                  onUndo(undo.item, undo.index)
                  setUndo(null)
                }}
                className="h-7 cursor-pointer rounded-[var(--radius)] bg-[color-mix(in_oklab,var(--background)_18%,transparent)] px-[11px] text-[length:var(--ns-type-note)] font-medium text-[var(--background)] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
              >
                Undo
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
})

export { ElasticRefresh, type ElasticRefreshProps, type FeedItem }
