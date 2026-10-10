"use client"

/**
 * Morph Loader (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/morph-loader
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { RollingLabel } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Morph Loader: one loader, three shapes. Three dots morph between bouncing dots, a bar wave and an orbit
 * (position, size and radius all spring), so switching is one continuous motion. When the work ends the
 * dots gather to the centre and a circle pops in: green with a check that draws, or red with an × whose
 * strokes draw one after the other, then a shake. The status line rolls with it.
 */

type LoaderVariant = "dots" | "bars" | "orbit"
type LoaderStatus = "loading" | "success" | "error"

interface MorphLoaderProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  variant?: LoaderVariant | undefined
  status: LoaderStatus
  /** The status line for each state. */
  labels?: Partial<Record<LoaderStatus, React.ReactNode>> | undefined
  sound?: boolean | undefined
}

const POINTS: Record<LoaderVariant, [number, number][]> = {
  dots: [
    [-18, 0],
    [0, 0],
    [18, 0],
  ],
  bars: [
    [-12, 0],
    [0, 0],
    [12, 0],
  ],
  orbit: [
    [0, -18],
    [15.6, 9],
    [-15.6, 9],
  ],
}
const SIZES: Record<LoaderVariant, [number, number]> = { dots: [10, 10], bars: [6, 28], orbit: [9, 9] }
const ORDER: LoaderStatus[] = ["loading", "success", "error"]
const SPRING = "cubic-bezier(.2,1.4,.3,1)"

const MorphLoader = React.forwardRef<HTMLDivElement, MorphLoaderProps>(function MorphLoader({ variant = "dots", status, labels, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const done = status !== "loading"
  const heard = React.useRef({ status, variant })
  React.useEffect(() => {
    const was = heard.current
    heard.current = { status, variant }
    if (variant !== was.variant && status === "loading") {
      const i = ["dots", "bars", "orbit"].indexOf(variant)
      sfx.tone(600 + i * 150, 0.07, "triangle", 0.035, 0, 820 + i * 150)
    }
    if (status !== was.status && status !== "loading") {
      sfx.tone(500, 0.12, "sine", 0.04, 0, 900)
      const t = window.setTimeout(() => (status === "success" ? sfx.chime() : sfx.buzz()), 300)
      return () => window.clearTimeout(t)
    }
  }, [status, variant, sfx])

  const text = { loading: "Syncing changes…", success: "All changes synced", error: "Couldn’t reach the server", ...labels }
  const [w, h] = done ? [12, 12] : SIZES[variant]

  return (
    <div ref={ref} data-slot="morph-loader" data-notchset="" data-status={status} className={cn("flex flex-col items-center gap-[26px] text-[var(--foreground)]", className)} {...props}>
      <div role="img" aria-label={typeof text[status] === "string" ? (text[status] as string) : status} className="relative grid size-[120px] place-items-center">
        <div aria-hidden="true" className={cn("absolute inset-0", variant === "orbit" && !done && "animate-[ns-spin_1.6s_linear_infinite] motion-reduce:animate-none")}>
          {POINTS[variant].map(([x, y], i) => (
            <span key={i} className="absolute start-1/2 top-1/2 size-0" style={{ transform: done ? "translate(0,0)" : `translate(${x}px,${y}px)`, transition: `transform .55s ${SPRING}` }}>
              <span
                className="motion-reduce:animate-none! motion-reduce:transition-none! absolute bg-[var(--foreground)]"
                style={{
                  left: -w / 2,
                  top: -h / 2,
                  width: w,
                  height: h,
                  borderRadius: Math.min(w, h) / 2,
                  opacity: done ? 0 : 1,
                  animation: done ? "none" : variant === "dots" ? `ns-bounce .9s ease-in-out ${i * 0.12}s infinite` : variant === "bars" ? `ns-eq .9s ease-in-out ${i * 0.12}s infinite` : `ns-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  transition: `width .45s ${SPRING}, height .45s ${SPRING}, left .45s ${SPRING}, top .45s ${SPRING}, border-radius .45s, opacity .25s ease .14s`,
                }}
              />
            </span>
          ))}
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "relative grid size-[50px] place-items-center rounded-full [transition:scale_.5s_var(--ns-ease-rebound)_.12s,background-color_.2s]",
            done ? "scale-100" : "scale-0",
            status === "error" ? "bg-[var(--destructive)] text-[var(--destructive-foreground,#fff)]" : "bg-[var(--success,var(--foreground))] text-[var(--success-foreground,var(--background))]",
            status === "error" && "animate-[ns-shake_.42s_.45s]",
            "motion-reduce:animate-none"
          )}
        >
          <svg viewBox="0 0 24 24" className="absolute size-[22px]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5 10 17.5 19 7" pathLength={1} className="[stroke-dasharray:1] [transition:stroke-dashoffset_.4s_cubic-bezier(.6,0,.2,1)_.32s]" style={{ strokeDashoffset: status === "success" ? 0 : 1 }} />
            <path d="M7 7l10 10" pathLength={1} className="[stroke-dasharray:1] [transition:stroke-dashoffset_.3s_cubic-bezier(.6,0,.2,1)_.3s]" style={{ strokeDashoffset: status === "error" ? 0 : 1 }} />
            <path d="M17 7 7 17" pathLength={1} className="[stroke-dasharray:1] [transition:stroke-dashoffset_.3s_cubic-bezier(.6,0,.2,1)_.42s]" style={{ strokeDashoffset: status === "error" ? 0 : 1 }} />
          </svg>
        </span>
      </div>
      <span aria-live="polite" className="text-[length:var(--ns-type-copy)] font-medium">
        <RollingLabel index={ORDER.indexOf(status)} rows={ORDER.map((s) => <React.Fragment key={s}>{text[s]}</React.Fragment>)} />
      </span>
    </div>
  )
})

export { MorphLoader, type LoaderStatus, type LoaderVariant, type MorphLoaderProps }
