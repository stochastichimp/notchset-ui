"use client"

/**
 * Skeleton Fit (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/skeleton-fit
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Skeleton Fit: placeholders that resize to the real text. Each block starts at a generic width, and
 * when the data lands it animates to the measured text width (the text sits invisibly inside it), fades,
 * and the text sharpens in from a blur, staggered by row and field. Photos fade in from a blur. The
 * header folds the list into a summary of stacked faces.
 */

interface FitTextProps extends React.ComponentPropsWithoutRef<"span"> {
  loading: boolean
  /** The placeholder's width while loading, px. */
  width: number
  /** The placeholder's height, px. */
  height?: number | undefined
  /** Stagger, ms. */
  delay?: number | undefined
}

/** A text placeholder that grows or shrinks to the text it holds, then hands over to it. */
function FitText({ loading, width, height = 12, delay = 0, className, children, ...props }: FitTextProps) {
  return (
    <span data-slot="fit-text" aria-busy={loading || undefined} className="relative inline-block max-w-full">
      <span
        aria-hidden="true"
        className={cn("absolute start-0 top-1/2 rounded-[5px] bg-[var(--muted)]", loading && "animate-[ns-skel_1.2s_ease-in-out_infinite] motion-reduce:animate-none")}
        style={{
          height,
          marginTop: -height / 2,
          width: loading ? width : "100%",
          opacity: loading ? 1 : 0,
          animationDelay: `${delay}ms`,
          transition: loading ? "width .3s ease, opacity .2s" : `width .55s cubic-bezier(.2,1.15,.3,1) ${delay}ms, opacity .3s ease ${delay + 420}ms`,
        }}
      />
      <span
        className={cn("motion-reduce:transition-none! relative inline-flex items-center gap-1.5 whitespace-nowrap", className)}
        style={{ opacity: loading ? 0 : 1, filter: loading ? "blur(4px)" : "blur(0px)", transition: loading ? "opacity .15s, filter .15s" : `opacity .35s ease ${delay + 320}ms, filter .45s ease ${delay + 320}ms` }}
        {...props}
      >
        {children}
      </span>
    </span>
  )
}

interface FitRow {
  id: string
  name: string
  status: string
  /** The status dot. */
  tone?: "success" | "warning" | "muted" | undefined
  amount: string
  avatar?: string | undefined
  /** Placeholder widths for name, status and amount while loading. */
  widths?: readonly [number, number, number] | undefined
}

interface SkeletonFitProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  title: React.ReactNode
  total: string
  rows: readonly FitRow[]
  loading: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Shown when folded: "3 payouts · 1 scheduled". */
  summary?: React.ReactNode | undefined
  onReload?: (() => void) | undefined
  reloadLabel?: string | undefined
  sound?: boolean | undefined
}

const TONES = { success: "var(--success,var(--foreground))", warning: "var(--warning,var(--chart-4))", muted: "var(--muted-foreground)" }

const SkeletonFit = React.forwardRef<HTMLDivElement, SkeletonFitProps>(function SkeletonFit(
  { title, total, rows, loading, open, onOpenChange, summary, onReload, reloadLabel = "Load again", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const listId = React.useId()
  const was = React.useRef(loading)
  React.useEffect(() => {
    if (was.current && !loading) sfx.reveal()
    was.current = loading
  }, [loading, sfx])

  return (
    <div ref={ref} data-slot="skeleton-fit" data-notchset="" className={cn("flex w-full max-w-[380px] flex-col items-center gap-4", className)} {...props}>
      <div aria-busy={loading || undefined} className="w-full rounded-[22px] border border-[var(--border)] bg-[var(--background)] px-[18px] pt-[18px] pb-2 text-[var(--foreground)]">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            if (open) sfx.close()
            else sfx.open()
            onOpenChange(!open)
          }}
          className="flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-[8px] pb-1.5 text-start outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
        >
          <span className="flex items-center gap-2 text-[length:var(--ns-type-copy)] font-medium whitespace-nowrap">
            <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-3.5 [transition:rotate_.4s_var(--ns-ease-pop)]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]", !open && "-rotate-90 rtl:rotate-90")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
            {title}
          </span>
          <FitText loading={loading} width={70} height={14} className="font-mono text-[length:var(--ns-type-copy)] font-medium">
            {total}
          </FitText>
        </button>
        <div id={listId} className={cn("grid [transition:grid-template-rows_.5s_var(--ns-ease-settle)] motion-reduce:transition-none", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
          <div className="min-h-0 overflow-hidden" ref={(el) => {
            el?.toggleAttribute("inert", !open)
          }}>
            {rows.map((r, i) => {
              const d = i * 90
              const [wn, ws, wa] = r.widths ?? [120, 84, 52]
              return (
                <div key={r.id} className="grid grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-3 border-t border-[var(--border)] py-3">
                  <span aria-hidden="true" className={cn("relative size-[38px] rounded-full bg-[var(--muted)]", loading && "animate-[ns-skel_1.2s_ease-in-out_infinite] motion-reduce:animate-none")} style={{ animationDelay: `${d}ms` }}>
                    {r.avatar && (
                      <span
                        className="absolute inset-0 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${r.avatar})`, opacity: loading ? 0 : 1, filter: loading ? "blur(6px)" : "blur(0px)", transition: `opacity .45s ease ${loading ? 0 : d + 260}ms, filter .5s ease ${loading ? 0 : d + 260}ms` }}
                      />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col items-start gap-[5px]">
                    <FitText loading={loading} width={wn} delay={d} className="text-[length:var(--ns-type-copy)] font-medium">
                      {r.name}
                    </FitText>
                    <FitText loading={loading} width={ws} height={9} delay={d + 40} className={cn("text-[length:var(--ns-type-note)]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>
                      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: TONES[r.tone ?? "muted"] }} />
                      {r.status}
                    </FitText>
                  </span>
                  <FitText loading={loading} width={wa} delay={d + 80} className="font-mono text-[length:var(--ns-type-label)]">
                    {r.amount}
                  </FitText>
                </div>
              )
            })}
          </div>
        </div>
        <div className={cn("grid [transition:grid-template-rows_.5s_var(--ns-ease-settle)] motion-reduce:transition-none", open ? "grid-rows-[0fr]" : "grid-rows-[1fr]")}>
          <div className="min-h-0 overflow-hidden">
            <div className={cn("flex items-center gap-2.5 pt-2 pb-2.5 text-[length:var(--ns-type-note)] whitespace-nowrap", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>
              <span aria-hidden="true" className="flex ps-1.5">
                {rows.slice(0, 3).map((r) => (
                  <span key={r.id} className="-ms-1.5 size-6 rounded-full bg-[var(--muted)] bg-cover bg-center shadow-[0_0_0_2px_var(--background)]" style={r.avatar ? { backgroundImage: `url(${r.avatar})` } : undefined} />
                ))}
              </span>
              <span className="min-w-0 truncate">{summary}</span>
            </div>
          </div>
        </div>
      </div>
      {onReload && (
        <button
          type="button"
          onClick={() => {
            if (loading) return
            sfx.tick()
            onReload()
          }}
          className="inline-flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap text-[var(--foreground)] outline-none [transition:background-color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-3.5", loading && "animate-[ns-spin_.8s_linear_infinite] motion-reduce:animate-none")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          {reloadLabel}
        </button>
      )}
    </div>
  )
})

export { FitText, SkeletonFit, type FitRow, type FitTextProps, type SkeletonFitProps }
