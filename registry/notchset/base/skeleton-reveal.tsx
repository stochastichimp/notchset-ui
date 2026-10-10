"use client"

/**
 * Skeleton Reveal (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/skeleton-reveal
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * Skeleton Reveal: while loading, an avatar and three bars breathe in a wave from the start edge (not a
 * shimmer); when the content arrives each part un-blurs and rises in turn. Pass the parts; the layout
 * is the card's.
 */

interface SkeletonRevealProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  loading: boolean
  /** The avatar slot (e.g. an Avatar). */
  media?: React.ReactNode | undefined
  title: React.ReactNode
  body: React.ReactNode
  /** Screen reader text while loading. Default "Loading". */
  loadingLabel?: string | undefined
}

const SkeletonReveal = React.forwardRef<HTMLDivElement, SkeletonRevealProps>(function SkeletonReveal({ loading, media, title, body, loadingLabel = "Loading", className, ...props }, ref) {
  return (
    <div ref={ref} data-slot="skeleton-reveal" data-notchset="" aria-busy={loading || undefined} className={cn("flex w-full gap-3.5", className)} {...props}>
      {loading ? (
        <>
          <span className="sr-only" role="status">
            {loadingLabel}
          </span>
          <span aria-hidden="true" className="size-11 shrink-0 animate-[ns-skel_1.2s_ease-in-out_infinite] rounded-full bg-[var(--muted)]" />
          <span aria-hidden="true" className="flex min-w-0 flex-1 flex-col gap-2.5 pt-1">
            <span className="block h-[13px] w-[48%] animate-[ns-skel_1.2s_ease-in-out_infinite] rounded-[5px] bg-[var(--muted)] [animation-delay:.08s]" />
            <span className="block h-2.5 w-full animate-[ns-skel_1.2s_ease-in-out_infinite] rounded-[5px] bg-[var(--muted)] [animation-delay:.16s]" />
            <span className="block h-2.5 w-[82%] animate-[ns-skel_1.2s_ease-in-out_infinite] rounded-[5px] bg-[var(--muted)] [animation-delay:.24s]" />
          </span>
        </>
      ) : (
        <>
          {media != null && <span className="shrink-0 animate-[ns-reveal_.5s_cubic-bezier(.2,.8,.2,1)_both]">{media}</span>}
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="animate-[ns-reveal_.5s_cubic-bezier(.2,.8,.2,1)_.08s_both] text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)]">{title}</span>
            <span className="animate-[ns-reveal_.5s_cubic-bezier(.2,.8,.2,1)_.16s_both] text-[length:var(--ns-type-label)] leading-5 text-[var(--muted-foreground)]">{body}</span>
          </span>
        </>
      )}
    </div>
  )
})

export { SkeletonReveal, type SkeletonRevealProps }
