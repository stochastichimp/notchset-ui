"use client"

/**
 * Tag Input (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/tag-input
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { Announcer, useComposedRefs } from "@/lib/notchset/shared"
import { FieldLabel, useControllable } from "@/lib/notchset/field"
import { typedSound, useSound } from "@/lib/notchset/sound"

/*
 * Tag Input: Enter or a comma turns the text into a chip that pops in, each one a note higher. A
 * duplicate shakes the chip it repeats; a full set buzzes. Backspace in an empty field marks the last
 * chip, a second Backspace removes it. Suggestions below add with one press.
 */

interface TagInputProps extends Omit<React.ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange" | "size"> {
  label: React.ReactNode
  value?: readonly string[] | undefined
  defaultValue?: readonly string[] | undefined
  onValueChange?: ((tags: string[]) => void) | undefined
  /** The most tags. Default 6. */
  max?: number | undefined
  suggestions?: readonly string[] | undefined
  sound?: boolean | undefined
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(function TagInput(
  { label, value, defaultValue = [], onValueChange, max = 6, suggestions = [], sound = true, id, className, placeholder, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [tags, setTags] = useControllable<readonly string[]>(value, defaultValue, onValueChange as ((t: readonly string[]) => void) | undefined)
  const [text, setText] = React.useState("")
  const [marked, setMarked] = React.useState(false)
  const [shake, setShake] = React.useState<{ tag: string; n: number } | null>(null)
  const [focused, setFocused] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const inner = React.useRef<HTMLInputElement>(null)
  const refs = useComposedRefs(inner, ref)
  const autoId = React.useId()
  const inputId = id ?? autoId
  const limit = Math.max(1, Math.floor(max))

  const add = (raw: string) => {
    const tag = raw.replace(/,/g, "").trim().toLowerCase()
    if (!tag) return
    if (tags.includes(tag)) {
      sfx.buzz()
      setShake((s) => ({ tag, n: (s?.n ?? 0) + 1 }))
      setText("")
      return
    }
    if (tags.length >= limit) {
      sfx.buzz()
      setMessage(`Up to ${limit} tags`)
      return
    }
    sfx.tone(500 + tags.length * 90, 0.09, "sine", 0.06, 0, 900)
    setTags([...tags, tag])
    setText("")
    setMarked(false)
    setMessage(`${tag} added`)
  }

  const remove = (tag: string) => {
    sfx.drop()
    setTags(tags.filter((t) => t !== tag))
    setMarked(false)
    setMessage(`${tag} removed`)
    inner.current?.focus()
  }

  return (
    <div data-slot="tag-input" data-notchset="" className={cn("flex w-full flex-col gap-2", className)}>
      <FieldLabel htmlFor={inputId} focused={focused} aside={<span className="font-mono text-[11px] text-[var(--muted-foreground)] tabular-nums"><NumberFlow value={`${tags.length}/${limit}`} /></span>}>
        {label}
      </FieldLabel>
      <div
        onClick={() => inner.current?.focus()}
        className={cn(
          "flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-[min(var(--radius),22px)] border bg-[var(--background)] p-1.5 [transition:border-color_.2s,box-shadow_var(--ns-time-state)]",
          focused ? "border-[color-mix(in_oklab,var(--foreground)_55%,var(--input))] shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]" : "border-[var(--input)]"
        )}
      >
        <ul role="list" aria-label="Tags" className="m-0 contents list-none p-0">
          {tags.map((tag, i) => {
            const last = i === tags.length - 1
            const isMarked = marked && last
            const shaking = shake?.tag === tag
            return (
              <li
                key={tag}
                className={cn(
                  "flex h-[30px] items-center gap-0.5 rounded-[var(--radius)] ps-3 pe-1 text-[length:var(--ns-type-label)] font-medium [transition:background-color_.15s,color_.15s]",
                  isMarked ? "bg-[var(--foreground)] text-[var(--background)]" : "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
                  shaking ? (shake.n % 2 ? "animate-[ns-shake_.4s]" : "animate-[ns-shake-b_.4s]") : "animate-[ns-chip_.4s_var(--ns-ease-pop)]"
                )}
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    remove(tag)
                  }}
                  className="grid size-[22px] cursor-pointer place-items-center rounded-full opacity-55 outline-none [transition:opacity_.15s] hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
        <input
          ref={refs}
          id={inputId}
          value={text}
          placeholder={placeholder ?? (tags.length ? "Add another" : "Add a tag")}
          onFocus={() => {
            setFocused(true)
            sfx.focus()
          }}
          onBlur={() => {
            setFocused(false)
            setMarked(false)
          }}
          onChange={(event) => {
            const next = event.target.value
            if (next.endsWith(",")) {
              add(next)
              return
            }
            typedSound(sfx, text, next)
            setText(next)
            setMarked(false)
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return
            if (event.key === "Enter") {
              event.preventDefault()
              add(text)
            } else if (event.key === "Backspace" && !text && tags.length) {
              event.preventDefault()
              if (marked) remove(tags[tags.length - 1]!)
              else {
                sfx.tone(800, 0.03, "triangle", 0.035)
                setMarked(true)
              }
            }
          }}
          className="h-[30px] min-w-[96px] flex-1 border-0 bg-transparent px-1.5 text-[length:var(--ns-type-copy)] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] pointer-coarse:text-[16px]"
          {...props}
        />
      </div>
      {suggestions.some((s) => !tags.includes(s)) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="me-1 text-[length:var(--ns-type-note)] text-[var(--muted-foreground)]">Suggested</span>
          {suggestions
            .filter((s) => !tags.includes(s))
            .slice(0, 4)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="h-7 cursor-pointer rounded-[var(--radius)] border border-dashed border-[var(--border)] px-2.5 text-[length:var(--ns-type-note)] text-[var(--muted-foreground)] outline-none [transition:border-color_.15s,color_.15s] hover:border-[var(--foreground)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
      <Announcer message={message} />
    </div>
  )
})

export { TagInput, type TagInputProps }
