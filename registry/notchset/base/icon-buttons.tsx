"use client"

/**
 * Icon Buttons (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/icon-buttons
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"
import { Tooltip } from "@base-ui/react/tooltip"

import { usePortal } from "@/lib/notchset/shared"
import { BellIconButton, MicIconButton, PinIconButton, SettingsIconButton, type BellProps, type IconProps, type ToggleIconProps } from "@/lib/notchset/icon-buttons"

/*
 * Icon Buttons (Base UI build): Bell, Settings, Mic and Pin, each with a tooltip that names it (also its
 * accessible name). Pass `label` to rename one.
 */

function Tip({ label, children }: { label: string; children: React.ReactElement }) {
  const container = usePortal()
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} aria-label={label} />
      <Tooltip.Portal container={container}>
        <Tooltip.Positioner side="top" sideOffset={8} className="z-50">
          <Tooltip.Popup
            data-slot="icon-button-tooltip"
            className="animate-[ns-menu-fade_.16s] rounded-[min(var(--radius),8px)] bg-[var(--foreground)] px-2 py-1 text-[length:var(--ns-type-note)] font-medium text-[var(--background)]"
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

const BellButton = React.forwardRef<HTMLButtonElement, BellProps & { label?: string | undefined }>(function BellButton({ label = "Notifications", ...props }, ref) {
  return (
    <Tip label={label}>
      <BellIconButton ref={ref} {...props} />
    </Tip>
  )
})

const SettingsButton = React.forwardRef<HTMLButtonElement, IconProps & { label?: string | undefined }>(function SettingsButton({ label = "Settings", ...props }, ref) {
  return (
    <Tip label={label}>
      <SettingsIconButton ref={ref} {...props} />
    </Tip>
  )
})

const MicButton = React.forwardRef<HTMLButtonElement, ToggleIconProps & { label?: string | undefined }>(function MicButton({ label = "Microphone", ...props }, ref) {
  return (
    <Tip label={label}>
      <MicIconButton ref={ref} {...props} />
    </Tip>
  )
})

const PinButton = React.forwardRef<HTMLButtonElement, ToggleIconProps & { label?: string | undefined }>(function PinButton({ label = "Pin", ...props }, ref) {
  return (
    <Tip label={label}>
      <PinIconButton ref={ref} {...props} />
    </Tip>
  )
})

/** Shares one hover delay across the buttons, so moving between them shows each tooltip at once. */
function IconButtonGroup({ children, delay = 400 }: { children: React.ReactNode; delay?: number | undefined }) {
  return <Tooltip.Provider delay={delay}>{children}</Tooltip.Provider>
}

export { BellButton, IconButtonGroup, MicButton, PinButton, SettingsButton }
