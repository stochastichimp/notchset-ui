"use client"

/**
 * Split Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/split-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"
import { Menu } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"
import { usePortal } from "@/lib/notchset/shared"
import { SPLIT_ACTIONS, SplitItemContent, SplitMain, useSplitFlow, type SplitAction } from "@/lib/notchset/split"

/*
 * Split Button (Base UI build): a main action and a menu of related ones. The main half runs the first
 * action; each menu row runs its own, with its own words and sound. The menu matches the button: same
 * type size, icons and radius, with key hints. Esc and an outside press close it.
 */

interface SplitButtonProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children" | "onError"> {
  /** The main half's label. Default "Publish". */
  label?: React.ReactNode | undefined
  /** The actions; the first is the main one. Default: publish, schedule, save as draft, discard. */
  actions?: readonly SplitAction[] | undefined
  /** Runs an action by id. Return a promise: its done label shows only when it resolves. */
  onAction?: ((id: string) => unknown) | undefined
  onError?: ((error: unknown, id: string) => void) | undefined
  /** Called as the done state shows, with the action's id. */
  onSuccess?: ((id: string) => void) | undefined
  /** The trigger's accessible name. Default "More options". */
  menuLabel?: string | undefined
  /** The least time the busy label shows (ms). Default 1200. */
  minDuration?: number | undefined
  /** How long the done label shows (ms). Default 2000. */
  resetAfter?: number | undefined
  disabled?: boolean | undefined
  sound?: boolean | undefined
}

const SplitButton = React.forwardRef<HTMLDivElement, SplitButtonProps>(function SplitButton(
  { label = "Publish", actions = SPLIT_ACTIONS, onAction, onError, onSuccess, menuLabel = "More options", minDuration = 1200, resetAfter = 2000, disabled, sound = true, className, ...props },
  ref
) {
  const flow = useSplitFlow({ actions, onAction, onError, onSuccess, minDuration, resetAfter, sound })
  const container = usePortal()
  return (
    <div ref={ref} data-slot="split-button" data-notchset="" className={cn("relative inline-flex", className)} {...props}>
      <SplitMain state={flow.state} active={flow.active} shakes={flow.shakes} label={label} disabled={disabled} onClick={() => void flow.start(actions[0])} />
      <Menu.Root onOpenChange={(open) => open && flow.sfx.tick()}>
        <Menu.Trigger
          data-slot="split-button-trigger"
          aria-label={menuLabel}
          disabled={disabled || flow.state !== "idle"}
          className="group relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-s-none rounded-e-[var(--radius)] border border-transparent border-s-[color-mix(in_oklab,var(--primary-foreground)_22%,transparent)] bg-[var(--primary)] text-[var(--primary-foreground)] outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] hover:bg-[color-mix(in_oklab,var(--primary)_86%,var(--background))] focus-visible:z-10 focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed data-[popup-open]:bg-[color-mix(in_oklab,var(--primary)_82%,var(--background))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 [transition:transform_.4s_cubic-bezier(.2,1.4,.4,1),scale_.4s_cubic-bezier(.2,1.4,.4,1),translate_.4s_cubic-bezier(.2,1.4,.4,1),rotate_.4s_cubic-bezier(.2,1.4,.4,1)] group-data-[popup-open]:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Menu.Trigger>
        <Menu.Portal container={container}>
          <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50 outline-none">
            <Menu.Popup
              data-slot="split-button-menu"
              data-notchset=""
              className="w-[236px] max-w-[calc(100vw-16px)] origin-top-right animate-[ns-menu-fade_.16s,ns-menu-pop_.34s_var(--ns-ease-reshape)] rounded-[calc(min(var(--radius),14px)+5px)] border border-[var(--border)] bg-[var(--background)] p-[5px] text-[var(--foreground)] shadow-[0_16px_36px_-14px_rgba(0,0,0,.22),0_2px_6px_-2px_rgba(0,0,0,.06)] outline-none rtl:origin-top-left"
            >
              {actions.map((action, i) => (
                <React.Fragment key={action.id}>
                  {action.destructive && i > 0 && <Menu.Separator className="mx-2 my-1 h-px bg-[var(--border)]" />}
                  <Menu.Item
                    data-slot="split-button-item"
                    onClick={() => {
                      flow.sfx.tick()
                      void flow.start(action)
                    }}
                    className={cn(
                      "flex h-10 w-full cursor-pointer items-center rounded-[min(var(--radius),14px)] px-3 text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] outline-none select-none [transition:background-color_.15s]",
                      action.destructive ? "text-[var(--destructive)] data-[highlighted]:bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)]" : "text-[var(--foreground)] data-[highlighted]:bg-[var(--accent)]"
                    )}
                  >
                    <SplitItemContent action={action} index={i} />
                  </Menu.Item>
                </React.Fragment>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  )
})

export { SPLIT_ACTIONS, SplitButton, type SplitAction, type SplitButtonProps }
