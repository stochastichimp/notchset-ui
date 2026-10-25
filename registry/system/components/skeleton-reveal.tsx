// Notchset skeleton-reveal 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/notchset/skeleton";

/*
 * Skeleton reveal: the shape of what's coming while it loads, then the real thing in its place with no jump.
 * The placeholder and the content share one box (they stack in the same grid cell), so the box is as tall as
 * the taller of the two from the first frame: give the shape the rows the content will have and nothing below
 * moves when it lands. On ready, the rows rise in with a short stagger. Never a spinner in content; the region
 * says aria-busy while it loads. Less motion (the app's data-motion="reduced", or the device's setting, which
 * always wins) fades every row in at once, through the shared data-ns-stagger rule.
 *
 *   <SkeletonReveal ready={!!deals} label="Deals" shape={{ rows: 4, avatar: true, lines: 2, height: 56 }}>
 *     {deals?.map((d) => <DealRow key={d.id} d={d} />)}
 *   </SkeletonReveal>
 */
type SkeletonShape = {
  /** how many rows the content will have */
  rows?: number | undefined;
  /** lines of text per row (1–3) */
  lines?: number | undefined;
  /** a round mark at the start of each row */
  avatar?: boolean | undefined;
  /** a figure at the end of each row */
  figure?: boolean | undefined;
  /** each row's height in px, matching the real rows */
  height?: number | undefined;
};
type SkeletonRevealProps = {
  ready: boolean;
  /** what is loading, for screen readers */
  label: string;
  shape?: SkeletonShape | undefined;
  children?: React.ReactNode;
  className?: string | undefined;
};

/* line widths that read as text, not as a barcode */
const WIDTH = ["62%", "38%", "48%"];

function SkeletonReveal({ ready, label, shape = {}, children, className }: SkeletonRevealProps) {
  const { rows = 3, lines = 2, avatar = false, figure = false, height = 52 } = shape;
  return (
    <div data-slot="skeleton-reveal" aria-busy={!ready} aria-label={ready ? undefined : `Loading ${label}`} className={cn("grid", className)}>
      <div
        aria-hidden
        data-ns-glide=""
        className={cn("col-start-1 row-start-1 flex flex-col [transition:opacity_var(--ns-time-menu)_var(--ns-ease)]", ready && "pointer-events-none opacity-0")}
      >
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} style={{ height }} className="flex items-center gap-3 border-b border-[var(--ns-line-soft)] last:border-b-0">
            {avatar && <Skeleton width={28} height={28} className="shrink-0 rounded-full" />}
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              {Array.from({ length: Math.min(3, Math.max(1, lines)) }, (_, l) => (
                <Skeleton key={l} width={WIDTH[(l + r) % WIDTH.length]} height={l === 0 ? 11 : 9} />
              ))}
            </span>
            {figure && <Skeleton width={56} height={11} className="shrink-0" />}
          </div>
        ))}
      </div>
      {ready && (
        <div data-ns-stagger="" className="col-start-1 row-start-1 flex min-w-0 flex-col [&>*]:[animation:ns-rise_var(--ns-time-page)_var(--ns-ease)_both] [&>*:nth-child(2)]:[animation-delay:40ms] [&>*:nth-child(3)]:[animation-delay:80ms] [&>*:nth-child(4)]:[animation-delay:120ms] [&>*:nth-child(5)]:[animation-delay:160ms] [&>*:nth-child(n+6)]:[animation-delay:200ms]">
          {children}
        </div>
      )}
    </div>
  );
}

export { SkeletonReveal, type SkeletonRevealProps, type SkeletonShape };
