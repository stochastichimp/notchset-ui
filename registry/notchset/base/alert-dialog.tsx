"use client"

/**
 * Alert Dialog (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/alert-dialog
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"
import { AlertDialog as Dialog } from "@base-ui/react/alert-dialog"

import { cn } from "@/lib/utils"
import { ConfirmActions, ConfirmField, UndoBar } from "@/lib/notchset/confirm-panel"
import { usePortal } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Alert Dialog (Base UI build): a destructive confirmation that asks for the name to be typed. The scrim
 * fades in and the dialog rises from .94 with a spring; each typed character lifts green or turns red,
 * and Delete only works once the name matches (Enter submits, Esc cancels). Pair it with UndoBar.
 */

interface AlertDialogProps {
  /** What must be typed, e.g. the project's slug. */
  name: string
  title?: React.ReactNode | undefined
  description: React.ReactNode
  /** Resolve when deleted; the dialog shows Deleting… until then. */
  onDelete: () => Promise<void> | void
  open?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The trigger's content. */
  children?: React.ReactNode | undefined
  triggerClassName?: string | undefined
  sound?: boolean | undefined
}

function AlertDialog({ name, title, description, onDelete, open: openProp, onOpenChange, children = "Delete", triggerClassName, sound = true }: AlertDialogProps) {
  const { sfx } = useSound(sound)
  const container = usePortal()
  const input = React.useRef<HTMLInputElement>(null)
  const [inner, setInner] = React.useState(false)
  const [typed, setTyped] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [shakes, setShakes] = React.useState(0)
  const open = openProp ?? inner
  const ready = typed === name

  const set = (next: boolean) => {
    if (busy && !next) return
    if (next) {
      setTyped("")
      sfx.alertWarn()
    } else sfx.drop()
    if (openProp === undefined) setInner(next)
    onOpenChange?.(next)
  }
  const submit = async () => {
    if (busy) return
    if (!ready) {
      sfx.buzz()
      setShakes((n) => n + 1)
      return
    }
    sfx.press()
    setBusy(true)
    try {
      await onDelete()
      sfx.thud()
      setBusy(false)
      if (openProp === undefined) setInner(false)
      onOpenChange?.(false)
    } catch {
      sfx.buzz()
      setBusy(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={set}>
      <Dialog.Trigger className={cn("inline-flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap text-[var(--destructive)] outline-none [transition:background-color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95", triggerClassName)}>{children}</Dialog.Trigger>
      <Dialog.Portal container={container}>
        <Dialog.Backdrop className="fixed inset-0 z-50 animate-[ns-menu-fade_.35s_both] bg-[rgba(0,0,0,.32)]" />
        <Dialog.Popup
          data-slot="alert-dialog"
          data-notchset=""
          initialFocus={input}
          className="fixed inset-x-4 inset-y-0 z-50 m-auto h-fit w-[min(100%-32px,424px)] animate-[ns-dialog-in_.5s_var(--ns-ease-reshape)_both] text-[var(--foreground)] outline-none motion-reduce:animate-[ns-menu-fade_.2s_both]"
        >
          <div key={shakes} className={cn("flex flex-col gap-3.5 rounded-[20px] border border-[var(--border)] bg-[var(--background)] p-5 shadow-[0_30px_60px_-24px_rgba(0,0,0,.45)]", shakes > 0 && "animate-[ns-shake_.42s] motion-reduce:animate-none")}>
            <div className="flex gap-3">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--destructive)_13%,transparent)] text-[var(--destructive)]">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </span>
              <span className="flex flex-col gap-1">
                <Dialog.Title className="m-0 text-[16px] font-semibold tracking-[-0.02em]">{title ?? `Delete ${name}?`}</Dialog.Title>
                <Dialog.Description className="m-0 text-[length:var(--ns-type-label)] leading-[var(--ns-leading-prose)] text-pretty text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{description}</Dialog.Description>
              </span>
            </div>
            <ConfirmField name={name} value={typed} onValueChange={setTyped} onSubmit={() => void submit()} inputRef={input} />
            <ConfirmActions ready={ready} busy={busy} onCancel={() => set(false)} onDelete={() => void submit()} />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { AlertDialog, UndoBar, type AlertDialogProps }
