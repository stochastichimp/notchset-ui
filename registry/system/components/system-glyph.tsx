// Notchset system-glyph 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * System glyph: a small circle that fills by the share of a body system's markers in Optimal: an empty ring is none,
 * a half moon is half, a full disc is all. A shape, not a colour (like StatusGlyph), always with its count in words
 * beside it ("Heart · 4 of 6 optimal").
 *
 *   <SystemGlyph share={4 / 6} />
 */
function SystemGlyph({ share, size = 14, className }: { share: number; size?: number | undefined; className?: string | undefined }) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const r = size / 2 - 1;
  const s = Math.max(0, Math.min(1, share));
  return (
    <svg aria-hidden data-slot="system-glyph" width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn("shrink-0", className)}>
      <defs>
        <clipPath id={`c${id}`}>
          <rect x={size / 2 - r} y={0} width={2 * r * s} height={size} />
        </clipPath>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="var(--ns-ink)" clipPath={`url(#c${id})`} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ns-ink)" strokeWidth={1} />
    </svg>
  );
}

export { SystemGlyph };
