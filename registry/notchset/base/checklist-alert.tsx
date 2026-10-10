"use client"

/**
 * Checklist Alert (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/checklist-alert
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Collapse } from "@/lib/notchset/collapse"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { RollingLabel, Spinner } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Checklist Alert: an amber alert that lists what blocks publishing. Each Fix rolls through a spinner to
 * ✓ Fixed, the row strikes through and folds away with a rising ding, and the count rolls down. When
 * nothing is left the alert turns green, the list folds, and Publish now appears, rolling to ✓ Live.
 */

interface CheckItem {
  id: string
  label: React.ReactNode
}

interface ChecklistAlertProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  items: readonly CheckItem[]
  /** Resolve when the item is fixed. */
  onFix: (item: CheckItem) => Promise<void> | void
  /** Resolve when published. */
  onPublish: () => Promise<void> | void
  /** Shows Start over once published. */
  onReset?: (() => void) | undefined
  /** The line under the title, per state. */
  notes?: { blocked?: React.ReactNode | undefined; ready?: React.ReactNode | undefined; live?: React.ReactNode | undefined } | undefined
  sound?: boolean | undefined
}

const ChecklistAlert = React.forwardRef<HTMLDivElement, ChecklistAlertProps>(function ChecklistAlert({ items, onFix, onPublish, onReset, notes, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const listId = React.useId()
  const [fix, setFix] = React.useState<Record<string, 1 | 2>>({})
  const [open, setOpen] = React.useState(true)
  const [pub, setPub] = React.useState<0 | 1 | 2>(0)
  const left = items.filter((i) => fix[i.id] !== 2).length
  const ok = left === 0
  const tone = ok ? "var(--success,var(--foreground))" : "var(--warning,var(--chart-4))"

  const run = async (item: CheckItem) => {
    if (fix[item.id]) return
    sfx.tick()
    setFix((f) => ({ ...f, [item.id]: 1 }))
    try {
      await onFix(item)
    } catch {
      sfx.buzz()
      setFix(({ [item.id]: _, ...rest }) => rest)
      return
    }
    setFix((f) => {
      const next = { ...f, [item.id]: 2 as const }
      const n = items.filter((i) => next[i.id] === 2).length
      sfx.ding(Math.min(4, n))
      if (n === items.length) window.setTimeout(() => sfx.chime(), 700)
      return next
    })
  }
  const publish = async () => {
    if (pub) return
    sfx.press()
    setPub(1)
    try {
      await onPublish()
      setPub(2)
      sfx.chime()
    } catch {
      sfx.buzz()
      setPub(0)
    }
  }

  return (
    <div ref={ref} data-slot="checklist-alert" data-notchset="" className={cn("flex w-full max-w-[460px] flex-col items-start gap-3", className)} {...props}>
      <div
        role="status"
        className="w-full overflow-hidden rounded-[18px] border text-[var(--foreground)] [transition:background-color_.5s,border-color_.5s]"
        style={{ background: `color-mix(in oklab, ${tone} 10%, var(--background))`, borderColor: `color-mix(in oklab, ${tone} 34%, var(--border))` }}
      >
        <div className="flex min-h-14 items-center gap-3 py-2.5 ps-3.5 pe-2.5">
          <span aria-hidden="true" className="relative size-[22px] shrink-0 [transition:color_.4s]" style={{ color: tone }}>
            <svg viewBox="0 0 24 24" className={cn("absolute inset-0 [transition:opacity_.25s,scale_.45s_var(--ns-ease-rebound)]", ok ? "scale-[.4] opacity-0" : "scale-100 opacity-100")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            <svg viewBox="0 0 24 24" className={cn("absolute inset-0 [transition:opacity_.25s,scale_.45s_var(--ns-ease-rebound)]", ok ? "scale-100 opacity-100" : "scale-[.4] opacity-0")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12.5 2.5 2.5L16 9.5" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="text-[length:var(--ns-type-copy)] font-semibold">
              <RollingLabel
                index={pub === 2 ? 2 : ok ? 1 : 0}
                align="start"
                rows={[
                  <React.Fragment key="n">
                    <NumberFlow value={left} /> {left === 1 ? "thing" : "things"} to fix<span className="max-[480px]:hidden">&nbsp;before publishing</span>
                  </React.Fragment>,
                  <React.Fragment key="r">Ready to publish</React.Fragment>,
                  <React.Fragment key="p">✓ Published</React.Fragment>,
                ]}
              />
            </span>
            <span className="text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
              {pub === 2 ? (notes?.live ?? "It's live.") : ok ? (notes?.ready ?? "All checks passed. It goes out as scheduled.") : (notes?.blocked ?? "Fix these and it goes out as scheduled.")}
            </span>
          </span>
          <button
            type="button"
            aria-expanded={open && !ok}
            aria-controls={listId}
            aria-label="Toggle details"
            tabIndex={ok ? -1 : 0}
            onClick={() => {
              if (ok) return
              if (open) sfx.close()
              else sfx.open()
              setOpen(!open)
            }}
            className={cn("grid size-[var(--ns-control-compact)] shrink-0 cursor-pointer place-items-center rounded-full outline-none [transition:background-color_.2s,opacity_.2s] hover:bg-[color-mix(in_oklab,currentColor_10%,transparent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", ok ? "pointer-events-none opacity-0" : "opacity-70")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-4 [transition:rotate_.45s_var(--ns-ease-pop)]", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
        <Collapse id={listId} open={open && !ok} delay={ok ? 900 : 0}>
          <ul className="m-0 flex list-none flex-col ps-12 pe-2.5 pb-2.5">
            {items.map((it) => {
              const f = fix[it.id] ?? 0
              return (
                <li key={it.id}>
                  <Collapse open={f !== 2} delay={f === 2 ? 500 : 0}>
                    <div className="flex min-h-11 items-center gap-2.5 border-t border-[color-mix(in_oklab,var(--warning,var(--chart-4))_22%,var(--border))]">
                      <span className={cn("flex-1 text-[length:var(--ns-type-label)] [transition:color_.3s]", f === 2 ? "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] line-through" : "text-[var(--foreground)]")}>{it.label}</span>
                      <button
                        type="button"
                        aria-busy={f === 1 || undefined}
                        onClick={() => void run(it)}
                        className={cn("inline-flex h-[30px] min-w-16 cursor-pointer items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-note)] font-medium outline-none [transition:color_.3s,scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.94]", f === 2 ? "text-[var(--success,var(--foreground))]" : "text-[var(--foreground)]")}
                      >
                        <RollingLabel
                          index={f}
                          size="sm"
                          rows={[
                            <React.Fragment key="f">Fix</React.Fragment>,
                            <Spinner key="s" className="size-3" />,
                            <React.Fragment key="d">✓ Fixed</React.Fragment>,
                          ]}
                        />
                      </button>
                    </div>
                  </Collapse>
                </li>
              )
            })}
          </ul>
        </Collapse>
        <Collapse open={ok && pub < 2} delay={ok && pub === 0 ? 1000 : 0}>
          <div className="ps-12 pe-2.5 pb-3">
            <button
              type="button"
              aria-busy={pub === 1 || undefined}
              onClick={() => void publish()}
              className="inline-flex h-[34px] cursor-pointer items-center rounded-[var(--radius)] bg-[var(--success,var(--foreground))] px-4 text-[length:var(--ns-type-label)] font-medium text-[var(--success-foreground,var(--background))] outline-none [transition:scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95"
            >
              <RollingLabel
                index={pub}
                size="sm"
                rows={[
                  <React.Fragment key="a">Publish now</React.Fragment>,
                  <React.Fragment key="b">
                    <Spinner className="size-3" />
                    Publishing
                  </React.Fragment>,
                  <React.Fragment key="c">✓ Live</React.Fragment>,
                ]}
              />
            </button>
          </div>
        </Collapse>
      </div>
      {onReset && (
        <button
          type="button"
          tabIndex={pub === 2 ? 0 : -1}
          onClick={() => {
            if (pub !== 2) return
            sfx.drop()
            setFix({})
            setOpen(true)
            setPub(0)
            onReset()
          }}
          className={cn("h-[30px] cursor-pointer rounded-[var(--radius)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-note)] font-medium text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] outline-none [transition:opacity_var(--ns-time-state),background-color_.2s] hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", pub === 2 ? "opacity-100" : "pointer-events-none opacity-0")}
        >
          Start over
        </button>
      )}
    </div>
  )
})

export { ChecklistAlert, type CheckItem, type ChecklistAlertProps }
