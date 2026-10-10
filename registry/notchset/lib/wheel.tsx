"use client"

import * as React from "react"

/*
 * The wheel column's behaviour, shared by every reel (the time picker's hours and minutes, the send-later
 * reels): a non-passive wheel listener that steps once per 28px, a drag that follows the pointer 1:1 and
 * springs to the slot on release, a tap that jumps to the row under it, and the arrow, page, Home and End
 * keys. Each component draws its own rows and slab; this gives it the offset to translate them by.
 */

interface WheelOptions {
  count: number
  index: number
  onIndex: (i: number) => void
  /** One row's pitch, gap included. */
  row: number
  /** Where the selected row's top sits inside the column. */
  slabTop: number
  /** A detent: called once for every row passed. */
  onDetent?: ((i: number) => void) | undefined
}

function useWheel({ count, index, onIndex, row, slabTop, onDetent }: WheelOptions) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [drag, setDrag] = React.useState<{ y0: number; top: number; i0: number; dy: number; moved: boolean } | null>(null)
  const latest = React.useRef({ index, onIndex, count, onDetent })
  React.useEffect(() => {
    latest.current = { index, onIndex, count, onDetent }
  })

  const go = React.useCallback((i: number) => {
    const { index: cur, onIndex: set, count: n, onDetent: detent } = latest.current
    const next = Math.max(0, Math.min(n - 1, i))
    if (next === cur) return
    detent?.(next)
    latest.current.index = next
    set(next)
  }, [])

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    let acc = 0
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      acc += event.deltaY
      while (Math.abs(acc) >= 28) {
        const step = Math.sign(acc)
        acc -= step * 28
        go(latest.current.index + step)
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [go])

  const offset = drag ? Math.max(slabTop - (count - 1) * row - 24, Math.min(slabTop + 24, slabTop - drag.i0 * row + drag.dy)) : slabTop - index * row

  const props = {
    ref,
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      event.currentTarget.focus({ preventScroll: true })
      setDrag({ y0: event.clientY, top: event.currentTarget.getBoundingClientRect().top, i0: index, dy: 0, moved: false })
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      if (!drag) return
      const dy = event.clientY - drag.y0
      setDrag({ ...drag, dy, moved: drag.moved || Math.abs(dy) > 4 })
      go(drag.i0 - Math.round(dy / row))
    },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      if (!drag) return
      // A tap (under 4px of travel) jumps to the row under the pointer.
      if (!drag.moved) go(drag.i0 + Math.round((event.clientY - drag.top - slabTop - row / 2) / row))
      setDrag(null)
    },
    onPointerCancel: () => setDrag(null),
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
      const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : event.key === "PageDown" ? 5 : event.key === "PageUp" ? -5 : 0
      if (event.key === "Home") go(0)
      else if (event.key === "End") go(count - 1)
      else if (step) go(index + step)
      else return
      event.preventDefault()
    },
  }

  return { props, offset, dragging: drag !== null, go }
}

export { useWheel, type WheelOptions }
