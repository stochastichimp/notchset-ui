"use client"

/**
 * Regenerate Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/regenerate-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { Announcer, inertRef, RollingLabel, useTimeline, wait } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Regenerate: a response card with a toolbar. Regenerating spins the refresh icon a full turn, blurs the
 * old draft and, when the new one arrives, fades it in word by word. Earlier drafts stay one click away
 * in a pager; up to `maxDrafts` are kept, after which the next one in rotation is replaced.
 */

interface RegenerateButtonProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title" | "children"> {
  /** The first draft (and any earlier ones), oldest first. */
  defaultDrafts?: readonly string[] | undefined
  /** Writes the next draft. Resolve with its text; reject to keep the current one. */
  onRegenerate: () => Promise<string>
  /** Called with the draft that's showing whenever it changes. */
  onDraftChange?: ((text: string, index: number) => void) | undefined
  /** The card's header, e.g. what the text is. */
  title?: React.ReactNode | undefined
  /** Drafts kept for the pager. Default 4. */
  maxDrafts?: number | undefined
  label?: React.ReactNode | undefined
  workingLabel?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const RegenerateButton = React.forwardRef<HTMLDivElement, RegenerateButtonProps>(function RegenerateButton(
  { defaultDrafts = [], onRegenerate, onDraftChange, title = "Response", maxDrafts = 4, label = "Regenerate", workingLabel = "Writing", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [drafts, setDrafts] = React.useState<string[]>(() => defaultDrafts.slice(-maxDrafts))
  const [current, setCurrent] = React.useState(Math.max(0, Math.min(defaultDrafts.length, maxDrafts) - 1))
  const [working, setWorking] = React.useState(false)
  const [turns, setTurns] = React.useState(0)
  const [version, setVersion] = React.useState(0)
  const [failed, setFailed] = React.useState(0)
  const text = drafts[current] ?? ""
  const words = text.split(" ")

  const show = (index: number, list = drafts) => {
    setCurrent(index)
    setVersion((n) => n + 1)
    onDraftChange?.(list[index] ?? "", index)
  }

  const regenerate = async () => {
    if (working) return
    sfx.regen()
    setWorking(true)
    setTurns((n) => n + 1)
    try {
      const [next] = await Promise.all([onRegenerate(), wait(900)])
      let list: string[]
      let index: number
      if (drafts.length < maxDrafts) {
        list = [...drafts, next]
        index = list.length - 1
      } else {
        index = (current + 1) % maxDrafts
        list = drafts.map((d, i) => (i === index ? next : d))
      }
      setDrafts(list)
      show(index, list)
      sfx.words()
    } catch {
      sfx.buzz()
      setFailed((n) => n + 1)
      timeline.after(2400, () => setFailed(0))
    } finally {
      setWorking(false)
    }
  }

  const page = (step: -1 | 1) => {
    const index = current + step
    if (working || index < 0 || index >= drafts.length) return
    sfx.tick()
    show(index)
  }

  const paged = drafts.length > 1

  return (
    <div ref={ref} data-slot="regenerate-button" data-notchset="" className={cn("flex w-full max-w-[320px] flex-col gap-3", className)} {...props}>
      <div data-slot="regenerate-card" className="flex min-h-[100px] flex-col gap-2 rounded-[min(var(--radius),16px)] border border-[var(--border)] bg-[var(--background)] px-4 py-3.5">
        <span className="flex justify-between gap-3 font-mono text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
          <span className="truncate">{title}</span>
          <span className="shrink-0">{working ? "Writing…" : failed ? "Couldn't write" : `Draft ${current + 1}`}</span>
        </span>
        <div aria-busy={working} className={cn("text-[length:var(--ns-type-copy)] leading-[var(--ns-leading-prose)] text-pretty text-[var(--foreground)] [transition:filter_.3s,opacity_var(--ns-time-state)]", working ? "opacity-35 blur-[4px]" : "opacity-100 blur-none")}>
          <span key={version}>
            {words.map((word, i) => (
              <span key={i} className="inline-block animate-[ns-word_.45s_cubic-bezier(.2,.8,.2,1)_both] whitespace-pre motion-reduce:animate-none" style={{ animationDelay: `${i * 22}ms` }}>
                {i < words.length - 1 ? `${word} ` : word}
              </span>
            ))}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div
          ref={inertRef(!paged)}
          className={cn("flex items-center gap-0.5 [transition:opacity_var(--ns-time-state),transform_.45s_var(--ns-ease-reshape),scale_.45s_var(--ns-ease-reshape),translate_.45s_var(--ns-ease-reshape),rotate_.45s_var(--ns-ease-reshape)]", paged ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 rtl:translate-x-2")}
        >
          <button
            type="button"
            aria-label="Previous draft"
            aria-disabled={current <= 0}
            onClick={() => page(-1)}
            className={cn("grid size-[30px] cursor-pointer place-items-center rounded-[var(--radius)] text-[var(--foreground)] outline-none [transition:background-color_.15s,transform_.15s,scale_.15s,translate_.15s,rotate_.15s,opacity_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.88]", current <= 0 && "opacity-35")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px] rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span className="min-w-10 text-center font-mono text-[length:var(--ns-type-note)] text-[var(--foreground)] tabular-nums">
            <NumberFlow value={`${current + 1} / ${drafts.length}`} />
          </span>
          <button
            type="button"
            aria-label="Next draft"
            aria-disabled={current >= drafts.length - 1}
            onClick={() => page(1)}
            className={cn("grid size-[30px] cursor-pointer place-items-center rounded-[var(--radius)] text-[var(--foreground)] outline-none [transition:background-color_.15s,transform_.15s,scale_.15s,translate_.15s,rotate_.15s,opacity_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.88]", current >= drafts.length - 1 && "opacity-35")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px] rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          aria-disabled={working}
          onClick={regenerate}
          className="inline-flex h-9 w-[150px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3.5 text-[length:var(--ns-type-label)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-[15px] shrink-0 [transition:transform_.9s_cubic-bezier(.3,0,.2,1),scale_.9s_cubic-bezier(.3,0,.2,1),translate_.9s_cubic-bezier(.3,0,.2,1),rotate_.9s_cubic-bezier(.3,0,.2,1)] motion-reduce:transition-none"
            style={{ transform: `rotate(${turns * 360}deg)` }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          <RollingLabel index={working ? 1 : 0} rows={[label, workingLabel]} />
        </button>
      </div>
      <Announcer message={working ? "Writing a new draft" : failed ? "Couldn't write a new draft" : version > 0 ? `Draft ${current + 1} of ${drafts.length}: ${text}` : ""} />
    </div>
  )
})

export { RegenerateButton, type RegenerateButtonProps }
