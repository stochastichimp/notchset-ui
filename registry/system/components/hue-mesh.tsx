// Notchset hue-mesh 2.0.0 · https://notchset.dev/changelog
"use client";
import { cn } from "@/lib/utils";

/*
 * Hue mesh: a tile lit by its identity hue (a body system's: Heart, Sleep, Recovery…), a soft pastel mesh of one of the
 * family's validated category hues (--ns-cat-1…6, the ones labels use) over frosted white; deep and glowing in the
 * dark. Light has one source: every mesh enters from the same top-left corner, so a screen of tiles reads as one lit
 * space. Identity, never standing: a value's standing is its dot and its word.
 *
 *   <div className="relative isolate overflow-hidden rounded-[inherit]"><HueMesh hue={3} /> …the tile… </div>
 */
type HueMeshProps = {
  /** which category hue, 1–6 */
  hue: 1 | 2 | 3 | 4 | 5 | 6;
  /** how much light falls on it (0–1) */
  strength?: number | undefined;
  className?: string | undefined;
};

const HUES = { 1: "var(--ns-cat-1)", 2: "var(--ns-cat-2)", 3: "var(--ns-cat-3)", 4: "var(--ns-cat-4)", 5: "var(--ns-cat-5)", 6: "var(--ns-cat-6)" } as const;

function HueMesh({ hue, strength = 1, className }: HueMeshProps) {
  const c = HUES[hue];
  return (
    <div
      aria-hidden
      data-slot="hue-mesh"
      className={cn("pointer-events-none absolute inset-0 -z-10 rounded-[inherit]", className)}
      style={{
        opacity: strength,
        backgroundColor: "var(--ns-mesh-frost)",
        backgroundImage: [
          `radial-gradient(110% 85% at 0% 0%, color-mix(in oklab, ${c} var(--ns-mesh), transparent) 0%, transparent 62%)`,
          `radial-gradient(60% 55% at 22% 8%, color-mix(in oklab, ${c} calc(var(--ns-mesh) * 0.9), white 18%) 0%, transparent 70%)`,
          `radial-gradient(90% 70% at 100% 100%, color-mix(in oklab, ${c} calc(var(--ns-mesh) * 0.22), transparent) 0%, transparent 70%)`,
        ].join(", "),
      }}
    />
  );
}

export { HueMesh, type HueMeshProps };
