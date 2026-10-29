// Notchset prism-edge 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useAwake } from "@/lib/notchset/living";
import { useLessMotion } from "@/lib/notchset/physics";

/*
 * Prism edge: frosted glass's one moment. A hairline of the Signature turning through its light (deep to arc to
 * white, `--ns-prism-edge`) round the card, and a whisper of spectral tint at its top right corner
 * (`--ns-prism-tint`), all code. Used once in an app: the card where new results arrive (Health: Today's test card).
 * When `sweep` turns on (new results landed, living.ts `useArrival`), one band of light runs along the edge in about
 * 1.2 s, then `onSwept` and the edge rests; never on a mount or a re-render. Off screen or in a hidden tab the sweep
 * waits, so it plays where it is seen; under less motion the edge simply shows (and `onSwept` comes at once).
 * Put it first inside a `relative isolate overflow-hidden` host with rounded corners; it inherits the radius.
 *
 *   <section className="relative isolate overflow-hidden rounded-[var(--ns-radius-card)] …">
 *     <PrismEdge sweep={arrived} /> …
 *   </section>
 */
/** the hairline: only the 1px ring of the layer shows (the content box is masked out) */
const ring = "pointer-events-none absolute inset-0 rounded-[inherit] p-px [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]";

type PrismEdgeProps = {
  /** play the one sweep (new results landed) */
  sweep?: boolean | undefined;
  /** the sweep ended (or, under less motion, wasn't played) */
  onSwept?: (() => void) | undefined;
  className?: string | undefined;
};

function PrismEdge({ sweep = false, onSwept, className }: PrismEdgeProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const less = useLessMotion();
  /* the sweep waits until most of the card is seen */
  useAwake(ref, sweep, 0.6);
  React.useEffect(() => {
    if (sweep && less) onSwept?.();
  }, [sweep, less, onSwept]);
  return (
    <span ref={ref} aria-hidden data-slot="prism-edge" data-sweep={sweep || undefined} className={cn("pointer-events-none absolute inset-0 -z-10 rounded-[inherit]", className)}>
      <span className="absolute inset-0 rounded-[inherit] [background:var(--ns-prism-tint)]" />
      <span className={cn(ring, "opacity-60 [background:var(--ns-prism-edge)]")} />
      {sweep && (
        <>
          {/* the light crossing the glass: a faint sheen over the body, and the band along the edge */}
          <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
            <span data-ns-still="" className="absolute inset-0 animate-[ns-prism-sweep_1.2s_cubic-bezier(0.45,0,0.2,1)_both] opacity-0 [background:var(--ns-prism-glint)] will-change-transform" />
          </span>
          <span className={cn(ring, "z-10 overflow-hidden p-[1.5px]")}>
            <span data-ns-still="" onAnimationEnd={onSwept} className="absolute inset-0 animate-[ns-prism-sweep_1.2s_cubic-bezier(0.45,0,0.2,1)_both] opacity-0 [background:var(--ns-prism-sheen)] will-change-transform" />
          </span>
        </>
      )}
    </span>
  );
}

export { PrismEdge, type PrismEdgeProps };
