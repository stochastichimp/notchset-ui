"use client"

/**
 * Theme Switch (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/theme-switch
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"
import { RollingLabel, prefersCalm } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Theme Switch: a sun whose rays fold away as a mask slides over its core to make a crescent, and a
 * page reveal that spreads the new theme in a circle from the button (the View Transitions API, where
 * the browser has it and motion is allowed; otherwise the switch is instant). Bring your own theme
 * state, e.g. next-themes: <ThemeSwitch theme={resolvedTheme} onThemeChange={setTheme} />.
 */

type Theme = "light" | "dark"

interface ThemeSwitchProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  /** "label" shows Light mode / Dark mode beside the icon; "icon" is a 36px square. Default "label". */
  variant?: "label" | "icon" | undefined
  /** Spread the new theme from the button with a View Transition. Default true. */
  reveal?: boolean | undefined
  sound?: boolean | undefined
}

function ThemeGlyph({ dark, size }: { dark: boolean; size: "sm" | "md" }) {
  const maskId = React.useId()
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("shrink-0 overflow-visible", size === "md" ? "size-[18px]" : "size-4")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <mask id={maskId}>
        <rect x="-4" y="-4" width="32" height="32" fill="white" />
        <circle cx="17" cy="7" r="6.5" fill="black" className="[transition:transform_.55s_var(--ns-ease-settle),scale_.55s_var(--ns-ease-settle),translate_.55s_var(--ns-ease-settle),rotate_.55s_var(--ns-ease-settle)]" style={{ transform: dark ? "translate(0px,0px)" : "translate(9px,-9px)" }} />
      </mask>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="currentColor"
        stroke="none"
        mask={`url(#${maskId})`}
        className="origin-[12px_12px] [transform-box:view-box] [transition:transform_.55s_var(--ns-ease-reshape),scale_.55s_var(--ns-ease-reshape),translate_.55s_var(--ns-ease-reshape),rotate_.55s_var(--ns-ease-reshape)]"
        style={{ transform: dark ? "scale(1)" : "scale(.5)" }}
      />
      <g
        className="origin-[12px_12px] [transform-box:view-box] [transition:transform_.5s_var(--ns-ease-settle),scale_.5s_var(--ns-ease-settle),translate_.5s_var(--ns-ease-settle),rotate_.5s_var(--ns-ease-settle),opacity_var(--ns-time-state)]"
        style={{ transform: dark ? "rotate(-90deg) scale(.4)" : "rotate(0deg) scale(1)", opacity: dark ? 0 : 1 }}
      >
        <path d="M12 1.5v2" />
        <path d="M12 20.5v2" />
        <path d="m4.6 4.6 1.4 1.4" />
        <path d="m18 18 1.4 1.4" />
        <path d="M1.5 12h2" />
        <path d="M20.5 12h2" />
        <path d="m6 18-1.4 1.4" />
        <path d="m19.4 4.6-1.4 1.4" />
      </g>
    </svg>
  )
}

const ThemeSwitch = React.forwardRef<HTMLButtonElement, ThemeSwitchProps>(function ThemeSwitch(
  { theme, onThemeChange, variant = "label", reveal = true, sound = true, disabled, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const dark = theme === "dark"

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next: Theme = dark ? "light" : "dark"
    sfx.toggle()
    const doc = document as Document & { startViewTransition?: ((update: () => void) => { ready: Promise<void> }) | undefined }
    const calm = prefersCalm(event.currentTarget)
    if (!reveal || calm || !doc.startViewTransition) {
      onThemeChange(next)
      return
    }
    const box = event.currentTarget.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    try {
      const transition = doc.startViewTransition(() => {
        flushSync(() => onThemeChange(next))
      })
      transition.ready
        .then(() => {
          const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 620, easing: "cubic-bezier(.65,0,.25,1)", pseudoElement: "::view-transition-new(root)" }
          )
        })
        .catch(() => undefined)
    } catch {
      onThemeChange(next)
    }
  }

  const icon = variant === "icon"
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      data-slot="theme-switch"
      data-notchset=""
      aria-checked={dark}
      aria-label="Dark mode"
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        icon ? "size-9 p-0 pointer-coarse:after:absolute pointer-coarse:after:-inset-1 pointer-coarse:after:content-['']" : "h-11 ps-4 pe-[18px]",
        className
      )}
      {...props}
    >
      <ThemeGlyph dark={dark} size={icon ? "sm" : "md"} />
      {!icon && <RollingLabel align="start" index={dark ? 1 : 0} rows={["Light mode", "Dark mode"]} className="w-[78px]" />}
    </button>
  )
})

export { ThemeSwitch, type ThemeSwitchProps }
