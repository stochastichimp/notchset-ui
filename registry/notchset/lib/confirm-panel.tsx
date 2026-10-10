"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Collapse } from "@/lib/notchset/collapse"
import { RollingLabel } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * The type-to-confirm body inside Alert Dialog (both builds), and the undo bar that follows a delete.
 * Under the input the name is spelled out: each character lifts green as it matches, or turns red. The
 * border is green while the typed text is a correct start. Delete stays faint until the name matches;
 * a premature Delete (or Enter) shakes and buzzes.
 */

interface ConfirmFieldProps {
  name: string
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  label?: React.ReactNode | undefined
  inputRef?: React.Ref<HTMLInputElement> | undefined
}

function ConfirmField({ name, value, onValueChange, onSubmit, label = "Type the name to confirm", inputRef }: ConfirmFieldProps) {
  const prefix = name.startsWith(value)
  return (
    <label className="flex flex-col gap-2 text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
      {label}
      <input
        ref={inputRef}
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return
          e.preventDefault()
          onSubmit()
        }}
        className={cn(
          "h-[42px] rounded-[12px] border bg-[var(--background)] px-3.5 font-mono text-[length:var(--ns-type-copy)] text-[var(--foreground)] outline-none [transition:border-color_var(--ns-time-color),box-shadow_var(--ns-time-state)] focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--foreground)_7%,transparent)]",
          !value && "border-[var(--input)]",
          value && prefix && "border-[color-mix(in_oklab,var(--success,var(--foreground))_60%,var(--border))]",
          value && !prefix && "border-[var(--destructive)]"
        )}
      />
      <span aria-hidden="true" dir="ltr" className="flex font-mono text-[length:var(--ns-type-label)] tracking-[.04em]">
        {Array.from(name).map((ch, i) => {
          const typed = i < value.length
          const ok = typed && value[i] === ch
          return (
            <span
              key={i}
              className="[transition:color_.2s,translate_.3s_var(--ns-ease-rebound)]"
              style={{ color: !typed ? "color-mix(in oklab, var(--muted-foreground) 85%, var(--foreground))" : ok ? "var(--success,var(--foreground))" : "var(--destructive)", translate: ok ? "0 -2px" : "0 0" }}
            >
              {ch}
            </span>
          )
        })}
      </span>
    </label>
  )
}

/** The pair of buttons: Cancel, and Delete that rolls to Deleting…. */
function ConfirmActions({ ready, busy, onCancel, onDelete, cancelLabel = "Cancel", deleteLabel = "Delete" }: { ready: boolean; busy: boolean; onCancel: () => void; onDelete: () => void; cancelLabel?: React.ReactNode | undefined; deleteLabel?: React.ReactNode | undefined }) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-[34px] min-w-[100px] cursor-pointer items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap text-[var(--foreground)] outline-none [transition:background-color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        aria-disabled={!ready || undefined}
        aria-busy={busy || undefined}
        onClick={onDelete}
        className={cn(
          "inline-flex h-[34px] min-w-[100px] cursor-pointer items-center justify-center rounded-[var(--radius)] bg-[var(--destructive)] px-3.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap text-[var(--destructive-foreground,#fff)] outline-none [transition:opacity_var(--ns-time-state),scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] active:scale-95",
          ready ? "opacity-100" : "opacity-45"
        )}
      >
        <RollingLabel index={busy ? 1 : 0} size="sm" rows={[<React.Fragment key="d">{deleteLabel}</React.Fragment>, <React.Fragment key="b">Deleting…</React.Fragment>]} />
      </button>
    </div>
  )
}

/** After a delete: a bar with an 8s countdown ring and Undo. */
function UndoBar({ open, onUndo, duration = 8000, children, sound = true }: { open: boolean; onUndo: () => void; duration?: number | undefined; children: React.ReactNode; sound?: boolean | undefined }) {
  const { sfx } = useSound(sound)
  const [run, setRun] = React.useState(0)
  const [shown, setShown] = React.useState(open)
  if (open !== shown) {
    setShown(open)
    if (open) setRun((n) => n + 1)
  }
  return (
    <Collapse open={open}>
      <div data-slot="undo-bar" role="status" className="flex items-center gap-3 rounded-[14px] bg-[var(--muted)] px-3.5 py-3 text-[length:var(--ns-type-label)] text-[var(--foreground)]">
        <svg key={run} viewBox="0 0 24 24" aria-hidden="true" className="size-[22px] shrink-0 -rotate-90 motion-reduce:hidden">
          <circle cx="12" cy="12" r="9" fill="none" stroke="var(--border)" strokeWidth="2.5" />
          <circle cx="12" cy="12" r="9" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" pathLength={1} className="[stroke-dasharray:1] animate-[ns-ring-down_linear_both]" style={{ animationDuration: `${duration}ms` }} />
        </svg>
        <span className="flex-1">{children}</span>
        <button
          type="button"
          onClick={() => {
            sfx.pop()
            onUndo()
          }}
          className="h-[30px] cursor-pointer rounded-[var(--radius)] bg-[var(--background)] px-[var(--ns-inset-compact)] text-[length:var(--ns-type-note)] font-medium outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
        >
          Undo
        </button>
      </div>
    </Collapse>
  )
}

export { ConfirmActions, ConfirmField, UndoBar }
