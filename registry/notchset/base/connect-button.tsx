"use client"

/**
 * Connect Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/connect-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, RollingLabel, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Connect: two nodes joined by a dashed line. While your onConnect runs (an OAuth round trip) the
 * dashes march and three pings rise; when it resolves the nodes snap together and fill. Hovering a
 * connected button offers Disconnect, and pressing it runs onDisconnect. No brand marks: the provider
 * is a name you pass.
 */

type ConnectState = "idle" | "connecting" | "connected"

interface ConnectButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  /** The service's name, e.g. "Stripe". */
  provider: string
  connected?: boolean | undefined
  defaultConnected?: boolean | undefined
  /** Runs the connection. Resolve when it's live; a rejection shakes the button. */
  onConnect?: (() => unknown) | undefined
  /** Runs on Disconnect. */
  onDisconnect?: (() => unknown) | undefined
  onConnectedChange?: ((connected: boolean) => void) | undefined
  onError?: ((error: unknown) => void) | undefined
  sound?: boolean | undefined
}

const ConnectButton = React.forwardRef<HTMLButtonElement, ConnectButtonProps>(function ConnectButton(
  { provider, connected, defaultConnected = false, onConnect, onDisconnect, onConnectedChange, onError, sound = true, disabled, className, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [inner, setInner] = React.useState<ConnectState>(defaultConnected ? "connected" : "idle")
  const [busy, setBusy] = React.useState(false)
  const [hover, setHover] = React.useState(false)
  const [shakes, setShakes] = React.useState(0)
  const state: ConnectState = busy ? "connecting" : connected === undefined ? inner : connected ? "connected" : "idle"

  const setConnected = (on: boolean) => {
    setInner(on ? "connected" : "idle")
    onConnectedChange?.(on)
  }

  const press = async () => {
    if (busy || disabled) return
    if (state === "connected") {
      sfx.drop()
      setHover(false)
      try {
        await onDisconnect?.()
      } catch (error) {
        sfx.buzz()
        setShakes((n) => n + 1)
        onError?.(error)
        return
      }
      setConnected(false)
      return
    }
    sfx.tick()
    setBusy(true)
    for (const i of [1, 2, 3]) timeline.after(i * 280, () => sfx.tone(700 + i * 90, 0.03, "triangle", 0.025))
    try {
      await onConnect?.()
    } catch (error) {
      timeline.clear()
      setBusy(false)
      sfx.buzz()
      setShakes((n) => n + 1)
      onError?.(error)
      return
    }
    timeline.clear()
    sfx.tone(1200, 0.03, "square", 0.03)
    sfx.tone(1600, 0.08, "triangle", 0.05, 0.05)
    setBusy(false)
    setHover(false)
    setConnected(true)
  }

  const live = state === "connected"
  const row = state === "idle" ? 0 : state === "connecting" ? 1 : hover ? 3 : 2
  return (
    <button
      ref={ref}
      type="button"
      data-slot="connect-button"
      data-notchset=""
      data-state={state}
      aria-pressed={live}
      aria-busy={busy || undefined}
      disabled={disabled}
      onClick={() => void press()}
      onPointerEnter={(event) => {
        setHover(true)
        onPointerEnter?.(event)
      }}
      onPointerLeave={(event) => {
        setHover(false)
        onPointerLeave?.(event)
      }}
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible")) setHover(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setHover(false)
        onBlur?.(event)
      }}
      className={cn(
        "relative inline-flex h-11 w-[206px] max-w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className="flex h-3 w-8 shrink-0 items-center">
        <span
          className={cn("size-[9px] shrink-0 rounded-[3px] border-[1.5px] border-current [transition:transform_.5s_cubic-bezier(.2,1.7,.4,1),scale_.5s_cubic-bezier(.2,1.7,.4,1),translate_.5s_cubic-bezier(.2,1.7,.4,1),rotate_.5s_cubic-bezier(.2,1.7,.4,1),background-color_.3s]", live ? "translate-x-[3px] bg-current rtl:-translate-x-[3px]" : "bg-transparent")}
        />
        <span
          className={cn(
            "mx-0.5 h-[1.5px] flex-1 [transition:opacity_var(--ns-time-state)]",
            live ? "bg-current opacity-100" : "bg-[repeating-linear-gradient(90deg,currentColor_0_3px,transparent_3px_6px)] [background-size:6px_100%]",
            state === "idle" && "opacity-45",
            state === "connecting" && "animate-[ns-march_.45s_linear_infinite] opacity-100"
          )}
        />
        <span
          className={cn("size-[9px] shrink-0 rounded-[3px] border-[1.5px] border-current [transition:transform_.5s_cubic-bezier(.2,1.7,.4,1)_.04s,scale_.5s_cubic-bezier(.2,1.7,.4,1)_.04s,translate_.5s_cubic-bezier(.2,1.7,.4,1)_.04s,rotate_.5s_cubic-bezier(.2,1.7,.4,1)_.04s,background-color_.3s]", live ? "-translate-x-[3px] bg-current rtl:translate-x-[3px]" : "bg-transparent")}
        />
      </span>
      <span key={shakes} className={cn("block", shakes > 0 && "animate-[ns-shake_.42s]")}>
        <RollingLabel index={row} rows={[`Connect ${provider}`, "Connecting", "Connected", "Disconnect"]} />
      </span>
      <Announcer message={state === "connecting" ? `Connecting ${provider}` : live ? `${provider} connected` : ""} />
    </button>
  )
})

export { ConnectButton, type ConnectButtonProps }
