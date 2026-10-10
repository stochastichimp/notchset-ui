"use client"

/**
 * Bookmark Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/bookmark-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, RollingLabel, spoken } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Bookmark: saving drops a filled ribbon into place like it was pulled down, with a paper flick; the
 * label rolls to where it went. Unsaving springs the outline back.
 */

interface BookmarkButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  saved?: boolean | undefined
  defaultSaved?: boolean | undefined
  onSavedChange?: ((saved: boolean) => void) | undefined
  label?: React.ReactNode | undefined
  savedLabel?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const RIBBON = "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"

const BookmarkButton = React.forwardRef<HTMLButtonElement, BookmarkButtonProps>(function BookmarkButton(
  { saved, defaultSaved = false, onSavedChange, label = "Bookmark", savedLabel = "Saved to Reading", sound = true, disabled, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [inner, setInner] = React.useState(defaultSaved)
  const on = saved ?? inner
  const [presses, setPresses] = React.useState(0)

  const toggle = () => {
    const next = !on
    if (next) sfx.paper()
    else sfx.drop()
    setPresses((n) => n + 1)
    if (saved === undefined) setInner(next)
    onSavedChange?.(next)
  }

  return (
    <button
      ref={ref}
      type="button"
      data-slot="bookmark-button"
      data-notchset=""
      aria-pressed={on}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-11 w-[192px] max-w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className="relative block size-4 shrink-0">
        <svg
          key={`${on}-${presses}`}
          viewBox="0 0 24 24"
          className={cn("absolute inset-0 size-4 origin-[50%_0]", presses > 0 && (on ? "animate-[ns-ribbon_.6s_cubic-bezier(.3,.7,.4,1)]" : "animate-[ns-ribbon-up_.35s_ease-out]"))}
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={RIBBON} />
        </svg>
      </span>
      <RollingLabel index={on ? 1 : 0} rows={[label, savedLabel]} />
      <Announcer message={presses > 0 ? (on ? spoken(savedLabel, "Saved") : "Removed") : ""} />
    </button>
  )
})

export { BookmarkButton, type BookmarkButtonProps }
