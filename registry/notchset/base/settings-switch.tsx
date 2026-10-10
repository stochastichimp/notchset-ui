"use client"

/**
 * Settings Switch (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/settings-switch
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Collapse } from "@/lib/notchset/collapse"
import { useSound } from "@/lib/notchset/sound"

/*
 * Settings Switch: a 46×28 switch whose thumb squashes wide while pressed, fills the track with its
 * colour when on and pops a check into the thumb. Return a promise from onCheckedChange and it waits at
 * a half tint with a spinner in the thumb: a rejection springs it back with a shake and a buzz; success
 * locks it on with a chime. SwitchRow lays one out with an icon tile that tints to match, a title, a
 * subtitle, and content that unfolds while it's on.
 */

interface SettingsSwitchProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onChange"> {
  checked: boolean
  /** Return a promise to wait on it; reject to spring back. */
  onCheckedChange: (checked: boolean) => void | Promise<unknown>
  /** The on colour, e.g. "var(--success,var(--foreground))". */
  color?: string | undefined
  sound?: boolean | undefined
}

const SettingsSwitch = React.forwardRef<HTMLButtonElement, SettingsSwitchProps>(function SettingsSwitch({ checked, onCheckedChange, color = "var(--success,var(--foreground))", sound = true, disabled, className, style, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [pending, setPending] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  const [shakes, setShakes] = React.useState(0)
  const on = checked || pending
  const w = pressed ? 26 : 20

  const toggle = () => {
    if (pending || disabled) return
    const next = !checked
    const r = onCheckedChange(next)
    if (r && typeof (r as Promise<unknown>).then === "function") {
      setPending(true)
      sfx.tone(700, 0.05, "triangle", 0.035)
      ;(r as Promise<unknown>).then(
        () => {
          setPending(false)
          if (next) sfx.chime()
          else sfx.tone(700, 0.06, "triangle", 0.035, 0, 460)
        },
        () => {
          setPending(false)
          setShakes((n) => n + 1)
          sfx.buzz()
        }
      )
      return
    }
    if (next) sfx.tone(880, 0.06, "triangle", 0.04, 0, 1320)
    else sfx.tone(700, 0.06, "triangle", 0.035, 0, 460)
  }

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-busy={pending || undefined}
      disabled={disabled}
      data-slot="settings-switch"
      data-notchset=""
      onClick={toggle}
      onPointerDown={(e) => {
        if (!e.button) setPressed(true)
      }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={cn(
        "relative h-7 w-[46px] shrink-0 cursor-pointer rounded-full outline-none [transition:background-color_.3s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        !on && "bg-[color-mix(in_oklab,var(--foreground)_16%,transparent)]",
        shakes > 0 && (shakes % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]"),
        className
      )}
      style={{ ...(on ? { background: pending ? `color-mix(in oklab, ${color} 55%, var(--muted))` : color } : null), ...style }}
      {...props}
    >
      <span
        aria-hidden="true"
        className="absolute top-1 grid h-5 place-items-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] [transition:inset-inline-start_.4s_cubic-bezier(.2,1.4,.3,1),width_.28s_cubic-bezier(.2,1.4,.3,1)] motion-reduce:transition-none"
        style={{ insetInlineStart: on ? 42 - w : 4, width: w, color }}
      >
        <svg viewBox="0 0 24 24" className="size-[11px] [transition:opacity_.2s,scale_.35s_var(--ns-ease-rebound)]" style={{ opacity: checked && !pending ? 1 : 0, scale: checked && !pending ? "1" : ".4" }} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <span className="absolute start-1/2 top-1/2 -ms-1.5 -mt-1.5 size-3 animate-[ns-spin_.7s_linear_infinite] rounded-full border-2 border-current border-t-transparent [transition:opacity_.2s]" style={{ opacity: pending ? 1 : 0 }} />
      </span>
    </button>
  )
})

interface SwitchRowProps extends Omit<SettingsSwitchProps, "title"> {
  title: string
  subtitle?: React.ReactNode | undefined
  icon?: React.ReactNode | undefined
  /** Unfolds under the row while it's on. */
  children?: React.ReactNode | undefined
  /** Tints the subtitle, e.g. for an error. */
  tone?: "default" | "error" | "success" | undefined
}

function SwitchRow({ title, subtitle, icon, children, tone = "default", checked, color = "var(--success,var(--foreground))", ...props }: SwitchRowProps) {
  return (
    <div data-slot="switch-row" className="[&+&]:border-t [&+&]:border-[var(--border)]">
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        {icon && (
          <span
            aria-hidden="true"
            className={cn("grid size-[34px] shrink-0 place-items-center rounded-[11px] [transition:background-color_.3s,color_.3s] [&_svg]:size-4", !checked && "bg-[var(--muted)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
            style={checked ? { background: `color-mix(in oklab, ${color} 15%, transparent)`, color } : undefined}
          >
            {icon}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[length:var(--ns-type-copy)] font-semibold">{title}</span>
          {subtitle && (
            <span
              aria-live="polite"
              className={cn(
                "text-[12.5px] [text-wrap:pretty] [transition:color_.3s]",
                tone === "error" && "text-[var(--destructive)]",
                tone === "success" && "text-[color-mix(in_oklab,var(--success,var(--foreground))_75%,var(--foreground))]",
                tone === "default" && "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
              )}
            >
              {subtitle}
            </span>
          )}
        </span>
        <SettingsSwitch aria-label={title} checked={checked} color={color} {...props} />
      </div>
      {children != null && (
        <Collapse open={checked}>
          <div className="ps-16 pe-4 pb-3.5">{children}</div>
        </Collapse>
      )}
    </div>
  )
}

export { SettingsSwitch, SwitchRow, type SettingsSwitchProps, type SwitchRowProps }
