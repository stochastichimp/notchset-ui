// Notchset rolling-number 2.1.0 · https://notchset.dev/changelog
"use client";
import { cn } from "@/lib/utils";

/*
 * Rolling number: a figure that changes because of what you just did (seats, a plan, a forecast category, a
 * deal moved) rolls only the digits that changed, right to left with a slight stagger, so you see where the
 * change landed and how big it was. It never counts up on arrival: a figure you open a page to is simply there.
 * Digits are tabular so nothing beside them shifts; screen readers get the final value once, not every digit.
 * Reduced motion swaps instantly.
 */
type RollingNumberProps = {
  value: string;
  /** Swap without rolling: a figure that follows a reader along a chart reads, it doesn't roll (no change was made). */
  instant?: boolean | undefined;
  className?: string | undefined;
};

const DIGITS = "0123456789";

function Digit({ d, delay, instant }: { d: number; delay: number; instant?: boolean | undefined }) {
  return (
    <span aria-hidden data-ns-mask="" className="relative inline-block h-[1lh] overflow-hidden align-bottom select-none">
      <span
        data-ns-roll=""
        data-ns-glide=""
        className={cn("flex flex-col", !instant && "[transition:transform_var(--ns-time-dialog)_var(--ns-ease)]")}
        style={{ transform: `translateY(${-d * 10}%)`, transitionDelay: instant ? undefined : `${delay}ms` }}
      >
        {DIGITS.split("").map((c) => (
          <span key={c} className="block h-[1lh]">
            {c}
          </span>
        ))}
      </span>
      {/* the digit's own width, so a 1 isn't as wide as an 8 in fonts that aren't fully tabular */}
      <span className="invisible block h-0">{DIGITS[d]}</span>
    </span>
  );
}

function RollingNumber({ value, instant, className }: RollingNumberProps) {
  const chars = value.split("");
  return (
    <span data-slot="rolling-number" role="text" aria-label={value} className={cn("relative inline-flex tabular-nums", className)}>
      {/* what a selection copies: the figure itself, laid invisibly over the strips (which can't be selected) */}
      <span aria-hidden className="absolute inset-0 whitespace-nowrap text-transparent select-text">
        {value}
      </span>
      {chars.map((c, i) => {
        /* keyed from the right, so a figure gaining a digit doesn't roll every digit after it */
        const fromRight = chars.length - i;
        return DIGITS.includes(c) ? (
          <Digit key={`d${fromRight}`} d={+c} delay={Math.min(fromRight, 6) * 18} instant={instant} />
        ) : (
          <span key={`c${fromRight}${c}`} aria-hidden className="select-none">
            {/* a plain space would collapse between flex items ("46days") */}
            {c === " " ? "\u00a0" : c}
          </span>
        );
      })}
    </span>
  );
}

export { RollingNumber, type RollingNumberProps };
