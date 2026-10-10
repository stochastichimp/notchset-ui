"use client"

/**
 * Context Actions (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/context-actions
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { HeartIcon } from "@/lib/notchset/heart"
import { inertRef, RollingLabel, useIsomorphicLayoutEffect } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Context Actions: the ⋯ button unfurls in place into a menu card, its items arriving one by one.
 * Favorite toggles and closes; Add to album slides in a submenu; Copy link turns green for a moment;
 * Delete needs a 900ms hold (a red fill sweeps across with a rising tone, and letting go early springs it
 * back), or two presses from the keyboard, so nothing disappears by accident.
 */

interface Album {
  id: string
  label: string
  image?: string | undefined
  count?: number | undefined
}

interface ContextActionsProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  favorite: boolean
  onFavoriteChange: (favorite: boolean) => void
  albums?: readonly Album[] | undefined
  onAddToAlbum?: ((album: Album) => void) | undefined
  onCopyLink?: (() => void) | undefined
  onDownload?: (() => void) | undefined
  /** Beside Download, e.g. "2.4 MB". */
  downloadHint?: string | undefined
  /** After the hold completes. */
  onDelete: () => void
  /** No menu while the thing is gone. */
  disabled?: boolean | undefined
  sound?: boolean | undefined
}

const HOLD = 900

function Icon({ d }: { d: string[] }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  )
}

const ContextActions = React.forwardRef<HTMLDivElement, ContextActionsProps>(function ContextActions(
  { favorite, onFavoriteChange, albums = [], onAddToAlbum, onCopyLink, onDownload, downloadHint, onDelete, disabled, sound = true, className, ...props },
  ref
) {
  const { sfx, holdTone } = useSound(sound)
  const menuId = React.useId()
  const trigger = React.useRef<HTMLButtonElement>(null)
  const panes = React.useRef<(HTMLDivElement | null)[]>([])
  const [open, setOpen] = React.useState(false)
  const [sub, setSub] = React.useState(false)
  const [size, setSize] = React.useState([270, 180])
  const [copied, setCopied] = React.useState(false)
  const [hold, setHold] = React.useState<{ p: number; on: boolean }>({ p: 0, on: false })
  const [armed, setArmed] = React.useState(false)
  const timers = React.useRef<number[]>([])
  const holding = React.useRef<{ raf: number; tone: { stop(): void } } | null>(null)

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
  React.useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      if (holding.current) {
        cancelAnimationFrame(holding.current.raf)
        holding.current.tone.stop()
      }
    },
    []
  )
  useIsomorphicLayoutEffect(() => {
    if (!open) return
    setSize(panes.current.map((el, i) => (el ? el.scrollHeight : i ? 180 : 270)))
  }, [open, albums.length, copied, armed])
  React.useEffect(() => {
    if (!open) return
    const pane = panes.current[sub ? 1 : 0]
    window.setTimeout(() => pane?.querySelector<HTMLElement>("[role=menuitem]")?.focus({ preventScroll: true }), sub ? 120 : 60)
  }, [open, sub])

  const close = (refocus = true) => {
    sfx.swooshOut()
    setOpen(false)
    setSub(false)
    setArmed(false)
    if (refocus) later(() => trigger.current?.focus({ preventScroll: true }), 0)
  }
  const endHold = () => {
    const h = holding.current
    if (!h) return
    cancelAnimationFrame(h.raf)
    h.tone.stop()
    holding.current = null
    setHold({ p: 0, on: false })
  }
  const startHold = () => {
    endHold()
    const t0 = performance.now()
    const tone = holdTone(HOLD / 1000)
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / HOLD)
      setHold({ p, on: true })
      if (p < 1) {
        holding.current!.raf = requestAnimationFrame(step)
        return
      }
      tone.stop()
      holding.current = null
      setHold({ p: 0, on: false })
      sfx.thud()
      setOpen(false)
      onDelete()
    }
    holding.current = { raf: requestAnimationFrame(step), tone }
  }

  const items: { key: string; label: React.ReactNode; icon: React.ReactNode; hint?: string | undefined; tone?: string | undefined }[] = [
    {
      key: "favorite",
      label: favorite ? "Unfavorite" : "Favorite",
      icon: <HeartIcon filled={favorite} className="size-4 shrink-0" />,
      tone: favorite ? "text-[var(--heart,var(--destructive))]" : undefined,
    },
    ...(onAddToAlbum
      ? [
          {
            key: "album",
            label: "Add to album",
            icon: <Icon d={["M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"]} />,
            hint: "›",
          },
        ]
      : []),
    ...(onCopyLink
      ? [
          {
            key: "copy",
            label: <RollingLabel index={copied ? 1 : 0} align="start" rows={["Copy link", "Link copied"]} />,
            icon: <Icon d={["M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7", "M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"]} />,
            tone: copied ? "text-[color-mix(in_oklab,var(--success,var(--foreground))_80%,var(--foreground))]" : undefined,
          },
        ]
      : []),
    ...(onDownload
      ? [
          {
            key: "download",
            label: "Download",
            icon: <Icon d={["M12 15V3", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5"]} />,
            hint: downloadHint,
          },
        ]
      : []),
    {
      key: "delete",
      label: <RollingLabel index={armed ? 1 : 0} align="start" rows={["Delete", "Press again to delete"]} />,
      icon: <Icon d={["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"]} />,
      hint: armed ? undefined : "hold",
      tone: "text-[var(--destructive)]",
    },
  ]

  const act = (key: string, keyboard: boolean) => {
    if (key === "favorite") {
      if (!favorite) sfx.heart()
      else sfx.drop()
      onFavoriteChange(!favorite)
      later(() => close(false), 260)
    } else if (key === "album") {
      sfx.tick()
      setSub(true)
    } else if (key === "copy") {
      sfx.pop()
      onCopyLink?.()
      setCopied(true)
      later(() => setCopied(false), 1600)
    } else if (key === "download") {
      sfx.press()
      later(() => sfx.chime(), 200)
      onDownload?.()
      later(() => close(false), 400)
    } else if (key === "delete" && keyboard) {
      // Keyboard users confirm with a second press instead of holding.
      if (!armed) {
        sfx.warn()
        setArmed(true)
        later(() => setArmed(false), 3000)
        return
      }
      sfx.thud()
      setOpen(false)
      onDelete()
    }
  }

  const menuKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      if (sub) {
        sfx.tick()
        setSub(false)
      } else close()
      return
    }
    if (event.key === "ArrowLeft" && sub) {
      event.preventDefault()
      setSub(false)
      return
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return
    event.preventDefault()
    const list = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[role=menuitem]"))
    const at = list.indexOf(document.activeElement as HTMLElement)
    const next = event.key === "Home" ? 0 : event.key === "End" ? list.length - 1 : (at + (event.key === "ArrowDown" ? 1 : -1) + list.length) % list.length
    list[next]?.focus()
  }

  return (
    <div ref={ref} data-slot="context-actions" data-notchset="" data-state={open ? "open" : "closed"} className={cn("relative size-12", className)} {...props}>
      <div
        className={cn(
          "absolute start-1/2 bottom-0 z-[4] overflow-hidden shadow-[var(--ns-shadow-layer)] [transition:width_.5s_cubic-bezier(.2,1.15,.3,1),height_.5s_cubic-bezier(.2,1.15,.3,1),border-radius_.45s_var(--ns-ease-settle),background-color_.3s,color_.3s] motion-reduce:[transition:opacity_.2s,background-color_.3s] ltr:-translate-x-1/2 rtl:translate-x-1/2",
          open ? "rounded-[18px] border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]" : "rounded-[24px] bg-[var(--primary)] text-[var(--primary-foreground)]"
        )}
        style={{ width: open ? 220 : 48, height: open ? size[sub ? 1 : 0] : 48 }}
      >
        {!open ? (
          <button
            ref={trigger}
            type="button"
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={false}
            aria-controls={menuId}
            disabled={disabled}
            onClick={() => {
              sfx.swooshIn()
              setSub(false)
              setOpen(true)
            }}
            className="absolute inset-0 grid cursor-pointer place-items-center rounded-[24px] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="currentColor">
              <circle cx="5" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="19" cy="12" r="1.6" />
            </svg>
          </button>
        ) : (
          <div id={menuId} role="menu" aria-label="Photo actions" onKeyDown={menuKeys} className="w-[218px] overflow-hidden">
            <div className="flex w-[436px] [--sx:-1] [transition:translate_.45s_var(--ns-ease-settle)] motion-reduce:transition-none rtl:[--sx:1]" style={{ translate: sub ? "calc(218px * var(--sx)) 0" : "0 0" }}>
              <div
                ref={(el) => {
                  panes.current[0] = el
                  inertRef(sub)(el)
                }}
                className="flex w-[218px] flex-col p-1.5"
              >
                {items.map((a, i) => (
                  <button
                    key={a.key}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    onPointerDown={a.key === "delete" ? (event) => {
                      if (event.button !== 0) return
                      event.currentTarget.setPointerCapture(event.pointerId)
                      startHold()
                    } : undefined}
                    onPointerUp={a.key === "delete" ? endHold : undefined}
                    onPointerCancel={a.key === "delete" ? endHold : undefined}
                    onLostPointerCapture={a.key === "delete" ? endHold : undefined}
                    onClick={(event) => act(a.key, event.detail === 0)}
                    className={cn("relative flex h-[42px] w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-[10px] px-2.5 text-start text-[13.5px] outline-none [transition:background-color_.2s] hover:bg-[var(--accent)] focus-visible:bg-[var(--accent)]", "animate-[ns-slidex_.35s_var(--ns-ease-settle)_both] motion-reduce:animate-none", a.tone ?? "text-[var(--foreground)]")}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {a.key === "delete" && (
                      <span aria-hidden="true" className={cn("absolute inset-y-0 start-0 bg-[color-mix(in_oklab,var(--destructive)_16%,transparent)]", !hold.on && "[transition:width_.3s_cubic-bezier(.2,1.4,.3,1)]")} style={{ width: `${hold.p * 100}%` }} />
                    )}
                    <span className="relative grid">{a.icon}</span>
                    <span className="relative min-w-0 flex-1">{a.label}</span>
                    {a.hint && <span className={cn("relative text-[11.5px]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]", a.hint === "›" && "rtl:-scale-x-100")}>{a.hint}</span>}
                  </button>
                ))}
                <div role="separator" className="mx-1.5 my-1 h-px bg-[var(--border)]" />
                <button type="button" role="menuitem" tabIndex={-1} onClick={() => close()} className={cn("h-9 cursor-pointer rounded-[10px] text-[12.5px] outline-none [transition:background-color_.2s,color_.2s] hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:bg-[var(--accent)]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>
                  Close
                </button>
              </div>
              <div
                ref={(el) => {
                  panes.current[1] = el
                  inertRef(!sub)(el)
                }}
                className="flex w-[218px] flex-col p-1.5"
              >
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => {
                    sfx.tick()
                    setSub(false)
                  }}
                  className={cn("flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] px-2 text-[12.5px] outline-none hover:bg-[var(--accent)] focus-visible:bg-[var(--accent)]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Add to album
                </button>
                {albums.map((al) => (
                  <button
                    key={al.id}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => {
                      sfx.pop()
                      later(() => sfx.ding(2), 80)
                      onAddToAlbum?.(al)
                      setSub(false)
                      later(() => close(false), 280)
                    }}
                    className={cn("relative flex h-[42px] w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-[10px] px-2.5 text-start text-[13.5px] outline-none [transition:background-color_.2s] hover:bg-[var(--accent)] focus-visible:bg-[var(--accent)]", "text-[var(--foreground)]")}
                  >
                    <span aria-hidden="true" className="size-[26px] shrink-0 rounded-[7px] bg-[var(--muted)] bg-cover bg-center" style={al.image ? { backgroundImage: `url(${al.image})` } : undefined} />
                    <span className="min-w-0 flex-1 truncate">{al.label}</span>
                    {al.count !== undefined && <span className={cn("text-[11.5px] tabular-nums", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{al.count}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export { ContextActions, type Album, type ContextActionsProps }
