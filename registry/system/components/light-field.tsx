// Notchset light-field 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useAwake } from "@/lib/notchset/living";

/*
 * Light field: the one light on a page, a large soft field of the Signature's light falling across the page's top
 * from the right (by day Amethyst's periwinkle wash on Mineral; by night a tall edge light down the right side, in
 * Graphite's silver on the family's near-black). Three soft lights, blurred, with grain on top so it reads as light on
 * a material; it drifts within a few percent over a minute and holds still under reduced motion. Never an orb shape,
 * never a data hue, never a standing. One per page, placed in the page's top section and spilling past it (behind the
 * top bar too). The drift moves a layer drawn once (transform only), pauses while the tab is hidden or the field is
 * off screen (living.ts), and stops with `still` where another part is the page's one living thing (the coach's orb).
 *
 *   <section className="relative"><LightField className="-inset-x-[20%] -top-[30%] -bottom-[30%]" /> …</section>
 */
function LightField({ at = "73% 59%", still = false, className }: { at?: string | undefined; still?: boolean | undefined; className?: string | undefined }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useAwake(ref, !still);
  /* how far the lights reach is the mode's (--ns-light-spread), so the falloff tightens by night */
  const k = (n: number) => `calc(${n}% * var(--ns-light-spread))`;
  const [x = 73, y = 59] = at.split(" ").map((v) => parseFloat(v));
  return (
    <div ref={ref} aria-hidden data-slot="light-field" data-drift={!still || undefined} className={cn("pointer-events-none absolute inset-0 -z-10", className)}>
      {/* the drift moves this layer; the blur is drawn once inside it */}
      <div data-ns-still="" className={cn("absolute -inset-[20%]", !still && "animate-[ns-light-drift_60s_ease-in-out_infinite] will-change-transform")} style={{ transformOrigin: `${x}% ${y}%` }}>
      <div
        className="absolute inset-0 blur-[42px]"
        style={{
          opacity: "var(--ns-light-strength)",
          backgroundImage: [
            `radial-gradient(${k(34)} ${k(44)} at ${x}% ${y}%, var(--ns-light-1) 0%, color-mix(in oklab, var(--ns-light-1) 60%, transparent) 40%, transparent 100%)`,
            `radial-gradient(${k(40)} ${k(40)} at ${x - 16}% ${y + 24}%, var(--ns-light-2) 0%, transparent 100%)`,
            `radial-gradient(${k(22)} ${k(26)} at ${x + 10}% ${y - 14}%, var(--ns-light-3) 0%, transparent 100%)`,
          ].join(", "),
        }}
      />
      </div>
      {/* the grain over the light, so the colour reads as material */}
      <div className="absolute -inset-[20%] [background-image:var(--ns-grain)] [mask-image:radial-gradient(closest-side,#000_40%,transparent)]" />
    </div>
  );
}

export { LightField };
