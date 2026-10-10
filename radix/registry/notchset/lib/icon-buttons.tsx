"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Icon Buttons' shared parts (both builds wrap them in their own tooltip): four 44px outline buttons,
 * each with its own reaction. The bell rings and its badge counts down, the gear turns a quarter, the
 * mic goes live with a pulsing ring, the pin presses in upright.
 */

type IconProps = Omit<React.ComponentPropsWithoutRef<"button">, "children"> & { sound?: boolean | undefined }

interface BellProps extends IconProps {
  /** Unread count on the badge; 0 hides it. */
  count?: number | undefined
}

const BellIconButton = React.forwardRef<HTMLButtonElement, BellProps>(function BellIconButton({ count = 0, sound = true, className, onClick, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [rings, setRings] = React.useState(0)
  return (
    <button
      ref={ref}
      type="button"
      data-slot="bell-button"
      data-notchset=""
      onClick={(event) => {
        sfx.bell()
        setRings((n) => n + 1)
        onClick?.(event)
      }}
      className={cn(
        "relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-[var(--radius)] border outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color),color_var(--ns-time-color),border-color_var(--ns-time-color)] active:scale-[.88] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]", "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)]", className)}
      {...props}
    >
      <svg key={rings} viewBox="0 0 24 24" aria-hidden="true" className={cn("size-[18px] origin-[50%_8%]", rings > 0 && "animate-[ns-bell_.7s_cubic-bezier(.3,.7,.4,1)]")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
      </svg>
      <span
        aria-hidden="true"
        className={cn(
          "absolute end-[5px] top-[5px] grid h-4 min-w-4 place-items-center rounded-full bg-[var(--destructive)] px-1 font-mono text-[10px] leading-none font-semibold text-[var(--destructive-foreground,#fff)] [transition:transform_.45s_var(--ns-ease-rebound),scale_.45s_var(--ns-ease-rebound),translate_.45s_var(--ns-ease-rebound),rotate_.45s_var(--ns-ease-rebound)]",
          count > 0 ? "scale-100" : "scale-0"
        )}
      >
        {count > 0 ? count : ""}
      </span>
    </button>
  )
})

const SettingsIconButton = React.forwardRef<HTMLButtonElement, IconProps>(function SettingsIconButton({ sound = true, className, onClick, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [turns, setTurns] = React.useState(0)
  return (
    <button
      ref={ref}
      type="button"
      data-slot="settings-button"
      data-notchset=""
      onClick={(event) => {
        sfx.ratchet()
        setTurns((n) => n + 1)
        onClick?.(event)
      }}
      className={cn(
        "relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-[var(--radius)] border outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color),color_var(--ns-time-color),border-color_var(--ns-time-color)] active:scale-[.88] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]", "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)]", className)}
      {...props}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px] [transition:transform_.8s_cubic-bezier(.2,1.4,.3,1),scale_.8s_cubic-bezier(.2,1.4,.3,1),translate_.8s_cubic-bezier(.2,1.4,.3,1),rotate_.8s_cubic-bezier(.2,1.4,.3,1)]" style={{ transform: `rotate(${turns * 90}deg)` }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  )
})

interface ToggleIconProps extends IconProps {
  pressed?: boolean | undefined
  defaultPressed?: boolean | undefined
  onPressedChange?: ((pressed: boolean) => void) | undefined
}

function useToggle({ pressed, defaultPressed = false, onPressedChange }: ToggleIconProps) {
  const [inner, setInner] = React.useState(defaultPressed)
  const on = pressed ?? inner
  const set = (next: boolean) => {
    if (pressed === undefined) setInner(next)
    onPressedChange?.(next)
  }
  return [on, set] as const
}

const MicIconButton = React.forwardRef<HTMLButtonElement, ToggleIconProps>(function MicIconButton({ pressed, defaultPressed, onPressedChange, sound = true, className, onClick, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [live, setLive] = useToggle({ pressed, defaultPressed, onPressedChange })
  return (
    <button
      ref={ref}
      type="button"
      data-slot="mic-button"
      data-notchset=""
      aria-pressed={live}
      onClick={(event) => {
        if (live) sfx.tone(800, 0.1, "sine", 0.05, 0, 400)
        else sfx.tone(500, 0.1, "sine", 0.06, 0, 900)
        setLive(!live)
        onClick?.(event)
      }}
      className={cn(
        "relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-[var(--radius)] border outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color),color_var(--ns-time-color),border-color_var(--ns-time-color)] active:scale-[.88] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]", live ? "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)]", className)}
      {...props}
    >
      {live && <span aria-hidden="true" className="pointer-events-none absolute -inset-px animate-[ns-mic-ring_1.4s_ease-out_infinite] rounded-[var(--radius)] border-[1.5px] border-[var(--primary)]" />}
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19v3" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <rect x="9" y="2" width="6" height="13" rx="3" />
        <path d="M3 3l18 18" className="[stroke-dasharray:26] [transition:stroke-dashoffset_.35s_cubic-bezier(.6,0,.2,1)]" style={{ strokeDashoffset: live ? 26 : 0 }} />
      </svg>
    </button>
  )
})

const PinIconButton = React.forwardRef<HTMLButtonElement, ToggleIconProps>(function PinIconButton({ pressed, defaultPressed, onPressedChange, sound = true, className, onClick, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [pinned, setPinned] = useToggle({ pressed, defaultPressed, onPressedChange })
  return (
    <button
      ref={ref}
      type="button"
      data-slot="pin-button"
      data-notchset=""
      aria-pressed={pinned}
      onClick={(event) => {
        sfx.tone(pinned ? 600 : 900, 0.03, "triangle", 0.04)
        sfx.tone(180, 0.08, "sine", 0.08, 0.03)
        setPinned(!pinned)
        onClick?.(event)
      }}
      className={cn(
        "relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-[var(--radius)] border outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color),color_var(--ns-time-color),border-color_var(--ns-time-color)] active:scale-[.88] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]", "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)]", className)}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("size-[18px] [transition:transform_.5s_var(--ns-ease-rebound),scale_.5s_var(--ns-ease-rebound),translate_.5s_var(--ns-ease-rebound),rotate_.5s_var(--ns-ease-rebound)]", pinned ? "translate-y-px rotate-0" : "rotate-[40deg] rtl:-rotate-[40deg]")}
        fill={pinned ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 17v5" />
        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
      </svg>
    </button>
  )
})

export { BellIconButton, MicIconButton, PinIconButton, SettingsIconButton, type BellProps, type IconProps, type ToggleIconProps }
