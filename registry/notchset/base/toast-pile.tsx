"use client"

/**
 * Toast Pile (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/toast-pile
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Toast Pile: one toast at a time with a shrinking bar under it. When it times out it folds into the
 * pill beside it (slides 90px toward it at .45 scale and fades), and the pill bumps: up to three
 * overlapping initials and "N earlier". Hovering holds the timer. The pill opens an "Earlier" list of
 * what you missed, each with a time and a dismiss, plus Clear all.
 */

interface PileEvent {
  id: string | number
  initials: string
  name: string
  text: string
  color?: string | undefined
  /** e.g. "3m". */
  time?: string | undefined
}

interface ToastPileProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  /** The toast on screen, or null. */
  current: PileEvent | null
  /** Missed events, newest first. */
  earlier: readonly PileEvent[]
  /** The current toast timed out: move it into `earlier`. */
  onExpire: (event: PileEvent) => void
  onDismiss: (id: PileEvent["id"]) => void
  onClear: () => void
  duration?: number | undefined
  sound?: boolean | undefined
}

function Initials({ e, size = 28 }: { e: PileEvent; size?: number | undefined }) {
  const c = e.color ?? "var(--chart-1)"
  return (
    <span aria-hidden="true" className="grid shrink-0 place-items-center rounded-full text-[10.5px] font-bold" style={{ width: size, height: size, background: `color-mix(in oklab, ${c} 22%, var(--background))`, color: `color-mix(in oklab, ${c} 55%, var(--foreground))` }}>
      {e.initials}
    </span>
  )
}

const ToastPile = React.forwardRef<HTMLDivElement, ToastPileProps>(function ToastPile({ current, earlier, onExpire, onDismiss, onClear, duration = 3600, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [hover, setHover] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [folding, setFolding] = React.useState<PileEvent["id"] | null>(null)
  const [bumps, setBumps] = React.useState(0)
  const [count, setCount] = React.useState(earlier.length)
  if (count !== earlier.length) {
    setCount(earlier.length)
    if (earlier.length > count) setBumps((n) => n + 1)
  }
  const box = React.useRef<HTMLDivElement>(null)
  const cid = current?.id
  React.useEffect(() => {
    if (cid === undefined) return
    const k = String(cid).length % 5
    sfx.tone(780 + k * 90, 0.06, "triangle", 0.04)
    sfx.tone(1560 + k * 90, 0.08, "sine", 0.02, 0.05)
  }, [cid, sfx])
  React.useEffect(() => {
    if (folding === null || !current) return
    const t = window.setTimeout(() => {
      sfx.tone(620, 0.05, "triangle", 0.03, 0, 900)
      onExpire(current)
    }, 300)
    return () => window.clearTimeout(t)
  }, [folding, current, onExpire, sfx])
  React.useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    const down = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", key)
    document.addEventListener("pointerdown", down)
    return () => {
      document.removeEventListener("keydown", key)
      document.removeEventListener("pointerdown", down)
    }
  }, [open])

  const n = earlier.length
  const listOpen = open && n > 0
  const isFolding = current != null && folding === current.id

  return (
    <div ref={ref} data-slot="toast-pile" data-notchset="" className={cn("relative flex w-full max-w-[460px] flex-col items-center", className)} {...props}>
      <div ref={box} className="relative flex items-center justify-center gap-2">
        <div
          ref={(el) => {
            el?.toggleAttribute("inert", !listOpen)
          }}
          className="absolute inset-x-0 bottom-[58px] z-[4] mx-auto w-[340px] max-w-[calc(100vw-32px)] origin-bottom rounded-[18px] border border-[var(--border)] bg-[var(--background)] p-1.5 shadow-[0_20px_40px_-18px_rgba(0,0,0,.3)] [transition:opacity_.2s,scale_.4s_var(--ns-ease-reshape),translate_.4s_var(--ns-ease-reshape)]"
          style={{ opacity: listOpen ? 1 : 0, scale: listOpen ? "1" : ".97", translate: listOpen ? "0 0" : "0 8px" }}
        >
          <div className="flex items-center justify-between px-2 pt-1.5 pb-2">
            <span className="font-mono text-[10.5px] tracking-[.07em] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] uppercase">Earlier</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                sfx.drop()
                onClear()
              }}
              className="cursor-pointer rounded-[4px] px-1 py-0.5 text-[length:var(--ns-type-note)] font-medium text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] outline-none hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
            >
              Clear all
            </button>
          </div>
          <ul className="m-0 flex max-h-[176px] list-none flex-col overflow-y-auto p-0">
            {earlier.map((e, j) => (
              <li
                key={e.id}
                className={cn("grid grid-cols-[30px_minmax(0,1fr)_auto_26px] items-center gap-x-2.5 rounded-[12px] py-1.5 ps-2 pe-1 hover:bg-[var(--accent)]", listOpen && "animate-[ns-reveal_.4s_var(--ns-ease-settle)_both] motion-reduce:animate-none")}
                style={{ animationDelay: `${j * 45}ms` }}
              >
                <Initials e={e} size={30} />
                <span className="flex min-w-0 gap-1 text-[12.5px] whitespace-nowrap">
                  <span className="shrink-0 font-semibold">{e.name}</span>
                  <span className="min-w-0 truncate text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{e.text}</span>
                </span>
                <span className="font-mono text-[10.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{e.time}</span>
                <button
                  type="button"
                  aria-label={`Dismiss ${e.name}`}
                  onClick={() => {
                    sfx.drop()
                    if (n <= 1) setOpen(false)
                    onDismiss(e.id)
                  }}
                  className="grid size-[26px] cursor-pointer place-items-center rounded-full text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] outline-none hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          aria-expanded={listOpen}
          aria-label={`${n} earlier notifications`}
          tabIndex={n ? 0 : -1}
          onClick={() => {
            if (!n) return
            if (open) sfx.close()
            else sfx.open()
            setOpen(!open)
          }}
          className={cn(
            "flex h-[46px] cursor-pointer items-center gap-2 overflow-hidden rounded-full border bg-[var(--background)] text-[12.5px] font-semibold whitespace-nowrap shadow-[0_12px_28px_-16px_rgba(0,0,0,.35)] outline-none [transition:max-width_.45s_cubic-bezier(.2,1.2,.3,1),padding_.45s_cubic-bezier(.2,1.2,.3,1),opacity_.25s,border-color_var(--ns-time-color)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]",
            n ? "max-w-[220px] border-[var(--border)] ps-2 pe-3.5 opacity-100" : "max-w-0 border-transparent px-0 opacity-0"
          )}
        >
          <span key={bumps} className={cn("flex items-center gap-2", bumps > 0 && "animate-[ns-bump_.45s_cubic-bezier(.2,1.4,.3,1)] motion-reduce:animate-none")}>
            <span className="flex">
              {earlier.slice(0, 3).map((e, j) => (
                <span key={e.id} className={cn("rounded-full shadow-[0_0_0_2px_var(--background)]", j > 0 && "-ms-2.5")}>
                  <Initials e={e} />
                </span>
              ))}
            </span>
            <span className="flex items-center gap-[3px]">
              <NumberFlow value={n} />
              <span className="font-medium text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">earlier</span>
            </span>
          </span>
        </button>
        {current && (
          <div key={current.id} className="w-[280px] shrink-0 animate-[ns-toast-rise_.45s_cubic-bezier(.2,1.4,.3,1)_both] motion-reduce:animate-none">
            <div
              role="status"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              className="relative flex h-14 origin-left items-center gap-2.5 overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--background)] ps-2.5 pe-3.5 shadow-[0_18px_36px_-18px_rgba(0,0,0,.4)] [transition:transform_.32s_cubic-bezier(.5,0,.75,0),scale_.32s_cubic-bezier(.5,0,.75,0),translate_.32s_cubic-bezier(.5,0,.75,0),rotate_.32s_cubic-bezier(.5,0,.75,0),opacity_.32s] rtl:origin-right"
              style={{ transform: isFolding ? "translateX(-90px) scale(.45)" : "none", opacity: isFolding ? 0 : 1 }}
            >
              <Initials e={current} size={32} />
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="text-[length:var(--ns-type-label)] font-semibold whitespace-nowrap">{current.name}</span>
                <span className="truncate text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{current.text}</span>
              </span>
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--border)]">
                <span
                  onAnimationEnd={() => setFolding(current.id)}
                  className="absolute inset-0 origin-left animate-[ns-shrink-x_linear_both] rtl:origin-right"
                  style={{ background: current.color ?? "var(--chart-1)", animationDuration: `${duration}ms`, animationPlayState: hover || open ? "paused" : "running" }}
                />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export { ToastPile, type PileEvent, type ToastPileProps }
