"use client"

/**
 * Row Actions (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/row-actions
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Collapse } from "@/lib/notchset/collapse"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { RollingLabel } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Row Actions: an inbox whose actions wait until you reach for a row. Hover or focus slides the time up
 * and away as Archive, Snooze and Read slide in one after another. Snooze opens a row of choices inside
 * the row; picking one, or archiving, slides the row out and folds it, and the footer offers Undo.
 */

interface InboxRow {
  id: string
  name: string
  subject: string
  time: string
  avatar?: string | undefined
  unread?: boolean | undefined
}

interface RowActionsProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  title?: React.ReactNode | undefined
  rows: readonly InboxRow[]
  onArchive: (row: InboxRow) => void
  onSnooze: (row: InboxRow, until: string) => void
  onToggleRead: (row: InboxRow) => void
  /** Put a removed row back at its index. */
  onUndo?: ((row: InboxRow, index: number) => void) | undefined
  snoozeOptions?: readonly string[] | undefined
  sound?: boolean | undefined
}

const ICONS = {
  archive: ["M3 4h18v4H3z", "M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8", "M10 12h4"],
  snooze: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18", "M12 7v5l3 2"],
  read: ["M22 12h-6l-2 3h-4l-2-3H2", "M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z"],
}
function Icon({ d }: { d: string[] }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  )
}

const RowActions = React.forwardRef<HTMLDivElement, RowActionsProps>(function RowActions(
  { title = "Inbox", rows, onArchive, onSnooze, onToggleRead, onUndo, snoozeOptions = ["Later today · 6 pm", "Tomorrow · 9 am", "Next week"], sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [hover, setHover] = React.useState<string | null>(null)
  const [snooze, setSnooze] = React.useState<string | null>(null)
  const [leaving, setLeaving] = React.useState<Record<string, "start" | "end">>({})
  const [toast, setToast] = React.useState<{ text: string; row: InboxRow; index: number; n: number } | null>(null)
  const timers = React.useRef<number[]>([])
  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  React.useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(t)
  }, [toast])
  const unread = rows.filter((r) => r.unread && !leaving[r.id]).length

  const remove = (row: InboxRow, dir: "start" | "end", text: string, done: () => void) => {
    const index = rows.findIndex((r) => r.id === row.id)
    sfx.noise(0.22, 0.035, 900, 2600)
    setLeaving((l) => ({ ...l, [row.id]: dir }))
    setSnooze(null)
    setHover(null)
    timers.current.push(
      window.setTimeout(() => {
        done()
        setLeaving(({ [row.id]: _, ...rest }) => rest)
        setToast((t) => ({ text, row, index, n: (t?.n ?? 0) + 1 }))
      }, 750)
    )
  }

  return (
    <div ref={ref} data-slot="row-actions" data-notchset="" className={cn("w-full max-w-[470px] overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]", className)} {...props}>
      <div className="flex h-[52px] items-center justify-between px-4">
        <span className="text-[15px] font-semibold tracking-[-0.02em]">{title}</span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
          <span aria-hidden="true" className="size-[7px] rounded-full bg-[var(--info,var(--chart-1))]" />
          <NumberFlow value={unread} /> unread
        </span>
      </div>
      <ul className="m-0 list-none p-0">
        {rows.map((r) => {
          const gone = leaving[r.id]
          const show = !gone && (hover === r.id || snooze === r.id)
          const sz = snooze === r.id
          return (
            <li key={r.id}>
              <Collapse open={!gone} delay={gone ? 300 : 0}>
                <div
                  onMouseEnter={() => setHover(r.id)}
                  onMouseLeave={() => setHover((h) => (h === r.id && snooze !== r.id ? null : h))}
                  onFocus={() => setHover(r.id)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover((h) => (h === r.id && snooze !== r.id ? null : h))
                  }}
                  className="border-t border-[var(--border)] [transition:background-color_.2s,translate_.4s_cubic-bezier(.5,0,.75,.4),opacity_var(--ns-time-state)]"
                  style={{ background: show ? "var(--accent)" : "transparent", translate: gone === "end" ? "60px 0" : gone === "start" ? "-60px 0" : "0 0", opacity: gone ? 0 : 1 }}
                >
                  <div className="flex h-[62px] items-center gap-3 ps-3 pe-2.5">
                    <span aria-hidden="true" className={cn("size-[7px] shrink-0 rounded-full bg-[var(--info,var(--chart-1))] [transition:scale_.4s_cubic-bezier(.2,1.7,.4,1)]", r.unread ? "scale-100" : "scale-0")} />
                    <span aria-hidden="true" className="size-[34px] shrink-0 rounded-full bg-[var(--muted)] bg-cover bg-center shadow-[0_0_0_1px_var(--border)]" style={r.avatar ? { backgroundImage: `url(${r.avatar})` } : undefined} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={cn("text-[13.5px] whitespace-nowrap", r.unread ? "font-[650]" : "font-medium")}>
                        {r.name}
                        <span className="sr-only">{r.unread ? ", unread" : ""}</span>
                      </span>
                      <span className="truncate text-[length:var(--ns-type-label)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{r.subject}</span>
                    </span>
                    <span className="relative h-[34px] w-[110px] shrink-0">
                      <span className="absolute end-1.5 top-0 flex h-[34px] items-center font-mono text-[11px] whitespace-nowrap [transition:opacity_.2s,translate_.35s_cubic-bezier(.2,1.2,.3,1)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]" style={{ opacity: show ? 0 : 1, translate: show ? "0 -10px" : "0 0" }}>
                        {r.time}
                      </span>
                      <span className={cn("absolute end-0 top-0 flex gap-1", !show && "pointer-events-none")}>
                        {(["archive", "snooze", "read"] as const).map((k, i) => (
                          <button
                            key={k}
                            type="button"
                            aria-label={k === "archive" ? `Archive ${r.name}` : k === "snooze" ? `Snooze ${r.name}` : r.unread ? `Mark ${r.name} read` : `Mark ${r.name} unread`}
                            aria-expanded={k === "snooze" ? sz : undefined}
                            title={k === "archive" ? "Archive" : k === "snooze" ? "Snooze" : "Toggle read"}
                            onClick={() => {
                              if (k === "archive") remove(r, "end", `Archived · ${r.name}`, () => onArchive(r))
                              else if (k === "snooze") {
                                if (sz) sfx.close()
                                else sfx.open()
                                setSnooze(sz ? null : r.id)
                                setHover(r.id)
                              } else {
                                if (r.unread) sfx.tick()
                                else sfx.pop()
                                onToggleRead(r)
                              }
                            }}
                            className={cn("grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full outline-none [transition:opacity_.25s,translate_.45s_cubic-bezier(.2,1.4,.3,1),scale_.45s_cubic-bezier(.2,1.4,.3,1),background-color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] motion-reduce:transition-none", k === "snooze" && sz ? "bg-[var(--foreground)] text-[var(--background)]" : "hover:bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]")}
                            style={{ opacity: show ? 1 : 0, translate: show ? "0 0" : `${12 + (2 - i) * 6}px 0`, scale: show ? "1" : ".7", transitionDelay: show ? `${i * 40}ms` : "0ms" }}
                          >
                            <Icon d={ICONS[k]} />
                          </button>
                        ))}
                      </span>
                    </span>
                  </div>
                  <Collapse open={sz}>
                    <div className="flex flex-wrap gap-1.5 ps-[65px] pe-3 pb-3.5">
                      {snoozeOptions.map((o, i) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => remove(r, "start", `Snoozed · ${o}`, () => onSnooze(r, o))}
                          className="h-[30px] cursor-pointer rounded-full border border-[var(--border)] bg-[var(--background)] px-[var(--ns-inset-compact)] text-[12.5px] font-medium whitespace-nowrap outline-none [transition:opacity_.25s,scale_.45s_var(--ns-ease-rebound),background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
                          style={{ opacity: sz ? 1 : 0, scale: sz ? "1" : ".7", transitionDelay: `${80 + i * 50}ms` }}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </Collapse>
                </div>
              </Collapse>
            </li>
          )
        })}
      </ul>
      <div className="flex h-12 items-center justify-between gap-2 border-t border-[var(--border)] ps-4 pe-2">
        <span role="status" className="min-w-0 text-[12.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
          <RollingLabel index={toast ? 1 : 0} align="start" rows={["Hover or focus a row for its actions", <span key={toast?.n ?? 0} className="truncate text-[var(--foreground)]">✓ {toast?.text}</span>]} />
        </span>
        {onUndo && (
          <button
            type="button"
            tabIndex={toast ? 0 : -1}
            onClick={() => {
              if (!toast) return
              sfx.pop()
              onUndo(toast.row, toast.index)
              setToast(null)
            }}
            className={cn("h-[30px] shrink-0 cursor-pointer rounded-full bg-[var(--foreground)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-note)] font-medium text-[var(--background)] outline-none [transition:opacity_.25s,scale_.4s_var(--ns-ease-rebound)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", toast ? "scale-100 opacity-100" : "pointer-events-none scale-[.7] opacity-0")}
          >
            Undo
          </button>
        )}
      </div>
    </div>
  )
})

export { RowActions, type InboxRow, type RowActionsProps }
