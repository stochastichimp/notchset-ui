"use client"

/**
 * Checklist (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/checklist
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, DrawCheck, inertRef } from "@/lib/notchset/shared"
import { Ring } from "@/lib/notchset/progress"
import { useSound } from "@/lib/notchset/sound"

/*
 * Checklist: steps down a spine. The active step's node pulses with a halo and its body opens with a
 * description and Mark done / Skip; finishing one draws a green check, fills the spine below it and
 * plays the next note of a rising scale. A small ring in the header tracks the total.
 */

type ItemState = "todo" | "done" | "skipped"

interface ChecklistItem {
  id: string
  title: string
  description?: React.ReactNode | undefined
}

interface ChecklistProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange" | "title" | "defaultValue"> {
  items: readonly ChecklistItem[]
  title?: React.ReactNode | undefined
  /** States by id; uncontrolled when omitted. */
  value?: Readonly<Record<string, ItemState>> | undefined
  defaultValue?: Readonly<Record<string, ItemState>> | undefined
  onValueChange?: ((value: Record<string, ItemState>) => void) | undefined
  sound?: boolean | undefined
}

const Checklist = React.forwardRef<HTMLDivElement, ChecklistProps>(function Checklist({ items, title = "Get set up", value, defaultValue = {}, onValueChange, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [inner, setInner] = React.useState<Record<string, ItemState>>({ ...defaultValue })
  const states = (value ?? inner) as Record<string, ItemState>
  const set = (next: Record<string, ItemState>) => {
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }
  const stateOf = (id: string) => states[id] ?? "todo"
  const active = items.findIndex((it) => stateOf(it.id) === "todo")
  const doneCount = items.filter((it) => stateOf(it.id) === "done").length
  const settled = items.filter((it) => stateOf(it.id) !== "todo").length
  const all = items.length > 0 && active === -1

  const mark = (id: string, state: ItemState) => {
    const next = { ...states, [id]: state }
    set(next)
    const finished = items.filter((it) => next[it.id] === "done").length
    if (state === "done") sfx.ding(Math.min(4, finished - 1))
    else sfx.drop()
    if (items.every((it) => (next[it.id] ?? "todo") !== "todo")) setTimeout(() => sfx.chime(), 200)
  }

  return (
    <div ref={ref} data-slot="checklist" data-notchset="" className={cn("flex w-full flex-col gap-4", className)} {...props}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)]">{title}</span>
          <span className="font-mono text-[11px] whitespace-nowrap text-[var(--muted-foreground)]">
            {doneCount} of {items.length} complete
          </span>
        </div>
        <Ring value={items.length ? settled / items.length : 0} size={30} stroke={3} className={all ? "stroke-[var(--success,var(--foreground))]" : "stroke-[var(--foreground)]"} />
      </div>
      <ol className="m-0 flex list-none flex-col p-0">
        {items.map((it, i) => {
          const state = stateOf(it.id)
          const isActive = i === active
          const last = i === items.length - 1
          return (
            <li key={it.id} aria-current={isActive ? "step" : undefined} className="grid grid-cols-[22px_minmax(0,1fr)] gap-x-3.5">
              <span className="relative flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] [transition:background-color_.3s,border-color_var(--ns-time-state)]",
                    state === "done" && "border-[var(--success,var(--foreground))] bg-[var(--success,var(--foreground))] text-[var(--success-foreground,var(--background))]",
                    state === "skipped" && "border-dashed border-[var(--warning,var(--border))]",
                    state === "todo" && isActive && "border-[var(--foreground)]",
                    state === "todo" && !isActive && "border-[var(--border)]"
                  )}
                >
                  {state === "done" && <DrawCheck shown className="size-3" />}
                  {isActive && (
                    <>
                      <span className="size-2 animate-[ns-pulse_1.4s_ease-in-out_infinite] rounded-full bg-[var(--foreground)]" />
                      <span className="absolute -inset-[5px] animate-[ns-halo_1.6s_ease-out_infinite] rounded-full border border-[var(--foreground)]" />
                    </>
                  )}
                </span>
                {!last && (
                  <span aria-hidden="true" className="relative my-1 w-0.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                    <span className="absolute inset-x-0 top-0 bg-[var(--foreground)] [transition:height_.5s_var(--ns-ease-settle)]" style={{ height: state === "done" ? "100%" : "0%" }} />
                  </span>
                )}
              </span>
              <div className={cn("flex min-w-0 flex-col", last ? "pb-0" : "pb-5")}>
                <span className={cn("text-[length:var(--ns-type-copy)] leading-[22px] font-medium [transition:color_.3s]", state === "todo" && !isActive ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]")}>
                  {it.title}
                  <span className="sr-only">{state === "done" ? ", done" : state === "skipped" ? ", skipped" : isActive ? ", current" : ""}</span>
                </span>
                <div className={cn("grid [transition:grid-template-rows_.45s_var(--ns-ease-settle)]", isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden" ref={inertRef(!isActive)}>
                    {it.description != null && <p className="m-0 mt-1 text-[length:var(--ns-type-label)] leading-5 text-[var(--muted-foreground)]">{it.description}</p>}
                    <div className="flex gap-2 pt-3 pb-1">
                      <button
                        type="button"
                        onClick={() => mark(it.id, "done")}
                        className="inline-flex h-[var(--ns-control-compact)] cursor-pointer items-center rounded-[var(--radius)] bg-[var(--primary)] px-3.5 text-[length:var(--ns-type-label)] font-medium text-[var(--primary-foreground)] outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                      >
                        Mark done
                      </button>
                      <button
                        type="button"
                        onClick={() => mark(it.id, "skipped")}
                        className="inline-flex h-[var(--ns-control-compact)] cursor-pointer items-center rounded-[var(--radius)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-label)] font-medium text-[var(--muted-foreground)] outline-none hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      {all && (
        <button
          type="button"
          onClick={() => {
            sfx.stepBack(0)
            set({})
          }}
          className="inline-flex h-[var(--ns-control-compact)] w-fit animate-[ns-fade-up_.3s_both] cursor-pointer items-center rounded-[var(--radius)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-label)] font-medium text-[var(--muted-foreground)] outline-none hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          Start over
        </button>
      )}
      <Announcer message={`${doneCount} of ${items.length} complete`} />
    </div>
  )
})

export { Checklist, type ChecklistItem, type ChecklistProps }
