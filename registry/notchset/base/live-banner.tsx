"use client"

/**
 * Live Banner (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/live-banner
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, inertRef, useTimeline } from "@/lib/notchset/shared"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Live banner: a full-width strip for an upcoming event, with a pinging live dot, a countdown whose
 * digits roll, and a reminder toggle that confirms in place. Closing folds it up so the page beneath
 * moves into its space.
 */

interface LiveBannerProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  /** When the event starts. */
  startsAt: Date | number
  /** The event's name. */
  title: React.ReactNode
  /** Before the countdown. Default "starts in". */
  lead?: React.ReactNode | undefined
  /** Shown once the countdown reaches zero. Default "is live". */
  liveLabel?: React.ReactNode | undefined
  reminded?: boolean | undefined
  defaultReminded?: boolean | undefined
  onRemindedChange?: ((reminded: boolean) => void) | undefined
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  remindLabel?: React.ReactNode | undefined
  remindedLabel?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const two = (n: number) => String(n).padStart(2, "0")
const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`
}

const LiveBanner = React.forwardRef<HTMLDivElement, LiveBannerProps>(function LiveBanner(
  {
    startsAt,
    title,
    lead = "starts in",
    liveLabel = "is live",
    reminded,
    defaultReminded = false,
    onRemindedChange,
    open,
    defaultOpen = true,
    onOpenChange,
    remindLabel = "Remind me",
    remindedLabel = "Reminding",
    sound = true,
    className,
    ...props
  },
  ref
) {
  const { sfx } = useSound(sound)
  const [innerRemind, setInnerRemind] = React.useState(defaultReminded)
  const on = reminded ?? innerRemind
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen)
  const shown = open ?? innerOpen
  const [now, setNow] = React.useState<number | null>(null)
  const start = typeof startsAt === "number" ? startsAt : startsAt.getTime()
  const left = now == null ? null : start - now
  const live = left != null && left <= 0
  const timeline = useTimeline()

  React.useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])

  const remind = () => {
    const next = !on
    if (next) {
      sfx.pop()
      timeline.after(90, () => sfx.ding(3))
    } else sfx.drop()
    if (reminded === undefined) setInnerRemind(next)
    onRemindedChange?.(next)
  }
  const close = () => {
    sfx.dismiss()
    if (open === undefined) setInnerOpen(false)
    onOpenChange?.(false)
  }

  return (
    <div ref={ref} data-slot="live-banner" data-notchset="" data-state={shown ? "open" : "closed"} className={cn("grid [transition:grid-template-rows_.45s_var(--ns-ease-settle)]", shown ? "grid-rows-[1fr]" : "grid-rows-[0fr]", className)} {...props}>
      <div ref={inertRef(!shown)} className="min-h-0 overflow-hidden">
        <div role="region" aria-label="Announcement" className="flex h-[42px] items-center gap-2.5 bg-[var(--foreground)] ps-3.5 pe-1.5 text-[12.5px] whitespace-nowrap text-[var(--background)]">
          <span aria-hidden="true" className="relative size-2 shrink-0">
            <span className="absolute inset-0 rounded-full bg-[var(--chart-5,var(--destructive))]" />
            <span className="absolute inset-0 animate-[ns-live_1.4s_ease-out_infinite] rounded-full bg-[var(--chart-5,var(--destructive))] motion-reduce:animate-none" />
          </span>
          <span className="min-w-0 truncate">
            <span className="font-semibold">{title}</span> <span className="text-[color-mix(in_oklab,var(--background)_70%,var(--foreground))]">{live ? liveLabel : lead}</span>
          </span>
          {!live && (
            <span className="shrink-0 font-mono tracking-[.02em]">
              {left == null ? <span className="opacity-0">00:00:00</span> : <NumberFlow value={clock(left)} />}
            </span>
          )}
          <button
            type="button"
            aria-pressed={on}
            onClick={remind}
            className={cn(
              "ms-auto inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius)] px-2.5 text-[11.5px] font-medium outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s,color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.95]",
              on ? "bg-[var(--success,var(--primary))] text-[var(--success-foreground,var(--primary-foreground))]" : "bg-[var(--background)] text-[var(--foreground)]"
            )}
          >
            <span className="block h-4 overflow-hidden">
              <span className="flex flex-col [transition:transform_.5s_var(--ns-ease-reshape),scale_.5s_var(--ns-ease-reshape),translate_.5s_var(--ns-ease-reshape),rotate_.5s_var(--ns-ease-reshape)]" style={{ transform: `translateY(${on ? -16 : 0}px)` }}>
                <span aria-hidden={on || undefined} className="flex h-4 items-center justify-center gap-1.5 whitespace-nowrap">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                  </svg>
                  {remindLabel}
                </span>
                <span aria-hidden={!on || undefined} className="flex h-4 items-center justify-center gap-1.5 whitespace-nowrap">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {remindedLabel}
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={close}
            className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-[8px] text-inherit opacity-70 outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>
      <Announcer message={on ? "Reminder set" : ""} />
    </div>
  )
})

export { LiveBanner, type LiveBannerProps }
