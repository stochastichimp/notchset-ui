// Notchset glance-tile 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReasonGlyph, type Glyph } from "@/components/ui/notchset/reason-glyph";

/*
 * Glance tile: one reading a person takes in within two seconds, and a way into the page that says why. Every tile
 * has the same four rows on one baseline grid: a small label, a status line in the Signature's ink ("Usual", "Later
 * than usual"; always present, so four tiles line up), one small visual of the same weight in a fixed band, and the
 * value (or a word in its place) in light display type. The visual is a reason glyph (`reason-glyph`: arc, span,
 * marks, align, days), the drawing of why the status line says what it says, never decoration.
 * A tonal surface (a few percent of the Signature in the panel), no glow, no shadow, no score as a hero. Four sit in a
 * row on a desktop and two by two on a phone; the whole tile is the link.
 *
 *   <GlanceTile label="Body clock" status="Usual" value="Aligned" visual={{ kind: "align", offset: 0.1 }} href="#/sleep/clock" />
 */
/** a tile's visual is a reason glyph (`reason-glyph`): the drawing of why its status line says what it says */
type GlanceVisual = Glyph;

type GlanceTileProps = {
  label: string;
  /** the value, or a word in its place ("Recovered", "No signs") */
  value: React.ReactNode;
  unit?: string | undefined;
  /** the standing line under the label ("Usual", "Later than usual"), in the Signature's ink */
  status?: string | undefined;
  visual?: GlanceVisual | undefined;
  /** where it opens; a tile without one is a plain figure */
  href?: string | undefined;
  onClick?: (() => void) | undefined;
  className?: string | undefined;
};

function GlanceTile({ label, value, unit, status, visual, href, onClick, className }: GlanceTileProps) {
  const inner = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 flex-col">
          <span className="text-[length:var(--ns-text-small)] leading-5 font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-2)]">{label}</span>
          {/* always a line, so the four tiles keep one grid */}
          <span className="truncate text-[length:var(--ns-text-small)] leading-5 text-[color-mix(in_oklab,var(--ns-signal)_var(--ns-tint-ink),var(--ns-ink))]">{status ?? "\u00a0"}</span>
        </span>
        {(href || onClick) && <ChevronRight aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--ns-ink-3)]" />}
      </span>
      <span className="mt-auto block h-9 pt-3">{visual && <ReasonGlyph glyph={visual} />}</span>
      <span className="flex h-8 items-end gap-1.5 pt-1">
        <span className="truncate font-[family-name:var(--ns-font-display)] text-[clamp(20px,2vw,26px)] leading-none font-[number:var(--ns-weight-light)] tracking-[-0.02em] text-[var(--ns-ink)] tabular-nums">{value}</span>
        {unit && <span className="text-[length:var(--ns-text-small)] leading-none text-[var(--ns-ink-2)]">{unit}</span>}
      </span>
    </>
  );
  const cls = cn(
    "relative isolate flex min-h-[128px] min-w-0 flex-col overflow-hidden rounded-[var(--ns-radius-card)] bg-[color-mix(in_oklab,var(--ns-signal)_5%,var(--ns-panel))] p-3.5 text-left no-underline shadow-[inset_0_0_0_0.5px_var(--ns-line)] outline-hidden [transition:background-color_var(--ns-time-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] min-[901px]:min-h-[136px] min-[901px]:p-4",
    (href || onClick) && "cursor-pointer hover:bg-[color-mix(in_oklab,var(--ns-signal)_9%,var(--ns-panel))]",
    className,
  );
  if (href)
    return (
      <a data-slot="glance-tile" href={href} onClick={onClick} className={cls}>
        {inner}
      </a>
    );
  if (onClick)
    return (
      <button data-slot="glance-tile" type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  return (
    <div data-slot="glance-tile" className={cls}>
      {inner}
    </div>
  );
}

/** Four tiles: a row on a desktop, two by two on a phone. */
function GlanceRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string | undefined }) {
  return (
    <section aria-label={label} data-slot="glance-row" className={cn("grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[600px]:gap-2", className)}>
      {children}
    </section>
  );
}

export { GlanceRow, GlanceTile, type GlanceTileProps, type GlanceVisual };
