"use client"

/**
 * Share Popover (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/share-popover
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"
import { Popover } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"
import { usePortal } from "@/lib/notchset/shared"
import { SharePanel, type SharePanelProps } from "@/lib/notchset/share-panel"
import { useSound } from "@/lib/notchset/sound"

/*
 * Share Popover (Base UI build): a Share button whose panel scales in from its corner, anchored to the
 * button's end. Inside: the link with a rolling Copy, access that turns amber when public, people that
 * drop into the To field as chips, and a Send that rolls to a green confirmation. Focus stays inside
 * while it's open.
 */

interface SharePopoverProps extends Omit<SharePanelProps, "onClose">, Omit<React.ComponentPropsWithoutRef<"div">, "title" | "onCopy"> {
  open?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The trigger's label. */
  label?: React.ReactNode | undefined
}

const SharePopover = React.forwardRef<HTMLDivElement, SharePopoverProps>(function SharePopover(
  { open: openProp, onOpenChange, label = "Share", title, link, onCopy, access, onAccessChange, workspace, people, onSend, onDone, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const container = usePortal()
  const [inner, setInner] = React.useState(false)
  const open = openProp ?? inner
  const set = (next: boolean) => {
    if (next === open) return
    if (next) sfx.swooshIn()
    else sfx.swooshOut()
    if (openProp === undefined) setInner(next)
    onOpenChange?.(next)
  }

  return (
    <div ref={ref} data-slot="share-popover" data-notchset="" className={cn("inline-flex", className)} {...props}>
      <Popover.Root open={open} onOpenChange={set} modal="trap-focus">
        <Popover.Trigger className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 text-[12.5px] font-medium text-[var(--foreground)] outline-none [transition:scale_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[13px] rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
          {label}
        </Popover.Trigger>
        <Popover.Portal container={container}>
          <Popover.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={12} className="z-50">
            <Popover.Popup
              data-slot="share-popover-popup"
              aria-label={`Share ${title}`}
              className="w-[330px] max-w-[calc(100vw-24px)] origin-top-right animate-[ns-menu-fade_.2s,ns-menu-pop_.4s_var(--ns-ease-reshape)] rounded-[18px] border border-[var(--border)] bg-[var(--background)] p-3 text-[var(--foreground)] shadow-[var(--ns-shadow-layer)] outline-none motion-reduce:animate-[ns-menu-fade_.2s] rtl:origin-top-left"
            >
              <SharePanel title={title} link={link} onCopy={onCopy} access={access} onAccessChange={onAccessChange} workspace={workspace} people={people} onSend={onSend} onDone={onDone} onClose={() => set(false)} sound={sound} />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
})

export { SharePopover, type SharePopoverProps }
