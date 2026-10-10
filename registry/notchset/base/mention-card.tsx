"use client"

/**
 * Mention Card (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/mention-card
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Mention Card: an inline mention chip that, after resting on it for 300ms (focus opens it at once),
 * unfolds into a profile card from its own rect: the clip-path grows from the chip's pill to the card.
 * Inside: photo with presence, name and role, a bio, and a day strip with working hours as a green band
 * on a 24-hour track and a "now" marker from the person's time zone. It stays open while you're on it,
 * with a 200ms grace when you leave.
 */

interface MentionPerson {
  name: string
  src?: string | undefined
  role?: string | undefined
  bio?: React.ReactNode | undefined
  /** IANA zone, e.g. "Europe/Stockholm". */
  timeZone?: string | undefined
  /** Working hours, 24h. */
  hours?: [number, number] | undefined
  /** The city shown by the clock. */
  place?: string | undefined
}

interface MentionCardProps extends Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  person: MentionPerson
  /** Buttons at the bottom of the card. */
  actions?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const CARD_W = 290
const CARD_H = 222

function useZoneTime(timeZone?: string) {
  const [t, setT] = React.useState<string | null>(null)
  React.useEffect(() => {
    const read = () => {
      try {
        setT(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone }))
      } catch {
        setT(null)
      }
    }
    const first = window.setTimeout(read, 0)
    const every = window.setInterval(read, 30000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(every)
    }
  }, [timeZone])
  return t
}

const MentionCard = React.forwardRef<HTMLSpanElement, MentionCardProps>(function MentionCard({ person, actions, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const chip = React.useRef<HTMLButtonElement>(null)
  const timer = React.useRef(0)
  const [open, setOpen] = React.useState(false)
  const [box, setBox] = React.useState({ dx: 0, cw: 80, ch: 26 })
  const now = useZoneTime(person.timeZone)
  const [h0, h1] = person.hours ?? [8, 18]
  const isOpen = React.useRef(false)
  React.useEffect(() => {
    isOpen.current = open
  })
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = () => {
    const c = chip.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const room = window.innerWidth - 16 - (r.left - 3 + CARD_W)
    setBox({ dx: Math.min(0, room), cw: r.width, ch: r.height })
    if (!isOpen.current) sfx.open()
    isOpen.current = true
    setOpen(true)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      if (!isOpen.current) return
      isOpen.current = false
      setOpen(false)
      sfx.close()
    }, 200)
  }
  const mins = now ? Number(now.slice(0, 2)) * 60 + Number(now.slice(3, 5)) : null
  const working = mins !== null && mins >= h0 * 60 && mins < h1 * 60
  const ox = -box.dx + 3
  const clip = open ? "inset(0 0 0 0 round 18px)" : `inset(10px ${Math.max(0, CARD_W - ox - box.cw)}px ${Math.max(0, CARD_H - 10 - box.ch)}px ${ox}px round 999px)`

  return (
    <span ref={ref} data-slot="mention-card" data-notchset="" className={cn("relative inline-block align-[-6px]", className)} {...props}>
      <button
        ref={chip}
        type="button"
        aria-expanded={open}
        onMouseEnter={() => {
          window.clearTimeout(timer.current)
          if (!open) timer.current = window.setTimeout(show, 300)
        }}
        onMouseLeave={hide}
        onFocus={() => {
          window.clearTimeout(timer.current)
          show()
        }}
        onBlur={hide}
        className={cn("inline-flex h-[26px] cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] ps-[3px] pe-2.5 text-[13.5px] font-semibold outline-none [transition:background-color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", open ? "bg-[var(--accent)]" : "bg-[var(--background)]")}
      >
        <span aria-hidden="true" className="size-5 rounded-full bg-[var(--muted)] bg-cover bg-center" style={{ backgroundImage: person.src ? `url(${person.src})` : undefined }} />
        {person.name.split(" ")[0]}
      </button>
      <span
        role="dialog"
        aria-label={person.name}
        onMouseEnter={() => window.clearTimeout(timer.current)}
        onMouseLeave={hide}
        onFocus={() => window.clearTimeout(timer.current)}
        onBlur={hide}
        ref={(el) => {
          el?.toggleAttribute("inert", !open)
        }}
        className="absolute -top-2.5 z-[5] flex flex-col gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--background)] px-3.5 pt-3 pb-3.5 text-start leading-[1.4] shadow-[0_24px_48px_-22px_rgba(0,0,0,.45)] [transition:clip-path_.5s_cubic-bezier(.2,1.1,.3,1),opacity_.2s] motion-reduce:[transition:opacity_.2s]"
        style={{ width: CARD_W, height: CARD_H, insetInlineStart: box.dx - 3, clipPath: clip, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      >
        <span className="flex items-center gap-3">
          <span aria-hidden="true" className="relative size-[46px] shrink-0 rounded-full bg-[var(--muted)] bg-cover bg-center shadow-[0_0_0_1px_var(--border)]" style={{ backgroundImage: person.src ? `url(${person.src})` : undefined }}>
            <span className={cn("absolute end-0 bottom-0 size-3 rounded-full shadow-[0_0_0_2px_var(--background)]", working ? "bg-[var(--success,var(--chart-3))]" : "bg-[var(--muted-foreground)]")} />
          </span>
          <span className="flex flex-col gap-px">
            <span className="text-[15px] font-semibold">{person.name}</span>
            {person.role && <span className="text-[12.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{person.role}</span>}
          </span>
        </span>
        {person.bio && (
          <span className="text-[length:var(--ns-type-label)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [text-wrap:pretty] [transition:opacity_.3s_.12s,translate_.45s_var(--ns-ease-reshape)_.12s]" style={{ opacity: open ? 1 : 0, translate: open ? "0 0" : "0 6px" }}>
            {person.bio}
          </span>
        )}
        <span className="flex flex-col gap-[7px] [transition:opacity_.3s_.18s]" style={{ opacity: open ? 1 : 0 }}>
          <span className="flex justify-between gap-2 font-mono text-[11px] whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
            <span className="flex items-center gap-1.5 text-[var(--foreground)]">
              <span aria-hidden="true" className={cn("size-1.5 rounded-full", working ? "bg-[var(--success,var(--chart-3))]" : "bg-[var(--muted-foreground)]")} />
              {working ? `Working · free after ${String(h1).padStart(2, "0")}:00` : `Back at ${String(h0).padStart(2, "0")}:00`}
            </span>
            <span>
              {now ?? "--:--"} {person.place}
            </span>
          </span>
          <span aria-hidden="true" className="relative h-1.5 rounded-[3px] bg-[var(--muted)]">
            <span className="absolute inset-y-0 rounded-[3px] bg-[color-mix(in_oklab,var(--success,var(--chart-3))_45%,transparent)]" style={{ insetInlineStart: `${(h0 / 24) * 100}%`, width: `${((h1 - h0) / 24) * 100}%` }} />
            {mins !== null && <span className="absolute -top-[3px] -ms-px h-3 w-0.5 rounded-[1px] bg-[var(--foreground)] [transition:inset-inline-start_.6s_cubic-bezier(.2,1.2,.3,1)]" style={{ insetInlineStart: `${(mins / 1440) * 100}%` }} />}
          </span>
        </span>
        {actions && (
          <span className="mt-auto grid grid-cols-2 gap-2 [transition:opacity_.3s_.22s,translate_.45s_var(--ns-ease-reshape)_.22s]" style={{ opacity: open ? 1 : 0, translate: open ? "0 0" : "0 6px" }}>
            {actions}
          </span>
        )}
      </span>
    </span>
  )
})

export { MentionCard, type MentionCardProps, type MentionPerson }
