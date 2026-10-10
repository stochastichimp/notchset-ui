"use client"

/**
 * Drag Handle List (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/drag-handle-list
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Drag Handle List: rows you reorder by their grip. A picked-up row follows the pointer one to one,
 * lifted with a shadow; the others make room as it passes them and it springs into its slot on drop.
 * From the keyboard, focus a grip and use ↑ / ↓; the new position is announced. The order is reported
 * on every change so you can save it.
 */

interface DragItem {
  id: string
  label: React.ReactNode
  /** The key hint at the end of the row, e.g. "⌘S". */
  shortcut?: string | undefined
}

interface DragHandleListProps extends Omit<React.ComponentPropsWithoutRef<"ol">, "children" | "onChange"> {
  items: readonly DragItem[]
  /** The ids in their new order, after every move. */
  onReorder?: ((ids: string[]) => void) | undefined
  /** Names a row for the grip's label and announcements (default: its label when it's text). */
  nameOf?: ((item: DragItem) => string) | undefined
  sound?: boolean | undefined
}

/** Row height and the pitch between rows (px). */
const ROW = 46
const PITCH = 52

const DragHandleList = React.forwardRef<HTMLOListElement, DragHandleListProps>(function DragHandleList({ items, onReorder, nameOf, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [order, setOrder] = React.useState(() => items.map((item) => item.id))
  const [drag, setDrag] = React.useState<{ id: string; from: number; to: number; dy: number } | null>(null)
  const [message, setMessage] = React.useState("")
  const start = React.useRef(0)
  const grips = React.useRef(new Map<string, HTMLButtonElement>())

  // Keep the order to the current items: new ids go to the end, removed ones drop out.
  const ids = items.map((item) => item.id)
  const current = [...order.filter((id) => ids.includes(id)), ...ids.filter((id) => !order.includes(id))]
  const byId = new Map(items.map((item) => [item.id, item]))
  const name = (id: string) => {
    const item = byId.get(id)
    if (!item) return id
    if (nameOf) return nameOf(item)
    return typeof item.label === "string" ? item.label : id
  }

  const commit = (next: string[], moved: string) => {
    setOrder(next)
    onReorder?.(next)
    setMessage(`${name(moved)}, position ${next.indexOf(moved) + 1} of ${next.length}`)
  }

  const last = current.length - 1
  const maxY = last * PITCH + 10
  return (
    <>
      <ol
        ref={ref}
        data-slot="drag-handle-list"
        data-notchset=""
        className={cn("relative m-0 w-full max-w-[340px] list-none p-0", className)}
        style={{ height: Math.max(0, current.length * PITCH - (PITCH - ROW)) }}
        {...props}
      >
        {current.map((id, slot) => {
          const item = byId.get(id)
          if (!item) return null
          const lifted = drag?.id === id
          let y = slot * PITCH
          if (drag && lifted) y = Math.max(-10, Math.min(maxY, drag.from * PITCH + drag.dy))
          else if (drag) {
            if (drag.from < drag.to && slot > drag.from && slot <= drag.to) y -= PITCH
            if (drag.from > drag.to && slot < drag.from && slot >= drag.to) y += PITCH
          }
          return (
            <li
              key={id}
              data-slot="drag-handle-list-item"
              className={cn(
                "absolute inset-x-0 top-0 flex h-[46px] items-center gap-2 rounded-[min(var(--radius),14px)] border border-[var(--border)] bg-[var(--background)] ps-1.5 pe-3.5 text-[var(--foreground)]",
                lifted ? "z-[3] shadow-[0_16px_30px_-14px_rgba(0,0,0,.3)] [transition:box-shadow_.2s]" : "z-[1] shadow-none [transition:transform_.38s_cubic-bezier(.2,1.2,.3,1),scale_.38s_cubic-bezier(.2,1.2,.3,1),translate_.38s_cubic-bezier(.2,1.2,.3,1),rotate_.38s_cubic-bezier(.2,1.2,.3,1),box-shadow_.2s]"
              )}
              style={{ transform: `translateY(${y}px) scale(${lifted ? 1.03 : 1})` }}
            >
              <button
                ref={(node) => {
                  if (node) grips.current.set(id, node)
                  else grips.current.delete(id)
                }}
                type="button"
                aria-label={`Reorder ${name(id)}`}
                className={cn(
                  "grid size-[30px] shrink-0 touch-none place-items-center rounded-[min(var(--radius),10px)] text-[var(--muted-foreground)] outline-none [transition:background-color_.15s,color_.15s] hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] pointer-coarse:size-11 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                  lifted ? "cursor-grabbing" : "cursor-grab"
                )}
                onPointerDown={(event) => {
                  if (event.button !== 0) return
                  event.currentTarget.setPointerCapture?.(event.pointerId)
                  start.current = event.clientY
                  sfx.tone(300, 0.08, "sine", 0.05, 0, 520)
                  setDrag({ id, from: slot, to: slot, dy: 0 })
                }}
                onPointerMove={(event) => {
                  if (!drag || drag.id !== id) return
                  const dy = event.clientY - start.current
                  const to = Math.max(0, Math.min(last, Math.round((drag.from * PITCH + dy) / PITCH)))
                  if (to !== drag.to) sfx.tone(1300, 0.02, "triangle", 0.03)
                  setDrag({ ...drag, to, dy })
                }}
                onPointerUp={() => {
                  if (!drag || drag.id !== id) return
                  sfx.tone(160, 0.1, "sine", 0.1, 0, 90)
                  const next = current.filter((x) => x !== id)
                  next.splice(drag.to, 0, id)
                  setDrag(null)
                  if (drag.to !== drag.from) commit(next, id)
                }}
                onPointerCancel={() => setDrag(null)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
                  event.preventDefault()
                  const to = event.key === "ArrowUp" ? slot - 1 : slot + 1
                  if (to < 0 || to > last) {
                    sfx.buzz()
                    return
                  }
                  sfx.tone(1100, 0.03, "triangle", 0.035)
                  const next = current.filter((x) => x !== id)
                  next.splice(to, 0, id)
                  commit(next, id)
                  requestAnimationFrame(() => grips.current.get(id)?.focus())
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="12" r="1" />
                  <circle cx="9" cy="5" r="1" />
                  <circle cx="9" cy="19" r="1" />
                  <circle cx="15" cy="12" r="1" />
                  <circle cx="15" cy="5" r="1" />
                  <circle cx="15" cy="19" r="1" />
                </svg>
              </button>
              <span className="min-w-0 flex-1 truncate text-[length:var(--ns-type-copy)] font-medium">{item.label}</span>
              {item.shortcut && <span className="shrink-0 font-mono text-[11px] text-[var(--muted-foreground)]">{item.shortcut}</span>}
            </li>
          )
        })}
      </ol>
      <Announcer message={message} />
    </>
  )
})

export { DragHandleList, type DragHandleListProps, type DragItem }
