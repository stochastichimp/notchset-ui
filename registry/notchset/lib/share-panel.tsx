"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { RollingLabel, Spinner } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"


const clock = () => performance.now()
/*
 * The share panel inside Share Popover (both builds): the link with a Copy that rolls to Copied, a
 * three-way access control that turns amber when the link goes public, people to pick as checkboxes
 * (each drops into the To field as a removable chip), and Send, which rolls through Sending to a green
 * "Sent to N people".
 */

type Access = "invited" | "workspace" | "public"

interface SharePerson {
  id: string
  name: string
  avatar?: string | undefined
}

interface SharePanelProps {
  title: string
  link: string
  onCopy?: ((link: string) => void) | undefined
  access: Access
  onAccessChange: (access: Access) => void
  /** The workspace's name, as the access line reads it. */
  workspace?: string | undefined
  people: readonly SharePerson[]
  /** Resolve when sent; the panel shows Sending until then. */
  onSend: (people: SharePerson[]) => Promise<void> | void
  /** After the green confirmation has shown. */
  onDone?: (() => void) | undefined
  onClose: () => void
  sound?: boolean | undefined
}

const ACCESS: { value: Access; label: string; icon: string[] }[] = [
  { value: "invited", label: "Invited", icon: ["M5 11h14v10H5z", "M8 11V7a4 4 0 0 1 8 0v4"] },
  { value: "workspace", label: "Workspace", icon: ["M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16", "M16 9h2a2 2 0 0 1 2 2v10", "M9 7h2M9 11h2M9 15h2", "M2 21h20"] },
  { value: "public", label: "Public", icon: ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20", "M2 12h20", "M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20"] },
]
const amber = "var(--warning,var(--chart-4))"

function accessLine(access: Access, workspace: string) {
  return access === "invited" ? "Only people you invite can open it" : access === "workspace" ? `Anyone at ${workspace} can view and comment` : "Anyone with the link can view it"
}

function SharePanel({ title, link, onCopy, access, onAccessChange, workspace = "your workspace", people, onSend, onDone, onClose, sound = true }: SharePanelProps) {
  const { sfx } = useSound(sound)
  const [copied, setCopied] = React.useState(false)
  const [picked, setPicked] = React.useState<string[]>([])
  const [send, setSend] = React.useState<0 | 1 | 2>(0)
  const timers = React.useRef<number[]>([])
  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
  const ai = ACCESS.findIndex((a) => a.value === access)
  const chosen = picked.map((id) => people.find((p) => p.id === id)).filter((p): p is SharePerson => Boolean(p))

  const toggle = (p: SharePerson, i: number) => {
    const on = picked.includes(p.id)
    if (on) sfx.drop()
    else sfx.tone(700 + i * 90, 0.06, "sine", 0.05, 0, 1000 + i * 90)
    setPicked((list) => (on ? list.filter((x) => x !== p.id) : [...list, p.id]))
    setSend(0)
  }
  const go = async () => {
    if (!chosen.length) {
      sfx.buzz()
      return
    }
    if (send) return
    sfx.press()
    setSend(1)
    const started = clock()
    try {
      await onSend(chosen)
    } catch {
      sfx.buzz()
      setSend(0)
      return
    }
    // Sending holds for at least 900ms, so the roll reads.
    later(() => {
      sfx.chime()
      setSend(2)
      later(() => onClose(), 1500)
      later(() => {
        setSend(0)
        setPicked([])
        onDone?.()
      }, 1900)
    }, Math.max(0, 900 - (clock() - started)))
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="truncate text-[13.5px] font-semibold">Share “{title}”</span>
        <button type="button" aria-label="Close" onClick={onClose} className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full outline-none [transition:background-color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-90">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="flex h-10 items-center gap-2 rounded-[12px] bg-[var(--muted)] ps-2.5 pe-1">
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-3.5 shrink-0", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
        </svg>
        <span dir="ltr" className="min-w-0 flex-1 truncate text-[12.5px]">
          {link}
        </span>
        <button
          type="button"
          onClick={() => {
            sfx.pop()
            void navigator.clipboard?.writeText(link).catch(() => undefined)
            onCopy?.(link)
            setCopied(true)
            later(() => setCopied(false), 1600)
          }}
          className={cn(
            "inline-flex h-[var(--ns-control-compact)] shrink-0 cursor-pointer items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-2.5 text-[length:var(--ns-type-note)] font-medium outline-none [transition:scale_var(--ns-time-press)_var(--ns-ease-press),color_var(--ns-time-color)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95",
            copied ? "text-[color-mix(in_oklab,var(--success,var(--foreground))_80%,var(--foreground))]" : "text-[var(--foreground)]"
          )}
        >
          <RollingLabel
            index={copied ? 1 : 0}
            align="start"
            rows={[
              <React.Fragment key="copy">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[13px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copy
              </React.Fragment>,
              <React.Fragment key="copied">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[13px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Copied
              </React.Fragment>,
            ]}
          />
        </button>
      </div>
      <div role="radiogroup" aria-label="Who can open it" className="relative grid grid-cols-3 gap-1 rounded-[12px] bg-[var(--muted)] p-[3px]">
        <span
          aria-hidden="true"
          className="absolute inset-y-[3px] start-[3px] w-[calc((100%-14px)/3)] rounded-[9px] bg-[var(--background)] [--sx:1] [transition:translate_.45s_cubic-bezier(.2,1.25,.3,1),box-shadow_var(--ns-time-state)] rtl:[--sx:-1]"
          style={{ translate: `calc((100% + 4px) * ${ai} * var(--sx)) 0`, boxShadow: `0 1px 2px rgba(0,0,0,.08), 0 0 0 1px ${access === "public" ? `color-mix(in oklab, ${amber} 60%, transparent)` : "var(--border)"}` }}
        />
        {ACCESS.map((a, i) => (
          <button
            key={a.value}
            type="button"
            role="radio"
            aria-checked={i === ai}
            onClick={() => {
              if (i === ai) return
              sfx.tone(a.value === "public" ? 600 : 800 + i * 100, 0.05, "triangle", 0.04)
              onAccessChange(a.value)
            }}
            className={cn("relative flex h-[var(--ns-control-compact)] cursor-pointer items-center justify-center gap-[5px] rounded-[9px] text-[length:var(--ns-type-note)] font-medium outline-none [transition:color_var(--ns-time-color)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", i === ai ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
            style={i === ai && a.value === "public" ? { color: `color-mix(in oklab, ${amber} 70%, var(--foreground))` } : undefined}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[13px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {a.icon.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>
            {a.label}
          </button>
        ))}
      </div>
      <span aria-live="polite" className="flex min-h-[18px] items-center gap-1.5 text-[length:var(--ns-type-note)] [transition:color_.3s]" style={{ color: access === "public" ? `color-mix(in oklab, ${amber} 75%, var(--foreground))` : undefined }}>
        <span aria-hidden="true" className="size-1.5 rounded-full [transition:background-color_.3s]" style={{ background: access === "public" ? amber : access === "workspace" ? "var(--chart-1)" : "var(--muted-foreground)" }} />
        <span className={access === "public" ? undefined : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"}>{accessLine(access, workspace)}</span>
      </span>
      <div className="flex min-h-[38px] flex-wrap items-center gap-[5px] rounded-[12px] border border-[var(--border)] px-1.5 py-1">
        <span className={cn("px-1 text-[length:var(--ns-type-note)]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>To</span>
        {chosen.map((p) => (
          <span key={p.id} className="inline-flex h-[26px] animate-[ns-chip_.35s_var(--ns-ease-rebound)_both] items-center gap-[5px] rounded-full bg-[var(--secondary)] ps-[3px] pe-1 text-[length:var(--ns-type-note)] motion-reduce:animate-none">
            <span aria-hidden="true" className="size-5 rounded-full bg-[var(--muted)] bg-cover bg-center" style={p.avatar ? { backgroundImage: `url(${p.avatar})` } : undefined} />
            {p.name}
            <button type="button" aria-label={`Remove ${p.name}`} onClick={() => toggle(p, people.indexOf(p))} className={cn("grid size-[18px] cursor-pointer place-items-center rounded-full outline-none hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[11px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </span>
        ))}
        {!chosen.length && <span className={cn("text-[length:var(--ns-type-note)]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>Pick people below</span>}
      </div>
      <div role="group" aria-label="People" className="flex justify-between">
        {people.map((p, i) => {
          const on = picked.includes(p.id)
          return (
            <button key={p.id} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(p, i)} className="flex cursor-pointer flex-col items-center gap-1 rounded-[10px] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]">
              <span
                aria-hidden="true"
                className={cn("relative size-[42px] rounded-full bg-[var(--muted)] bg-cover bg-center [transition:box-shadow_.25s,scale_.35s_var(--ns-ease-rebound)]", on ? "scale-[1.06] shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--chart-1)]" : "shadow-[0_0_0_1px_var(--border)]")}
                style={p.avatar ? { backgroundImage: `url(${p.avatar})` } : undefined}
              >
                {on && (
                  <span className="absolute -end-0.5 -bottom-0.5 grid size-4 animate-[ns-chip_.35s_cubic-bezier(.2,1.7,.4,1)_both] place-items-center rounded-full bg-[var(--chart-1)] text-white shadow-[0_0_0_2px_var(--background)]">
                    <svg viewBox="0 0 24 24" className="size-[9px]" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                )}
              </span>
              <span className={cn("text-[11px]", on ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{p.name}</span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        aria-disabled={!chosen.length || undefined}
        onClick={() => void go()}
        className={cn(
          "inline-flex h-[38px] w-full cursor-pointer items-center justify-center rounded-[var(--radius)] text-[length:var(--ns-type-label)] font-medium outline-none [transition:scale_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color),color_var(--ns-time-color),opacity_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] active:scale-[.97]",
          send === 2 ? "bg-[var(--success,var(--foreground))] text-[var(--success-foreground,var(--background))]" : "bg-[var(--primary)] text-[var(--primary-foreground)]",
          chosen.length ? "opacity-100" : "opacity-45"
        )}
      >
        <RollingLabel
          index={send}
          rows={[
            <React.Fragment key="send">Send</React.Fragment>,
            <React.Fragment key="sending">
              <Spinner className="size-3" />
              Sending
            </React.Fragment>,
            <React.Fragment key="sent">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className="leading-5">{`Sent to ${chosen.length} ${chosen.length === 1 ? "person" : "people"}`}</span>
            </React.Fragment>,
          ]}
        />
      </button>
    </div>
  )
}

export { accessLine, SharePanel, type Access, type SharePanelProps, type SharePerson }
