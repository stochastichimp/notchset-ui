// Notchset check-list 2.0.0 · https://notchset.dev/changelog
"use client";
import { CircleAlert, CircleCheck, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Check list (block 49): a thing measured against rules (a quote against the approval policy), one line per
 * rule. Each says the rule, its value and what it means: within policy, needs a manager, needs Finance. The
 * icon and the words carry the state; colour only tints the icon. Short shows only what needs someone.
 */
export type CheckLevel = "pass" | "warn" | "fail";
type CheckItem = { key: string; label: string; value: string; level: CheckLevel; why?: string | undefined };
type CheckListProps = { items: CheckItem[]; words?: Partial<Record<CheckLevel, string>> | undefined; short?: boolean | undefined; className?: string | undefined };

const ICON = { pass: CircleCheck, warn: CircleAlert, fail: OctagonAlert };
const TINT = { pass: "text-[var(--ns-ok)]", warn: "text-[var(--ns-warn)]", fail: "text-[var(--ns-bad)]" };
/* a check that isn't passing reads in its colour, so the eye finds what needs a sign-off */
const INK = { pass: "text-[var(--ns-ink)]", warn: "text-[color-mix(in_oklab,var(--ns-warn)_var(--ns-tint-ink),var(--ns-ink))]", fail: "text-[var(--ns-bad-ink)]" };
const WORDS: Record<CheckLevel, string> = { pass: "within policy", warn: "needs a manager", fail: "needs Finance" };

function CheckList({ items, words, short, className }: CheckListProps) {
  const shown = short ? items.filter((c) => c.level !== "pass") : items;
  return (
    <ul data-slot="check-list" className={cn("m-0 flex list-none flex-col gap-3 p-0", className)}>
      {shown.map((c) => {
        const Icon = ICON[c.level];
        return (
          <li key={c.key} data-level={c.level} className="flex items-start gap-2.5" title={c.why}>
            <Icon aria-hidden className={cn("mt-0.5 size-3.5 shrink-0", TINT[c.level])} />
            <span className="flex min-w-0 flex-col gap-0.5">
              <b className={cn("font-[number:var(--ns-weight-medium)]", INK[c.level])}>{c.label}</b>
              <small className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">
                {c.value}
                {/* the icon is hidden from a screen reader, so every level is also said in words: shown for what needs someone,
                    spoken only for a pass (and in the short layout, where only the checks that need someone are listed) */}
                {c.level !== "pass" && !short ? ` · ${words?.[c.level] ?? WORDS[c.level]}` : <span className="sr-only"> · {words?.[c.level] ?? WORDS[c.level]}</span>}
              </small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** The rules a thing breaks, as small tags ("Up to 20% off", "Net 60"); "Within policy" when none. */
function AskTags({ items, words, className }: { items: { key: string; value: string; level: CheckLevel }[]; words?: Partial<Record<CheckLevel, string>> | undefined; className?: string | undefined }) {
  const asks = items.filter((c) => c.level !== "pass");
  if (!asks.length) return <span className={cn("text-[var(--ns-ink-3)]", className)}>Within policy</span>;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {asks.map((c) => (
        <span key={c.key} className={cn("inline-flex h-[22px] items-center rounded-[6px] px-2 text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)] whitespace-nowrap", c.level === "fail" ? "bg-[color-mix(in_oklab,var(--ns-bad)_var(--ns-tint),transparent)] text-[var(--ns-bad-ink)]" : "bg-[color-mix(in_oklab,var(--ns-warn)_var(--ns-tint),transparent)] text-[color-mix(in_oklab,var(--ns-warn)_var(--ns-tint-ink),var(--ns-ink))]")}>
          {c.value}
          <span className="sr-only"> · {words?.[c.level] ?? WORDS[c.level]}</span>
        </span>
      ))}
    </span>
  );
}

export { AskTags, CheckList, type CheckItem, type CheckListProps };
