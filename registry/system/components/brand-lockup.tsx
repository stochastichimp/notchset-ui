// Notchset brand-lockup 2.0.0 · https://notchset.dev/changelog
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * The brand, drawn once: the plus, then the lowercase wordmark in the display face at 650, tight tracking. Every
 * template draws its company this way and nowhere else (LANGUAGE.md, section 5). The plus is the Signature
 * (`--ns-signal`), so it follows the template's look and the theme; the wordmark is ink. A buyer swaps in their own
 * brand in one place: `name` for the wordmark, `mark` for a different glyph. Self-contained on purpose: the site's
 * animated logo (src/components/site/logo.tsx) draws the same shapes but templates never import the site.
 * Customer companies are a different thing (CompanyMark).
 */
const PLUS = "M30.5 43.5H69.5Q72 43.5 72 46V54Q72 56.5 69.5 56.5H30.5Q28 56.5 28 54V46Q28 43.5 30.5 43.5Z M46 28H54Q56.5 28 56.5 30.5V69.5Q56.5 72 54 72H46Q43.5 72 43.5 69.5V30.5Q43.5 28 46 28Z";

type BrandSize = "sm" | "md" | "lg";
const TEXT: Record<BrandSize, string> = { sm: "text-[13px]", md: "text-[15px]", lg: "text-[18px]" };

type BrandMarkProps = {
  /** Edge in px. Defaults to 12. */
  size?: number | undefined;
  className?: string | undefined;
};

/** The plus, still, in the colour it inherits (`currentColor`). */
function BrandMark({ size = 12, className }: BrandMarkProps) {
  return (
    <svg data-slot="brand-mark" width={size} height={size} viewBox="28 28 44 44" fill="currentColor" aria-hidden className={cn("block shrink-0", className)}>
      <path d={PLUS} />
    </svg>
  );
}

type BrandLockupProps = {
  size?: BrandSize | undefined;
  /** The wordmark. Defaults to "Notchset"; it is always drawn lowercase. */
  name?: string | undefined;
  /** A different mark in place of the plus (sized to the lockup, coloured by the Signature). */
  mark?: React.ReactNode;
  className?: string | undefined;
};

/** The mark and the wordmark. The plus stands about a pixel taller than the letters; the gap is about two bar widths. */
function BrandLockup({ size = "md", name = "Notchset", mark, className }: BrandLockupProps) {
  return (
    <span data-slot="brand-lockup" className={cn("inline-flex min-w-0 items-center gap-[0.5em] leading-none text-[var(--ns-ink)]", TEXT[size], className)}>
      <span aria-hidden className="inline-flex shrink-0 items-center text-[var(--ns-signal)] [&>svg]:size-[0.84em]">
        {mark ?? <BrandMark size={12} className="size-[0.84em]" />}
      </span>
      <span className="truncate font-[family-name:var(--ns-font-display)] font-[650] tracking-[-0.055em] whitespace-nowrap lowercase">{name}</span>
    </span>
  );
}

export { BrandLockup, BrandMark, type BrandLockupProps, type BrandMarkProps };
