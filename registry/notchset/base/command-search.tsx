"use client"

/**
 * Command Search (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/command-search
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useComposedRefs, useTimeline } from "@/lib/notchset/shared"
import { FieldIconButton, FieldShell, useControllable } from "@/lib/notchset/field"
import { typedSound, useSound } from "@/lib/notchset/sound"

/*
 * Command Search: a combobox that ⌘K / Ctrl+K focuses from anywhere. The icon turns into a spinner
 * while the query settles, the results drop in under the field with the matched part in bold, and one
 * highlight slides between rows as ↑ ↓ (or the pointer) move. Enter opens the highlighted result; Esc
 * closes the list, then clears.
 */

interface CommandResult {
  id: string
  label: string
  /** A mono line under the label. */
  meta?: string | undefined
}

interface CommandSearchProps extends Omit<React.ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange" | "onSelect" | "size"> {
  /** Results for a query (sync or async). Up to five are shown. */
  search: (query: string) => readonly CommandResult[] | Promise<readonly CommandResult[]>
  onSelect?: ((result: CommandResult) => void) | undefined
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  /** The field's accessible name. Default "Search". */
  label?: string | undefined
  /** ⌘K / Ctrl+K focuses it from anywhere. Default true. */
  hotkey?: boolean | undefined
  /** Settle time before searching (ms). Default 240. */
  debounce?: number | undefined
  empty?: ((query: string) => React.ReactNode) | undefined
  sound?: boolean | undefined
}

const ROW = 48
const MAX = 5

function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (at < 0) return <span className="text-[var(--muted-foreground)]">{text}</span>
  return (
    <span className="text-[var(--muted-foreground)]">
      {text.slice(0, at)}
      <span className="font-semibold text-[var(--foreground)]">{text.slice(at, at + query.length)}</span>
      {text.slice(at + query.length)}
    </span>
  )
}

const CommandSearch = React.forwardRef<HTMLInputElement, CommandSearchProps>(function CommandSearch(
  { search, onSelect, value, defaultValue = "", onValueChange, label = "Search", hotkey = true, debounce = 240, empty = (q) => `No results for “${q}”`, sound = true, placeholder = "Search…", className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [query, setQuery] = useControllable(value, defaultValue, onValueChange)
  const [results, setResults] = React.useState<readonly CommandResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const inner = React.useRef<HTMLInputElement>(null)
  const refs = useComposedRefs(inner, ref)
  const run = React.useRef(0)
  const listId = React.useId()

  React.useEffect(() => {
    if (!hotkey) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        sfx.tick()
        inner.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [hotkey, sfx])

  const look = (next: string) => {
    const id = ++run.current
    timeline.clear()
    if (!next.trim()) {
      setLoading(false)
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    setOpen(true)
    timeline.after(debounce, () => {
      void Promise.resolve(search(next.trim())).then((found) => {
        if (id !== run.current) return
        setResults(found.slice(0, MAX))
        setActive(0)
        setLoading(false)
      })
    })
  }

  const pick = (result: CommandResult | undefined) => {
    if (!result) return
    sfx.pop()
    setQuery(result.label)
    setOpen(false)
    onSelect?.(result)
  }

  const showList = open && !loading
  const activeId = showList && results[active] ? `${listId}-${results[active]!.id}` : undefined
  return (
    <div data-slot="command-search" data-notchset="" className={cn("relative w-full", className)}>
      <FieldShell focused={focused} className="gap-2.5 ps-3.5">
        <span aria-hidden="true" className="relative grid size-4 shrink-0 place-items-center text-[var(--muted-foreground)]">
          <svg viewBox="0 0 24 24" className={cn("absolute size-4 [transition:opacity_.15s]", loading ? "opacity-0" : "opacity-100")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <svg viewBox="0 0 24 24" className={cn("absolute size-3.5 animate-[ns-spin_.7s_linear_infinite] [transition:opacity_.15s]", loading ? "opacity-100" : "opacity-0")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" className="[stroke-dasharray:20_40]" />
          </svg>
        </span>
        <input
          ref={refs}
          role="combobox"
          aria-label={label}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder={placeholder}
          aria-keyshortcuts={hotkey ? "Meta+K Control+K" : undefined}
          onFocus={() => {
            setFocused(true)
            sfx.focus()
          }}
          onBlur={() => {
            setFocused(false)
            timeline.after(120, () => setOpen(false))
          }}
          onChange={(event) => {
            typedSound(sfx, query, event.target.value)
            setQuery(event.target.value)
            look(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return
            const n = results.length
            if (event.key === "ArrowDown" && n) {
              event.preventDefault()
              sfx.tone(1300, 0.02, "triangle", 0.03)
              setOpen(true)
              setActive((i) => (i + 1) % n)
            } else if (event.key === "ArrowUp" && n) {
              event.preventDefault()
              sfx.tone(1200, 0.02, "triangle", 0.03)
              setActive((i) => (i - 1 + n) % n)
            } else if (event.key === "Enter" && showList && n) {
              event.preventDefault()
              pick(results[active])
            } else if (event.key === "Escape") {
              event.preventDefault()
              sfx.drop()
              if (open) setOpen(false)
              else {
                setQuery("")
                look("")
              }
            }
          }}
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[length:var(--ns-type-copy)] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] pointer-coarse:text-[16px]"
          {...props}
        />
        {query ? (
          <FieldIconButton
            aria-label="Clear search"
            onClick={() => {
              sfx.clear()
              setQuery("")
              look("")
              inner.current?.focus()
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </FieldIconButton>
        ) : (
          hotkey && <kbd aria-hidden="true" className="me-1.5 rounded-[5px] border border-[var(--border)] px-1.5 font-mono text-[11px] leading-5 text-[var(--muted-foreground)]">⌘K</kbd>
        )}
      </FieldShell>
      <div
        className={cn(
          "absolute inset-x-0 top-[calc(100%+6px)] z-20 origin-top rounded-[calc(min(var(--radius),14px)+5px)] border border-[var(--border)] bg-[var(--background)] p-[5px] shadow-[0_16px_36px_-14px_rgba(0,0,0,.22),0_2px_6px_-2px_rgba(0,0,0,.06)] [transition:opacity_.2s,transform_.32s_var(--ns-ease-reshape),scale_.32s_var(--ns-ease-reshape),translate_.32s_var(--ns-ease-reshape),rotate_.32s_var(--ns-ease-reshape)]",
          showList ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[.98] opacity-0"
        )}
      >
        <ul id={listId} role="listbox" aria-label={label} className="relative m-0 list-none p-0">
          {results.length > 0 && (
            <li
              aria-hidden="true"
              role="presentation"
              className="pointer-events-none absolute inset-x-0 top-0 h-12 rounded-[min(var(--radius),14px)] bg-[var(--accent)] [transition:transform_.32s_var(--ns-ease-reshape),scale_.32s_var(--ns-ease-reshape),translate_.32s_var(--ns-ease-reshape),rotate_.32s_var(--ns-ease-reshape)]"
              style={{ transform: `translateY(${active * ROW}px)` }}
            />
          )}
          {results.map((result, i) => (
            <li
              key={result.id}
              id={`${listId}-${result.id}`}
              role="option"
              aria-selected={i === active}
              onPointerMove={() => setActive(i)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(result)}
              className="relative flex h-12 cursor-pointer items-center justify-between gap-3 px-3"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[length:var(--ns-type-copy)] leading-5">
                  <Highlight text={result.label} query={query.trim()} />
                </span>
                {result.meta && <span className="truncate font-mono text-[11px] leading-4 text-[var(--muted-foreground)]">{result.meta}</span>}
              </span>
              <span aria-hidden="true" className={cn("font-mono text-[11px] text-[var(--muted-foreground)] [transition:opacity_.15s]", i === active ? "opacity-100" : "opacity-0")}>
                ↵
              </span>
            </li>
          ))}
        </ul>
        {results.length === 0 && query.trim() && (
          <p role="status" className="m-0 px-3 py-3 text-[length:var(--ns-type-label)] text-[var(--muted-foreground)]">
            {empty(query.trim())}
          </p>
        )}
      </div>
    </div>
  )
})

export { CommandSearch, type CommandResult, type CommandSearchProps }
