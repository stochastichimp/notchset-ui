"use client"

/**
 * Inline Edit (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/inline-edit
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, Spinner, useTimeline } from "@/lib/notchset/shared"
import { useControllable } from "@/lib/notchset/field"
import { typedSound, useSound } from "@/lib/notchset/sound"

/*
 * Inline Edit: a title you edit in place. The input has the same type and padding as the title, so
 * nothing moves when it opens. Enter or leaving the field saves (a spinner, then a check that pops in),
 * Esc rewinds, an empty title shakes and stays open, an unchanged one closes quietly.
 */

type EditState = "view" | "edit" | "saving" | "saved"

interface InlineEditProps extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "onError"> {
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  /** Saves a changed title. Return a promise: the check shows only when it resolves. */
  onSave?: ((value: string) => unknown) | undefined
  onError?: ((error: unknown) => void) | undefined
  /** Called as the success state shows (after the work resolves and the minimum time), so anything that follows the button lands with it. */
  onSuccess?: (() => void) | undefined
  /** The accessible name of the field, e.g. "Project name". */
  label: string
  sound?: boolean | undefined
}

const InlineEdit = React.forwardRef<HTMLDivElement, InlineEditProps>(function InlineEdit(
  { value, defaultValue = "", onValueChange, onSave, onError, onSuccess, label, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [title, setTitle] = useControllable(value, defaultValue, onValueChange)
  const [state, setState] = React.useState<EditState>("view")
  const [draft, setDraft] = React.useState(title)
  const [shakes, setShakes] = React.useState(0)
  const [hover, setHover] = React.useState(false)
  const input = React.useRef<HTMLInputElement>(null)
  const trigger = React.useRef<HTMLButtonElement>(null)
  const committing = React.useRef(false)
  const hintId = React.useId()

  React.useEffect(() => {
    if (state !== "edit") return
    input.current?.focus()
    input.current?.select()
  }, [state])

  const open = () => {
    sfx.tick()
    setDraft(title)
    setState("edit")
  }

  const commit = async () => {
    if (committing.current || state !== "edit") return
    const next = draft.trim()
    if (!next) {
      sfx.buzz()
      setShakes((n) => n + 1)
      input.current?.focus()
      return
    }
    if (next === title) {
      setState("view")
      return
    }
    committing.current = true
    const previous = title
    setTitle(next)
    setState("saving")
    try {
      await onSave?.(next)
    } catch (error) {
      committing.current = false
      setTitle(previous)
      sfx.buzz()
      setShakes((n) => n + 1)
      setDraft(next)
      setState("edit")
      onError?.(error)
      return
    }
    committing.current = false
    sfx.chime()
    onSuccess?.()
    setState("saved")
    timeline.after(1800, () => setState((s) => (s === "saved" ? "view" : s)))
  }

  const cancel = () => {
    sfx.noise(0.25, 0.05, 2600, 500)
    setDraft(title)
    setState("view")
    requestAnimationFrame(() => trigger.current?.focus())
  }

  const editing = state === "edit"
  return (
    <div ref={ref} data-slot="inline-edit" data-notchset="" className={cn("flex flex-col gap-1.5", className)} {...props}>
      <div className={cn("flex min-h-[46px] items-center gap-2", shakes > 0 && (shakes % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]"))}>
        {editing ? (
          <input
            ref={input}
            value={draft}
            aria-label={label}
            aria-describedby={hintId}
            onChange={(event) => {
              typedSound(sfx, draft, event.target.value)
              setDraft(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return
              if (event.key === "Enter") {
                event.preventDefault()
                void commit()
              } else if (event.key === "Escape") {
                event.preventDefault()
                cancel()
              }
            }}
            onBlur={() => void commit()}
            className="-ms-2.5 min-w-0 flex-1 rounded-[min(var(--radius),12px)] border-0 bg-[var(--background)] px-2.5 py-1 text-[26px] leading-[1.3] font-semibold tracking-[-0.03em] text-[var(--foreground)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_50%,var(--input)),0_0_0_5px_color-mix(in_oklab,var(--foreground)_7%,transparent)] outline-none"
          />
        ) : (
          <button
            ref={trigger}
            type="button"
            aria-label={`${label}: ${title}. Edit`}
            onClick={open}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => setHover(false)}
            className="-ms-2.5 flex min-w-0 cursor-text items-center gap-2.5 rounded-[min(var(--radius),12px)] px-2.5 py-1 text-start text-[26px] leading-[1.3] font-semibold tracking-[-0.03em] text-[var(--foreground)] outline-none [transition:background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            <span className="min-w-0 truncate">{title}</span>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={cn("size-4 shrink-0 text-[var(--muted-foreground)] [transition:opacity_.2s,transform_.35s_var(--ns-ease-pop),scale_.35s_var(--ns-ease-pop),translate_.35s_var(--ns-ease-pop),rotate_.35s_var(--ns-ease-pop)]", hover ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 rtl:translate-x-1")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
            </svg>
          </button>
        )}
        <span aria-hidden="true" className="grid size-[18px] shrink-0 place-items-center">
          {state === "saving" && <Spinner />}
          {state === "saved" && (
            <span className="grid size-[18px] animate-[ns-chip_.4s_var(--ns-ease-rebound)_both] place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)]">
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          )}
        </span>
      </div>
      <p id={hintId} className={cn("m-0 font-mono text-[11px] text-[var(--muted-foreground)] [transition:opacity_.2s]", editing ? "opacity-100" : "opacity-0")}>
        ↵ save · esc cancel
      </p>
      <Announcer message={state === "saved" ? "Saved" : ""} />
    </div>
  )
})

export { InlineEdit, type InlineEditProps }
