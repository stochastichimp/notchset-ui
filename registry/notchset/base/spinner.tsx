"use client"

/**
 * Spinner (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/spinner
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { DrawCheck } from "@/lib/notchset/shared"

/*
 * Spinner: four ways to say working (orbit, dots, bars, arc) at 16, 24 or 32px. With `done` the spinner
 * shrinks away as a green check draws in its place. Loops stop under reduced motion.
 */

interface SpinnerProps extends React.ComponentPropsWithoutRef<"span"> {
  variant?: "orbit" | "dots" | "bars" | "arc" | undefined
  size?: 16 | 24 | 32 | undefined
  done?: boolean | undefined
  /** Screen reader text. Default "Loading" (and "Done" when done). */
  label?: string | undefined
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner({ variant = "arc", size = 24, done = false, label, className, ...props }, ref) {
  const k = size / 24
  return (
    <span ref={ref} role="status" data-slot="spinner" data-notchset="" className={cn("relative inline-grid shrink-0 place-items-center text-[var(--foreground)]", className)} style={{ width: size, height: size }} {...props}>
      <span className="sr-only">{label ?? (done ? "Done" : "Loading")}</span>
      <span aria-hidden="true" className={cn("col-start-1 row-start-1 grid place-items-center [transition:transform_.35s_cubic-bezier(.6,0,.2,1),scale_.35s_cubic-bezier(.6,0,.2,1),translate_.35s_cubic-bezier(.6,0,.2,1),rotate_.35s_cubic-bezier(.6,0,.2,1),opacity_.25s]", done ? "scale-[.4] opacity-0" : "scale-100 opacity-100")} style={{ width: size, height: size }}>
        {variant === "orbit" && (
          <span className="relative block animate-[ns-spin_1s_linear_infinite] rounded-full border-2 border-[var(--border)]" style={{ width: size * 0.8, height: size * 0.8 }}>
            <span className="absolute -top-[4px] start-1/2 block -translate-x-1/2 rounded-full bg-current rtl:translate-x-1/2" style={{ width: 6 * k, height: 6 * k, top: -4 * k }} />
          </span>
        )}
        {variant === "dots" && (
          <span className="flex items-center" style={{ gap: 3 * k }}>
            {[0, 0.15, 0.3].map((d) => (
              <span key={d} className="block animate-[ns-wave_.9s_ease-in-out_infinite] rounded-full bg-current" style={{ width: 5 * k, height: 5 * k, animationDelay: `${d}s` }} />
            ))}
          </span>
        )}
        {variant === "bars" && (
          <span className="flex items-center" style={{ gap: 2.5 * k, height: 18 * k }}>
            {[0, 0.12, 0.24, 0.36].map((d) => (
              <span key={d} className="block h-full animate-[ns-eq_.9s_ease-in-out_infinite] rounded-full bg-current" style={{ width: 3 * k, animationDelay: `${d}s` }} />
            ))}
          </span>
        )}
        {variant === "arc" && (
          <svg viewBox="0 0 24 24" className="animate-[ns-spin_1.4s_linear_infinite]" style={{ width: size, height: size }} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" className="animate-[ns-dash_1.4s_ease-in-out_infinite]" />
          </svg>
        )}
      </span>
      <span aria-hidden="true" className="col-start-1 row-start-1 grid place-items-center text-[var(--success,var(--foreground))]">
        <DrawCheck shown={done} className="delay-[120ms]" />
      </span>
    </span>
  )
})

export { Spinner, type SpinnerProps }
