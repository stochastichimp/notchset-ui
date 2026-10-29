// Notchset status-pill 2.0.0 · https://notchset.dev/changelog
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Status pill: a record's state in its own colour, as a word. `tone` covers the states every app shares;
 * `color` takes an app's own state colour (a pipeline stage). "Closed" states that are over (lost, cancelled)
 * use tone="ended": no colour, just an outline, so they recede.
 * Every state is the same chip: a 6px dot in its colour and a word. A tint means "look here": only warn and bad
 * (needs approval, overdue, denied) are tinted, so a column of them reads calm and the exception stands out. A pill
 * that leads with its own icon skips the dot.
 */
const tones = {
  neutral: "var(--ns-ink-3)",
  ok: "var(--ns-ok)",
  warn: "var(--ns-warn)",
  bad: "var(--ns-bad)",
  signal: "var(--ns-signal)",
} as const;

type StatusPillProps = React.ComponentPropsWithoutRef<"span"> & {
  tone?: keyof typeof tones | "ended" | undefined;
  /** An app's own state colour; wins over tone. */
  color?: string | undefined;
};

function StatusPill({ tone = "neutral", color, className, style, ...props }: StatusPillProps) {
  const ended = tone === "ended" && !color;
  const loud = !color && (tone === "warn" || tone === "bad");
  return (
    <span
      data-slot="status-pill"
      data-tone={color ? "custom" : tone}
      style={ended ? style : ({ "--c": color ?? tones[tone as keyof typeof tones], ...style } as React.CSSProperties)}
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center rounded-[6px] px-2 font-[family-name:var(--ns-font-body)] text-[length:var(--ns-text-meta)] leading-none font-[number:var(--ns-weight-medium)] whitespace-nowrap [&>svg]:mr-1 [&>svg]:size-3 [&>svg]:shrink-0",
        ended
          ? "text-[var(--ns-ink-3)] shadow-[inset_0_0_0_1px_var(--ns-line)]"
          : cn(
              /* one anatomy for every state: a dot and a word; an exception is the same chip, tinted */
              "before:mr-1.5 before:size-1.5 before:shrink-0 before:rounded-full before:bg-[var(--c)] before:content-[''] [&:has(>svg)]:before:hidden [&>svg]:text-[var(--c)]",
              loud ? "bg-[color-mix(in_oklab,var(--c)_var(--ns-tint),transparent)] text-[color-mix(in_oklab,var(--c)_var(--ns-tint-ink),var(--ns-ink))]" : "bg-[color-mix(in_oklab,var(--ns-ink)_5%,transparent)] text-[var(--ns-ink-2)]",
            ),
        className,
      )}
      {...props}
    />
  );
}

export { StatusPill, type StatusPillProps };
