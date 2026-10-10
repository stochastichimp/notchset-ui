"use client"

/**
 * Copy Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/copy-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, copyText, RollingLabel, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Copy, in three forms: CopyField (the text in a field with a Copy button inside it), CopyValue (a
 * label, the value and an icon button) and CopyButton (the icon alone). The copy icon spins out as a
 * check spins in, a selection sweeps across the copied text, and Copied shows only after the clipboard
 * accepted it; it reverts after revertAfter.
 */

type SweepPhase = "off" | "in" | "out"

function useCopy({ value, onCopy, revertAfter, sound }: { value: string; onCopy?: ((value: string) => void) | undefined; revertAfter: number; sound: boolean }) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [copied, setCopied] = React.useState(false)
  const [sweep, setSweep] = React.useState<SweepPhase>("off")
  const copy = async () => {
    const ok = await copyText(value)
    if (!ok) {
      sfx.buzz()
      return
    }
    sfx.pop()
    timeline.clear()
    setCopied(true)
    setSweep("in")
    onCopy?.(value)
    timeline.after(650, () => setSweep("out"))
    timeline.after(1000, () => setSweep("off"))
    timeline.after(revertAfter, () => setCopied(false))
  }
  return { copied, sweep, copy }
}

/** The copied text with the selection that sweeps across it. */
function Swept({ sweep, children, className }: { sweep: SweepPhase; children: React.ReactNode; className?: string | undefined }) {
  return (
    <span className={cn("relative", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "absolute -inset-y-px -start-[3px] rounded-[4px] bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)]",
          sweep === "in" && "w-[calc(100%+6px)] opacity-100 [transition:width_.4s_cubic-bezier(.6,0,.2,1)]",
          sweep === "out" && "w-[calc(100%+6px)] opacity-0 [transition:opacity_var(--ns-time-state)]",
          sweep === "off" && "w-0 opacity-0 transition-none"
        )}
      />
      <span className="relative">{children}</span>
    </span>
  )
}

/** The copy icon spinning out as the check spins in. */
function CopyGlyph({ copied, className }: { copied: boolean; className?: string | undefined }) {
  return (
    <span aria-hidden="true" className={cn("relative block size-3.5 shrink-0", className)}>
      <svg
        viewBox="0 0 24 24"
        className={cn("absolute inset-0 size-full [transition:transform_.4s_cubic-bezier(.2,1.4,.4,1),scale_.4s_cubic-bezier(.2,1.4,.4,1),translate_.4s_cubic-bezier(.2,1.4,.4,1),rotate_.4s_cubic-bezier(.2,1.4,.4,1),opacity_.2s]", copied ? "scale-30 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className={cn("absolute inset-0 size-full [transition:transform_.45s_var(--ns-ease-rebound),scale_.45s_var(--ns-ease-rebound),translate_.45s_var(--ns-ease-rebound),rotate_.45s_var(--ns-ease-rebound),opacity_.2s]", copied ? "scale-100 rotate-0 opacity-100" : "scale-30 rotate-45 opacity-0")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  )
}

interface CopyProps {
  /** The exact text that goes on the clipboard. */
  value: string
  /** Runs after the clipboard accepted it. */
  onCopy?: ((value: string) => void) | undefined
  /** How long Copied shows (ms). Default 1800. */
  revertAfter?: number | undefined
  sound?: boolean | undefined
}

interface CopyButtonProps extends CopyProps, Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children" | "value" | "onCopy"> {
  /** The accessible name. Default "Copy". */
  label?: string | undefined
}

/** The icon alone: a 34px ghost button. */
const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton({ value, onCopy, revertAfter = 1800, sound = true, label = "Copy", className, ...props }, ref) {
  const { copied, copy } = useCopy({ value, onCopy, revertAfter, sound })
  return (
    <button
      ref={ref}
      type="button"
      data-slot="copy-button"
      data-notchset=""
      aria-label={label}
      onClick={() => void copy()}
      className={cn(
        "relative grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-[var(--radius)] text-[var(--foreground)] outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 pointer-coarse:after:absolute pointer-coarse:after:-inset-[5px] pointer-coarse:after:content-[''] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className
      )}
      {...props}
    >
      <CopyGlyph copied={copied} className="size-[15px]" />
      <Announcer message={copied ? "Copied" : ""} />
    </button>
  )
})

interface CopyFieldProps extends CopyProps, Omit<React.ComponentPropsWithoutRef<"div">, "children" | "onCopy"> {
  /** What the field shows, when it differs from what's copied (a URL without its scheme). */
  display?: React.ReactNode | undefined
  /** The button's accessible name. Default "Copy". */
  label?: string | undefined
}

/** The text in a 46px field with a Copy button inside it. */
const CopyField = React.forwardRef<HTMLDivElement, CopyFieldProps>(function CopyField({ value, display, onCopy, revertAfter = 1800, sound = true, label = "Copy", className, ...props }, ref) {
  const { copied, sweep, copy } = useCopy({ value, onCopy, revertAfter, sound })
  return (
    <div
      ref={ref}
      data-slot="copy-field"
      data-notchset=""
      className={cn("flex h-[46px] w-full max-w-[300px] items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] ps-3.5 pe-[5px] text-[var(--foreground)]", className)}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-[length:var(--ns-type-label)]">
        <Swept sweep={sweep}>{display ?? value}</Swept>
      </span>
      <button
        type="button"
        aria-label={label}
        onClick={() => void copy()}
        className="relative inline-flex h-[34px] shrink-0 cursor-pointer items-center gap-[7px] rounded-[var(--radius)] bg-[var(--secondary)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-label)] font-medium text-[var(--secondary-foreground)] outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s] hover:bg-[color-mix(in_oklab,var(--secondary)_80%,var(--foreground))] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-[5px] pointer-coarse:after:inset-x-0 pointer-coarse:after:content-[''] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      >
        <CopyGlyph copied={copied} />
        <RollingLabel size="sm" index={copied ? 1 : 0} rows={["Copy", "Copied"]} />
      </button>
      <Announcer message={copied ? "Copied" : ""} />
    </div>
  )
})

interface CopyValueProps extends CopyProps, Omit<React.ComponentPropsWithoutRef<"div">, "children" | "onCopy"> {
  /** What the value is, e.g. "Invite code"; also names the button. */
  label: string
}

/** A label, the value in mono and an icon button. */
const CopyValue = React.forwardRef<HTMLDivElement, CopyValueProps>(function CopyValue({ value, label, onCopy, revertAfter = 1800, sound = true, className, ...props }, ref) {
  const { copied, sweep, copy } = useCopy({ value, onCopy, revertAfter, sound })
  return (
    <div ref={ref} data-slot="copy-value" data-notchset="" className={cn("flex w-full max-w-[300px] items-center justify-between gap-3 ps-3.5 pe-1.5", className)} {...props}>
      <span className="flex min-w-0 items-center gap-3">
        <span className="text-[length:var(--ns-type-label)] text-[var(--muted-foreground)]">{label}</span>
        <Swept sweep={sweep} className="truncate font-mono text-[length:var(--ns-type-label)] text-[var(--foreground)]">
          {value}
        </Swept>
      </span>
      <button
        type="button"
        aria-label={`Copy ${label.toLowerCase()}`}
        onClick={() => void copy()}
        className="relative grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-[var(--radius)] text-[var(--foreground)] outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-90 pointer-coarse:after:absolute pointer-coarse:after:-inset-[5px] pointer-coarse:after:content-[''] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      >
        <CopyGlyph copied={copied} className="size-[15px]" />
      </button>
      <Announcer message={copied ? "Copied" : ""} />
    </div>
  )
})

export { CopyButton, CopyField, CopyValue, type CopyButtonProps, type CopyFieldProps, type CopyValueProps }
