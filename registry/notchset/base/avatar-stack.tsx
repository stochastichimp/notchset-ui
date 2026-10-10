"use client"

/**
 * Avatar Stack (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/avatar-stack
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Collapse } from "@/lib/notchset/collapse"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * Avatar Stack: 40px avatars overlapping by 12px, up to `max` with a +N chip. Hovering or focusing the
 * group fans it out to 6px gaps, 25ms apart; the hovered face lifts and shows its name and an ×, and
 * tapping it removes the person. The dashed + turns 45° and unfolds suggestions; picking one drops them
 * into the stack.
 */

interface StackPerson {
  id: string
  name: string
  src?: string | undefined
  color?: string | undefined
}

interface AvatarStackProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  people: readonly StackPerson[]
  /** People who can be added. */
  suggestions?: readonly StackPerson[] | undefined
  onAdd?: ((person: StackPerson) => void) | undefined
  onRemove?: ((person: StackPerson) => void) | undefined
  max?: number | undefined
  label?: string | undefined
  sound?: boolean | undefined
}

const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

function Face({ p, size }: { p: StackPerson; size: number }) {
  const c = p.color ?? "var(--chart-2)"
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-cover bg-center font-[650]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36), backgroundImage: p.src ? `url(${p.src})` : undefined, backgroundColor: p.src ? "var(--muted)" : `color-mix(in oklab, ${c} 18%, var(--background))`, color: `color-mix(in oklab, ${c} 55%, var(--foreground))` }}
    >
      {!p.src && initials(p.name)}
    </span>
  )
}

const AvatarStack = React.forwardRef<HTMLDivElement, AvatarStackProps>(function AvatarStack({ people, suggestions = [], onAdd, onRemove, max = 5, label = "Collaborators", sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [fan, setFan] = React.useState(false)
  const [hover, setHover] = React.useState<string | null>(null)
  const [pick, setPick] = React.useState(false)
  const [fresh, setFresh] = React.useState<string | null>(null)
  const shown = people.slice(0, max)
  const over = people.length - shown.length
  const gap = (first: boolean) => (first ? 0 : fan ? 6 : -12)

  return (
    <div ref={ref} data-slot="avatar-stack" data-notchset="" className={cn("flex w-full flex-col items-center gap-3", className)} {...props}>
      <div
        role="group"
        aria-label={label}
        onMouseEnter={() => setFan(true)}
        onMouseLeave={() => {
          setFan(false)
          setHover(null)
        }}
        onFocus={() => setFan(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setFan(false)
            setHover(null)
          }
        }}
        className="flex items-center px-2 py-1.5"
      >
        {shown.map((p, j) => {
          const hv = fan && hover === p.id
          return (
            <span
              key={p.id}
              className={cn("relative flex [transition:margin_.45s_cubic-bezier(.2,1.2,.3,1)] motion-reduce:transition-none", fresh === p.id && "animate-[ns-drop-in-face_.5s_var(--ns-ease-pop)_both]")}
              style={{ marginInlineStart: gap(j === 0), zIndex: 10 - j, transitionDelay: `${j * 25}ms` }}
            >
              <button
                type="button"
                aria-label={onRemove ? `${p.name}. Remove` : p.name}
                onMouseEnter={() => setHover(p.id)}
                onFocus={() => setHover(p.id)}
                onClick={() => {
                  if (!fan || !onRemove) return
                  sfx.drop()
                  setHover(null)
                  onRemove(p)
                }}
                className={cn("relative grid size-[var(--ns-control-regular)] place-items-center rounded-full shadow-[0_0_0_2.5px_var(--card,var(--background))] outline-none [transition:translate_.3s_var(--ns-ease-pop)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2", fan && onRemove ? "cursor-pointer" : "cursor-default")}
                style={{ translate: hv ? "0 -4px" : "0 0" }}
              >
                <Face p={p} size={40} />
                {onRemove && (
                  <span aria-hidden="true" className="absolute -end-[3px] -top-[3px] grid size-4 place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)] shadow-[0_0_0_2px_var(--card,var(--background))] [transition:opacity_.15s,scale_.3s_var(--ns-ease-rebound)]" style={{ opacity: hv ? 1 : 0, scale: hv ? "1" : ".4" }}>
                    <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </span>
                )}
              </button>
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[calc(100%+10px)] mx-auto flex h-6 w-max items-center rounded-[7px] bg-[var(--foreground)] px-[9px] text-[11.5px] font-semibold whitespace-nowrap text-[var(--background)] [transition:opacity_.15s,translate_.3s_cubic-bezier(.2,1.4,.3,1)]" style={{ opacity: hv ? 1 : 0, translate: hv ? "0 0" : "0 4px" }}>
                {p.name}
              </span>
            </span>
          )
        })}
        {over > 0 && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] font-mono text-[12.5px] font-semibold shadow-[0_0_0_2.5px_var(--card,var(--background))] [transition:margin_.45s_cubic-bezier(.2,1.2,.3,1)]" style={{ marginInlineStart: gap(false) }} aria-label={`${over} more`}>
            +<NumberFlow value={over} />
          </span>
        )}
        {onAdd && (
          <button
            type="button"
            aria-label="Invite"
            aria-expanded={pick}
            onClick={() => {
              if (pick) sfx.close()
              else sfx.open()
              setPick(!pick)
            }}
            className={cn("grid size-[var(--ns-control-regular)] shrink-0 cursor-pointer place-items-center rounded-full border-[1.5px] border-dashed bg-[var(--card,var(--background))] outline-none [transition:margin_.45s_cubic-bezier(.2,1.2,.3,1),border-color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", pick ? "border-[var(--foreground)]" : "border-[var(--border)]")}
            style={{ marginInlineStart: fan ? 10 : 6 }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 [transition:rotate_.45s_var(--ns-ease-pop)]" style={{ rotate: pick ? "45deg" : "0deg" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        )}
      </div>
      {onAdd && (
        <Collapse open={pick}>
          <div className="flex max-w-[360px] flex-wrap justify-center gap-1.5 px-0.5 py-1">
            {suggestions.length ? (
              suggestions.map((p, j) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setFresh(p.id)
                    sfx.pop()
                    sfx.tone(1100, 0.06, "sine", 0.025, 0.05)
                    onAdd(p)
                  }}
                  className="flex h-[var(--ns-control-compact)] cursor-pointer items-center gap-[7px] rounded-full border border-[var(--border)] bg-[var(--background)] ps-1 pe-3 text-[12.5px] font-medium outline-none [transition:opacity_.25s,translate_.4s_var(--ns-ease-reshape),background-color_.15s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
                  style={{ opacity: pick ? 1 : 0, translate: pick ? "0 0" : "0 -6px", transitionDelay: `${j * 40}ms, ${j * 40}ms, 0ms` }}
                >
                  <Face p={p} size={24} />
                  {p.name.split(" ")[0]}
                </button>
              ))
            ) : (
              <span className="py-2 font-mono text-[11.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">Everyone is already here</span>
            )}
          </div>
        </Collapse>
      )}
    </div>
  )
})

export { AvatarStack, type AvatarStackProps, type StackPerson }
