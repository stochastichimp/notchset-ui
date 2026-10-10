"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useIsomorphicLayoutEffect } from "@/lib/notchset/shared"

/*
 * The shape every Buttons II action shares: a 44px pill with an icon disc, a rolling label and an outline
 * that doubles as the progress indicator (progress, march, orbit or a closing ring). The pill's width
 * follows the active label, the disc changes colour with the state, and success can add a halo and a
 * burst of eight dots. A meta line under the pill explains the state. The actions are thin wrappers.
 */

type OutlineMode = "none" | "progress" | "march" | "orbit" | "ring"

interface ActionPillProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  /** One row per state; `index` picks the visible one. */
  labels: readonly React.ReactNode[]
  index: number
  /** Extra width for inline extras (a mono amount), px. */
  extra?: number | undefined
  /** One meta row per state (or fewer); rolls with `metaIndex`. */
  meta?: readonly React.ReactNode[] | undefined
  metaIndex?: number | undefined
  /** The disc's icons; `icon` picks the visible one. */
  icons: readonly React.ReactNode[]
  icon: number
  /** How a hidden icon sits (default: shrunk to .4). */
  iconOut?: readonly (string | undefined)[] | undefined
  /** Motion for the visible icon: fall (downloading), twinkle, shake, spin, bell (ringing) or turn (135°). */
  iconMotion?: "fall" | "twinkle" | "shake" | "spin" | "bell" | "turn" | false | undefined
  disc: string
  discInk?: string | undefined
  discScale?: number | undefined
  /** Motion for the disc: a pulse (fast .8s, 1s, slow 1.2s) or one bump. */
  discMotion?: "pulse-fast" | "pulse" | "pulse-slow" | "bump" | false | undefined
  /** The label's colour. */
  tone?: string | undefined
  outline?: { mode: OutlineMode; color?: string | undefined; progress?: number | undefined; instant?: boolean | undefined } | undefined
  fill?: { width: number; color: string; instant?: boolean | undefined } | undefined
  /** Bump to play the halo once (or set `haloLoop` to repeat), in `haloColor`. */
  halo?: number | undefined
  haloColor?: string | undefined
  haloLoop?: string | undefined
  /** Bump to play the burst. */
  burst?: number | undefined
  /** Bump to shake. */
  shake?: number | undefined
}

const BURST = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--success,var(--chart-3))", "var(--chart-1)", "var(--chart-2)"]

const ActionPill = React.forwardRef<HTMLButtonElement, ActionPillProps>(function ActionPill(
  { labels, index, extra = 0, meta, metaIndex = 0, icons, icon, iconOut, iconMotion, disc, discInk = "var(--background)", discScale = 1, discMotion, tone = "var(--foreground)", outline = { mode: "none" }, fill, halo = 0, haloColor = "var(--success,var(--foreground))", haloLoop, burst = 0, shake = 0, className, style, ...props },
  ref
) {
  const rows = React.useRef<(HTMLSpanElement | null)[]>([])
  const [widths, setWidths] = React.useState<number[]>([])
  const key = labels.length
  useIsomorphicLayoutEffect(() => {
    const measure = () => setWidths(rows.current.map((el) => (el ? Math.ceil(el.scrollWidth) : 0)))
    measure()
    const ro = new ResizeObserver(measure)
    rows.current.forEach((el) => el?.firstElementChild && ro.observe(el.firstElementChild))
    return () => ro.disconnect()
  }, [key])
  // 6 + 32 disc + 10 gap + 16 end padding, plus the 1px border on each side.
  const width = widths[index] ? 66 + widths[index]! + extra : undefined

  const mode = outline.mode
  const dash = mode === "march" ? ".22 .78" : mode === "orbit" ? ".12 .88" : "1"
  const offset = mode === "progress" ? 1 - Math.max(0, Math.min(100, outline.progress ?? 0)) / 100 : mode === "none" ? 1 : 0

  return (
    <span className="inline-flex flex-col items-center gap-2.5">
    <button
      ref={ref}
      type="button"
      className={cn(
        "group/pill relative h-11 shrink-0 cursor-pointer touch-none rounded-full border border-[var(--border)] bg-[var(--background)] p-0 shadow-[0_8px_20px_-16px_rgba(0,0,0,.4)] outline-none select-none [transition:width_.55s_cubic-bezier(.2,1.2,.3,1),color_.4s,scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] active:scale-[var(--ns-press-depth)] motion-reduce:[transition:color_.4s]",
        shake > 0 && (shake % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]"),
        className
      )}
      style={{ width, color: tone, ...style }}
      {...props}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        {fill && (
          <span className="absolute inset-y-0 start-0" style={{ width: `${fill.width}%`, background: fill.color, transition: fill.instant ? "none" : "width .4s var(--ns-ease-settle), background-color .5s" }} />
        )}
      </span>
      <svg aria-hidden="true" className="pointer-events-none absolute -inset-px size-[calc(100%+2px)] overflow-visible">
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="22"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          className={cn("motion-reduce:transition-none!", (mode === "march" || mode === "orbit") && "motion-safe:animate-[ns-march-path_1.1s_linear_infinite]")}
          style={{
            stroke: mode === "none" ? "transparent" : (outline.color ?? "var(--foreground)"),
            strokeDasharray: dash,
            strokeDashoffset: offset,
            transition: outline.instant ? "stroke .4s" : mode === "ring" ? "stroke-dashoffset .7s cubic-bezier(.6,0,.2,1), stroke .4s" : "stroke-dashoffset .15s linear, stroke .4s",
          }}
        />
      </svg>
      <span className="relative flex h-full items-center gap-2.5 ps-1.5 pe-4">
        <span aria-hidden="true" className="pointer-events-none absolute start-1.5 top-1/2 -mt-4 size-8">
          {halo > 0 && <span key={`h${halo}`} className="absolute inset-0 rounded-full border-2 opacity-0 motion-reduce:hidden" style={{ borderColor: haloColor, animation: haloLoop ?? "ns-ring .8s cubic-bezier(.2,.8,.2,1) 1" }} />}
          {burst > 0 &&
            BURST.map((c, i) => (
              <span key={`${burst}-${i}`} className="absolute start-[13.5px] top-[13.5px] size-[5px] rounded-full opacity-0 motion-reduce:hidden" style={{ background: c, "--a": `${i * 45}deg`, animation: "ns-burst .7s cubic-bezier(.2,.8,.2,1) 1 both" } as React.CSSProperties} />
            ))}
        </span>
        <span aria-hidden="true" className={cn("relative size-8 shrink-0 overflow-hidden rounded-full [transition:background-color_.4s,scale_.4s_var(--ns-ease-rebound)]", discMotion === "pulse-fast" && "animate-[ns-pulse_.8s_ease-in-out_infinite] motion-reduce:animate-none", discMotion === "pulse" && "animate-[ns-pulse_1s_ease-in-out_infinite] motion-reduce:animate-none", discMotion === "pulse-slow" && "animate-[ns-pulse_1.2s_ease-in-out_infinite] motion-reduce:animate-none", discMotion === "bump" && "animate-[ns-bump_.5s]")} style={{ background: disc, color: discInk, scale: String(discScale) }}>
          {icons.map((ic, i) => (
            <span
              key={i}
              className="absolute inset-0 grid place-items-center [transition:opacity_.25s,transform_.5s_var(--ns-ease-pop),scale_.5s_var(--ns-ease-pop),translate_.5s_var(--ns-ease-pop),rotate_.5s_var(--ns-ease-pop)] [&_svg]:size-[15px]"
              style={{ opacity: i === icon ? 1 : 0, transform: i === icon ? "none" : (iconOut?.[i] ?? "scale(.4)") }}
            >
              <span
                className={cn(
                  "block [transition:rotate_.5s_var(--ns-ease-pop)]",
                  i === icon && iconMotion === "fall" && "animate-[ns-fall_1s_ease-in-out_infinite] motion-reduce:animate-none",
                  i === icon && iconMotion === "twinkle" && "animate-[ns-twinkle_1.2s_ease-in-out_infinite] motion-reduce:animate-none",
                  i === icon && iconMotion === "shake" && "animate-[ns-shake_.25s_linear_infinite] motion-reduce:animate-none",
                  i === icon && iconMotion === "spin" && "animate-[ns-spin_.8s_linear_infinite] motion-reduce:animate-none",
                  i === icon && iconMotion === "bell" && "animate-[ns-bell_.6s_ease-in-out_infinite] motion-reduce:animate-none",
                  i === icon && iconMotion === "turn" && "rotate-[135deg]"
                )}
              >
                {ic}
              </span>
            </span>
          ))}
        </span>
        <span aria-live="polite" className="block h-[22px] overflow-hidden text-[length:var(--ns-type-copy)] font-semibold tracking-[var(--ns-tracking-control)]">
          <span className="flex flex-col [transition:translate_.5s_var(--ns-ease-reshape)] motion-reduce:transition-none" style={{ translate: `0 ${-index * 22}px` }}>
            {labels.map((l, i) => (
              <span
                key={i}
                ref={(el) => {
                  rows.current[i] = el
                }}
                aria-hidden={i === index ? undefined : true}
                className="flex h-[22px] shrink-0 items-center gap-1.5 leading-[22px] whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-1.5">{l}</span>
              </span>
            ))}
          </span>
        </span>
      </span>
    </button>
      {meta && (
        <span aria-live="polite" className="block h-[18px] overflow-hidden text-center font-mono text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
          <span className="flex flex-col [transition:translate_.5s_var(--ns-ease-reshape)] motion-reduce:transition-none" style={{ translate: `0 ${-metaIndex * 18}px` }}>
            {meta.map((m, i) => (
              <span key={i} aria-hidden={i === metaIndex ? undefined : true} className="flex h-[18px] shrink-0 items-center justify-center gap-1.5 leading-[18px] whitespace-nowrap">
                {m}
              </span>
            ))}
          </span>
        </span>
      )}
    </span>
  )
})

/** A 24-unit stroke icon for the disc. */
function Glyph({ d, width = 2.4 }: { d: readonly string[]; width?: number | undefined }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      {d.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  )
}

const CHECK = ["M5 12.5 10 17.5 19 7"]

/** Calls `on(next, previous)` when the status changes (for each action's sounds). */
function useStatusChange<T>(status: T, on: (next: T, previous: T) => void) {
  const last = React.useRef(status)
  const latest = React.useRef(on)
  React.useEffect(() => {
    latest.current = on
  })
  React.useEffect(() => {
    if (last.current === status) return
    const was = last.current
    last.current = status
    latest.current(status, was)
  }, [status])
}

export { ActionPill, CHECK, Glyph, useStatusChange, type ActionPillProps, type OutlineMode }
