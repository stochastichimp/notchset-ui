"use client"

/**
 * Expanding Search (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/expanding-search
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useComposedRefs, useTimeline } from "@/lib/notchset/shared"
import { useControllable } from "@/lib/notchset/field"
import { typedSound, useSound } from "@/lib/notchset/sound"

/*
 * Expanding Search: a search icon in a header that opens into a field across it, with a swoosh, while
 * whatever sat beside it (a breadcrumb) fades aside. Typing reports the query (highlight matches in your
 * page with it) and shows a match count. The X, Esc or leaving it empty closes it again.
 */

interface ExpandingSearchProps extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  /** How many matches the query has, shown in the field. */
  matches?: number | undefined
  /** What sits in the header beside the icon (a breadcrumb or title); it fades aside while searching. */
  children?: React.ReactNode | undefined
  /** The field's accessible name. Default "Search this page". */
  label?: string | undefined
  placeholder?: string | undefined
  sound?: boolean | undefined
}

const ExpandingSearch = React.forwardRef<HTMLInputElement, ExpandingSearchProps>(function ExpandingSearch(
  { value, defaultValue = "", onValueChange, matches, children, label = "Search this page", placeholder = "Search this page…", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [query, setQuery] = useControllable(value, defaultValue, onValueChange)
  const [open, setOpen] = React.useState(false)
  const inner = React.useRef<HTMLInputElement>(null)
  const refs = useComposedRefs(inner, ref)
  const toggleRef = React.useRef<HTMLButtonElement>(null)

  const expand = () => {
    if (open) {
      inner.current?.focus()
      return
    }
    sfx.swooshIn()
    setOpen(true)
    timeline.after(120, () => inner.current?.focus())
  }
  const collapse = (returnFocus: boolean) => {
    if (!open) return
    sfx.swooshOut()
    setOpen(false)
    setQuery("")
    if (returnFocus) requestAnimationFrame(() => toggleRef.current?.focus())
  }

  return (
    <div data-slot="expanding-search" data-notchset="" className={cn("relative flex h-14 items-center", className)} {...props}>
      <div aria-hidden={open || undefined} className={cn("min-w-0 flex-1 truncate [transition:opacity_.25s,transform_.4s_cubic-bezier(.2,1.15,.3,1),scale_.4s_cubic-bezier(.2,1.15,.3,1),translate_.4s_cubic-bezier(.2,1.15,.3,1),rotate_.4s_cubic-bezier(.2,1.15,.3,1)]", open ? "-translate-x-3 opacity-0 rtl:translate-x-3" : "translate-x-0 opacity-100")}>
        {children}
      </div>
      <div
        className={cn(
          "absolute end-2 top-1/2 flex h-10 -translate-y-1/2 items-center overflow-hidden rounded-[var(--radius)] border bg-[var(--background)] [transition:width_.5s_cubic-bezier(.2,1.15,.3,1),border-color_.2s,box-shadow_var(--ns-time-state)]",
          open ? "w-[calc(100%-16px)] border-[color-mix(in_oklab,var(--foreground)_55%,var(--input))] shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]" : "w-10 border-[var(--border)]"
        )}
      >
        <button
          ref={toggleRef}
          type="button"
          aria-label={open ? label : "Open search"}
          aria-expanded={open}
          onMouseDown={(event) => open && event.preventDefault()}
          onClick={expand}
          className="grid size-[38px] shrink-0 cursor-pointer place-items-center rounded-[var(--radius)] text-[var(--foreground)] outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
        <input
          ref={refs}
          type="search"
          value={query}
          aria-label={label}
          placeholder={placeholder}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open || undefined}
          onChange={(event) => {
            typedSound(sfx, query, event.target.value)
            setQuery(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault()
              collapse(true)
            }
          }}
          onBlur={() =>
            timeline.after(150, () => {
              if (!inner.current?.value && document.activeElement !== inner.current) collapse(false)
            })
          }
          className={cn("h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[length:var(--ns-type-copy)] text-[var(--foreground)] outline-none [transition:opacity_.2s_.1s] placeholder:text-[var(--muted-foreground)] [&::-webkit-search-cancel-button]:hidden pointer-coarse:text-[16px]", open ? "opacity-100" : "opacity-0")}
        />
        {open && query && matches != null && (
          <span role="status" className="shrink-0 animate-[ns-fade-up_.2s_both] px-1.5 font-mono text-[11px] text-[var(--muted-foreground)] tabular-nums">
            <NumberFlow value={matches} /> {matches === 1 ? "match" : "matches"}
          </span>
        )}
        <button
          type="button"
          aria-label="Close search"
          tabIndex={open ? 0 : -1}
          aria-hidden={!open || undefined}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => collapse(true)}
          className={cn("me-1 grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-[var(--radius)] text-[var(--muted-foreground)] outline-none [transition:opacity_.2s] hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]", open ? "opacity-100" : "pointer-events-none opacity-0")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
})

/** Marks every match of `query` in `text` (case-insensitive), for the page body the search looks through. */
function HighlightMatches({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="animate-[ns-fade-up_.2s_both] rounded-[3px] bg-[color-mix(in_oklab,var(--foreground)_16%,transparent)] text-inherit">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  )
}

/** How many times `query` appears in `text` (case-insensitive). */
function countMatches(text: string, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  return text.toLowerCase().split(q).length - 1
}

export { countMatches, ExpandingSearch, HighlightMatches, type ExpandingSearchProps }
