"use client"

/**
 * Announcement Bar (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/announcement-bar
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Announcement Bar: an inverse 44px bar that rolls through its messages. Each has a 16×3 progress
 * segment that fills over `interval`; when it ends the next message rolls up. Hovering or focusing the
 * bar pauses it, a segment jumps straight to its message, and × folds the bar away (grid rows). Bring
 * it back by setting `open` again (a header bell, say).
 */

interface Announcement {
  id: string
  text: React.ReactNode
  tone?: "info" | "warning" | "success" | "neutral" | undefined
  action?: { label: string; onClick: () => void } | undefined
}

interface AnnouncementBarProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  messages: readonly Announcement[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Milliseconds per message. */
  interval?: number | undefined
  sound?: boolean | undefined
}

const AnnouncementBar = React.forwardRef<HTMLDivElement, AnnouncementBarProps>(function AnnouncementBar({ messages, open, onOpenChange, interval = 4500, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [i, setI] = React.useState(0)
  const [run, setRun] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setI(0)
      setRun((n) => n + 1)
    }
  }
  const at = Math.min(i, Math.max(0, messages.length - 1))
  const go = (k: number) => {
    setI(k)
    setRun((n) => n + 1)
    sfx.tone(1100 + k * 120, 0.03, "triangle", 0.03)
  }

  return (
    <div
      ref={ref}
      data-slot="announcement-bar"
      data-notchset=""
      className={cn("grid [transition:grid-template-rows_.45s_var(--ns-ease-settle)] motion-reduce:transition-none", className)}
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      {...props}
    >
      <div
        className="min-h-0 overflow-hidden"
        ref={(el) => {
          el?.toggleAttribute("inert", !open)
        }}
      >
        <div
          role="region"
          aria-label="Announcements"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="flex h-11 items-center gap-2.5 bg-[var(--foreground)] ps-3.5 pe-1.5 text-[var(--background)]"
        >
          <span aria-live="polite" className="block h-11 min-w-0 flex-1 overflow-hidden">
            <span className="flex flex-col [transition:translate_.55s_cubic-bezier(.2,1.2,.3,1)] motion-reduce:transition-none" style={{ translate: `0 ${-at * 44}px` }}>
              {messages.map((m, k) => (
                <span
                  key={m.id}
                  aria-hidden={k === at ? undefined : true}
                  ref={(el) => {
                    el?.toggleAttribute("inert", k !== at)
                  }}
                  className="flex h-11 min-w-0 items-center gap-[9px]"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-[7px] shrink-0 rounded-full",
                      m.tone === "warning" && "bg-[var(--warning,var(--chart-4))]",
                      m.tone === "success" && "bg-[var(--success,var(--chart-3))]",
                      m.tone === "neutral" && "bg-[color-mix(in_oklab,var(--background)_60%,transparent)]",
                      (m.tone ?? "info") === "info" && "bg-[var(--info,var(--chart-1))]"
                    )}
                  />
                  <span className="min-w-0 truncate text-[length:var(--ns-type-label)] font-medium">{m.text}</span>
                  {m.action && (
                    <button
                      type="button"
                      onClick={() => {
                        sfx.tick()
                        m.action!.onClick()
                      }}
                      className="shrink-0 cursor-pointer rounded-[4px] px-0.5 py-1 text-[length:var(--ns-type-label)] font-semibold whitespace-nowrap underline decoration-[color-mix(in_oklab,var(--background)_35%,transparent)] underline-offset-[3px] outline-none hover:decoration-[var(--background)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[var(--background)]"
                    >
                      {m.action.label}
                    </button>
                  )}
                </span>
              ))}
            </span>
          </span>
          {messages.length > 1 && (
            <span className="flex shrink-0 gap-0.5">
              {messages.map((m, k) => (
                <button key={m.id} type="button" aria-label={`Announcement ${k + 1}`} aria-current={k === at || undefined} onClick={() => go(k)} className="grid h-6 w-5 cursor-pointer place-items-center rounded-[4px] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[var(--background)]">
                  <span className="relative h-[3px] w-4 overflow-hidden rounded-[2px] bg-[color-mix(in_oklab,var(--background)_28%,transparent)]">
                    <span
                      key={k === at ? run : -1}
                      onAnimationEnd={() => {
                        if (k === at) go((at + 1) % messages.length)
                      }}
                      className={cn("absolute inset-0 origin-left bg-[var(--background)] rtl:origin-right", k === at && "animate-[ns-fill-x_linear_both]")}
                      style={{ scale: k < at ? "1 1" : k === at ? undefined : "0 1", animationDuration: `${interval}ms`, animationPlayState: paused || !open ? "paused" : "running" }}
                    />
                  </span>
                </button>
              ))}
            </span>
          )}
          <button
            type="button"
            aria-label="Dismiss announcements"
            onClick={() => {
              sfx.noise(0.3, 0.035, 2400, 600)
              onOpenChange(false)
            }}
            className="grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-full opacity-70 outline-none [transition:opacity_.15s,background-color_.15s] hover:bg-[color-mix(in_oklab,var(--background)_14%,transparent)] hover:opacity-100 focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[var(--background)]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
})

export { AnnouncementBar, type Announcement, type AnnouncementBarProps }
