"use client"

/**
 * Resolvable Alert (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/resolvable-alert
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Collapse } from "@/lib/notchset/collapse"
import { useSound } from "@/lib/notchset/sound"

/*
 * Resolvable Alert: an alert that carries its own fix. It moves from warning to working to resolved:
 * the border, wash and icon tile follow the tone (amber, blue, green), the icon goes triangle → spinner
 * → check, the title rolls through three lines, and both buttons roll their labels (each label window
 * animates its width so the button stays centred). Closing folds it away and leaves a "Show it again"
 * link. Put any readout (a meter, a list) in children.
 */

type AlertPhase = "warning" | "working" | "resolved"

interface ResolvableAlertProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  phase: AlertPhase
  title: Record<AlertPhase, string>
  description?: Partial<Record<AlertPhase, React.ReactNode>> | undefined
  /** The main button's label per phase, and what it does. */
  primary: { labels: Record<AlertPhase, string>; onClick: () => void }
  secondary?: { labels: Record<AlertPhase, string>; onClick: () => void } | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The link left when it's closed. */
  reopenLabel?: string | undefined
  sound?: boolean | undefined
}

const TONE: Record<AlertPhase, string> = { warning: "var(--warning,var(--chart-4))", working: "var(--info,var(--chart-1))", resolved: "var(--success,var(--chart-3))" }
const IDX: Record<AlertPhase, number> = { warning: 0, working: 1, resolved: 2 }

/** A button label that rolls between its phases inside a window as wide as the current one. */
function Rolling({ labels, index }: { labels: readonly string[]; index: number }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [widths, setWidths] = React.useState<number[]>([])
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidths(Array.from(el.children).map((c) => (c as HTMLElement).scrollWidth)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <span className="block h-[18px] overflow-hidden [transition:width_.45s_cubic-bezier(.2,1.2,.3,1)] motion-reduce:transition-none" style={{ width: widths[index] || undefined }}>
      <span ref={ref} className="flex w-max flex-col [transition:translate_.5s_var(--ns-ease-reshape)] motion-reduce:transition-none" style={{ translate: `0 ${-index * 18}px` }}>
        {labels.map((l, i) => (
          <span key={i} aria-hidden={i === index ? undefined : true} className="h-[18px] leading-[18px] whitespace-nowrap">
            {l}
          </span>
        ))}
      </span>
    </span>
  )
}

const ResolvableAlert = React.forwardRef<HTMLDivElement, ResolvableAlertProps>(function ResolvableAlert(
  { phase, title, description, primary, secondary, open, onOpenChange, reopenLabel = "Show it again", sound = true, className, children, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const i = IDX[phase]
  const c = TONE[phase]
  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (phase === "working") sfx.noise(0.6, 0.03, 2600, 500)
    else if (phase === "resolved") sfx.chime()
  }, [phase, sfx])
  const order: AlertPhase[] = ["warning", "working", "resolved"]

  return (
    <div ref={ref} data-slot="resolvable-alert" data-notchset="" className={cn("flex w-full max-w-[470px] flex-col gap-3", className)} {...props}>
      <Collapse open={open}>
        <div className="p-0.5">
          <div role="alert" className="grid grid-cols-[36px_minmax(0,1fr)] gap-x-3.5 rounded-[20px] border p-4 [transition:border-color_.45s,background-color_.45s]" style={{ borderColor: `color-mix(in oklab, ${c} 38%, var(--border))`, background: `color-mix(in oklab, ${c} 6%, var(--background))` }}>
            <span aria-hidden="true" className="relative size-9 rounded-[12px] [transition:background-color_.45s,color_.45s]" style={{ background: `color-mix(in oklab, ${c} 16%, transparent)`, color: c }}>
              <span className="absolute inset-0 grid place-items-center [transition:opacity_.2s,scale_.4s_var(--ns-ease-rebound)]" style={{ opacity: i === 0 ? 1 : 0, scale: i === 0 ? "1" : "0" }}>
                <svg viewBox="0 0 24 24" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </span>
              <span className="absolute start-1/2 top-1/2 -ms-2 -mt-2 size-4 animate-[ns-spin_.7s_linear_infinite] rounded-full border-2 border-current border-t-transparent [transition:opacity_.2s]" style={{ opacity: i === 1 ? 1 : 0 }} />
              <span className="absolute inset-0 grid place-items-center [transition:opacity_.2s,scale_.4s_var(--ns-ease-rebound)]" style={{ opacity: i === 2 ? 1 : 0, scale: i === 2 ? "1" : ".4" }}>
                <svg viewBox="0 0 24 24" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            </span>
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-col gap-[3px]">
                <span className="block h-5 overflow-hidden text-[14.5px] font-semibold tracking-[var(--ns-tracking-control)]">
                  <span className="flex flex-col [transition:translate_.5s_var(--ns-ease-reshape)] motion-reduce:transition-none" style={{ translate: `0 ${-i * 20}px` }}>
                    {order.map((p) => (
                      <span key={p} aria-hidden={p === phase ? undefined : true} className="h-5 truncate leading-5">
                        {title[p]}
                      </span>
                    ))}
                  </span>
                </span>
                {description?.[phase] && <span className="text-[length:var(--ns-type-label)] leading-[var(--ns-leading-prose)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [text-wrap:pretty]">{description[phase]}</span>}
              </div>
              {children}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-disabled={phase === "working" || undefined}
                  onClick={() => phase !== "working" && primary.onClick()}
                  className={cn(
                    "flex h-9 cursor-pointer items-center justify-center rounded-full px-4 text-[length:var(--ns-type-label)] font-semibold whitespace-nowrap text-[var(--background)] outline-none [transition:background-color_.3s,scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 active:scale-[var(--ns-press-depth)]",
                    phase === "working" ? "cursor-default bg-[color-mix(in_oklab,var(--foreground)_55%,var(--background))]" : "bg-[var(--foreground)]"
                  )}
                >
                  <Rolling labels={order.map((p) => primary.labels[p])} index={i} />
                </button>
                {secondary && (
                  <button
                    type="button"
                    aria-disabled={phase === "working" || undefined}
                    onClick={() => phase !== "working" && secondary.onClick()}
                    className={cn("flex h-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap outline-none [transition:background-color_.3s,opacity_.25s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)]", phase === "working" && "opacity-40")}
                  >
                    <Rolling labels={order.map((p) => secondary.labels[p])} index={i} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Collapse>
      <Collapse open={!open}>
        <button
          type="button"
          onClick={() => {
            sfx.pop()
            onOpenChange(true)
          }}
          className="cursor-pointer rounded-[4px] px-1 text-[length:var(--ns-type-label)] font-medium underline decoration-[var(--border)] underline-offset-[3px] outline-none hover:decoration-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
        >
          {reopenLabel}
        </button>
      </Collapse>
    </div>
  )
})

export { ResolvableAlert, type AlertPhase, type ResolvableAlertProps }
