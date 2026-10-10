"use client"

/**
 * Slug Input (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/slug-input
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, DrawCheck, Spinner, useComposedRefs, useTimeline } from "@/lib/notchset/shared"
import { FieldLabel, FieldShell, useControllable, useFocusWithin } from "@/lib/notchset/field"
import { typedSound, useSound } from "@/lib/notchset/sound"

/*
 * Slug Input: whatever you type becomes a clean slug as you type (lowercase, dashes, no stray marks).
 * After a pause it checks availability: a spinner, then a green check, or a red X that pops in with a
 * suggestion you can take in one press.
 */

type SlugState = "idle" | "checking" | "available" | "taken"

interface SlugInputProps extends Omit<React.ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange" | "prefix" | "size"> {
  label?: React.ReactNode | undefined
  /** The fixed start of the address, e.g. "acme.app/". */
  prefix: string
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((slug: string) => void) | undefined
  /** Resolves true when the slug is free. */
  checkAvailability: (slug: string) => Promise<boolean> | boolean
  /** The alternative offered when a slug is taken. Default: slug + "-studio". */
  suggest?: ((slug: string) => string) | undefined
  /** The longest slug. Default 32. */
  maxLength?: number | undefined
  /** Pause before checking (ms). Default 550. */
  debounce?: number | undefined
  sound?: boolean | undefined
}

function slugify(raw: string, max: number) {
  return raw
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-/, "")
    .slice(0, max)
}

const SlugInput = React.forwardRef<HTMLInputElement, SlugInputProps>(function SlugInput(
  { label = "Address", prefix, value, defaultValue = "", onValueChange, checkAvailability, suggest = (s) => `${s}-studio`, maxLength = 32, debounce = 550, sound = true, id, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [slug, setSlug] = useControllable(value, defaultValue, onValueChange)
  const [focused, focusProps] = useFocusWithin()
  const [state, setState] = React.useState<SlugState>("idle")
  const inner = React.useRef<HTMLInputElement>(null)
  const refs = useComposedRefs(inner, ref)
  const run = React.useRef(0)
  const autoId = React.useId()
  const inputId = id ?? autoId
  const helperId = `${inputId}-helper`
  const clean = slug.replace(/-+$/, "")
  const alternative = suggest(clean)

  const check = (next: string) => {
    const id = ++run.current
    timeline.clear()
    if (!next.replace(/-+$/, "")) {
      setState("idle")
      return
    }
    setState("checking")
    timeline.after(debounce, () => {
      void Promise.resolve(checkAvailability(next.replace(/-+$/, ""))).then(
        (free) => {
          if (id !== run.current) return
          if (free) sfx.ding(2)
          else sfx.taken()
          setState(free ? "available" : "taken")
        },
        () => id === run.current && setState("idle")
      )
    })
  }

  const helper = state === "checking" ? "Checking availability…" : state === "available" ? `${prefix}${clean} is available` : state === "taken" ? `${prefix}${clean} is taken` : "Letters, numbers and dashes"
  return (
    <div data-slot="slug-input" data-notchset="" className={cn("flex w-full flex-col gap-2", className)}>
      <FieldLabel htmlFor={inputId} focused={focused}>
        {label}
      </FieldLabel>
      <FieldShell focused={focused} invalid={state === "taken"} className="gap-0 overflow-hidden ps-0" {...focusProps}>
        <span aria-hidden="true" className="flex h-full shrink-0 items-center border-e border-[var(--border)] bg-[var(--muted)] ps-4 pe-2.5 font-mono text-[length:var(--ns-type-label)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
          {prefix}
        </span>
        <input
          ref={refs}
          id={inputId}
          value={slug}
          spellCheck={false}
          autoCapitalize="none"
          aria-describedby={helperId}
          aria-invalid={state === "taken" || undefined}
          onFocus={() => sfx.focus()}
          onChange={(event) => {
            const next = slugify(event.target.value, maxLength)
            typedSound(sfx, slug, next)
            setSlug(next)
            check(next)
          }}
          className="h-full min-w-0 flex-1 border-0 bg-transparent ps-2.5 pe-2 font-mono text-[length:var(--ns-type-label)] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] pointer-coarse:text-[16px]"
          {...props}
        />
        <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center me-3">
          {state === "checking" && <Spinner />}
          {state === "available" && <DrawCheck shown className="text-[var(--success,var(--foreground))]" />}
          {state === "taken" && (
            <svg viewBox="0 0 24 24" className="size-4 animate-[ns-chip_.35s_var(--ns-ease-rebound)_both] text-[var(--destructive)]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          )}
        </span>
      </FieldShell>
      <div className="flex min-h-5 flex-wrap items-center justify-between gap-2">
        <p id={helperId} className={cn("m-0 text-[length:var(--ns-type-note)]", state === "taken" ? "text-[var(--destructive)]" : state === "available" ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]")}>
          {helper}
        </p>
        {state === "taken" && (
          <button
            type="button"
            onClick={() => {
              sfx.ding(3)
              setSlug(alternative)
              check(alternative)
              inner.current?.focus()
            }}
            className="animate-[ns-fade-up_.25s_both] cursor-pointer rounded-[var(--radius)] border border-[var(--border)] px-2 py-0.5 font-mono text-[11px] text-[var(--foreground)] outline-none hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            Use {alternative}
          </button>
        )}
      </div>
      <Announcer message={state === "available" || state === "taken" ? helper : ""} />
    </div>
  )
})

export { SlugInput, type SlugInputProps }
