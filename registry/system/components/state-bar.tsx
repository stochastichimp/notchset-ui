// Notchset state-bar 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * State bar: where things sit right now, as one stacked bar. Each state of work takes its foundation role in a
 * fixed order (Done in a calm tint of the ok green, In review and In progress their own hues, To do neutral) at the
 * same strengths a cumulative flow's bands use, so the two read as one family. A key under it writes every state's
 * count (a zero is written, never drawn); with `onSelect` each key opens the records it counts. It takes the chart
 * family's finish in its own colours (never the series violet): rounded ends, each part fading from its top toward
 * its base, and the part whose key you point at or focus glows softly in its own colour; at rest nothing glows.
 *
 *   <StateBar label="Route planner v2" parts={[{ key: "done", label: "Done", count: 31 }, { key: "review", label: "In review", count: 4 }, …]} />
 */
type StatePart = {
  key: string;
  label: string;
  count: number;
  /** its colour: a state's key (done, review, doing, todo, backlog) has one already; anything else is the ink */
  state?: "done" | "review" | "doing" | "todo" | "backlog" | undefined;
};
type StateBarProps = {
  /** what it counts, read out with every state ("Route planner v2: tasks by status") */
  label: string;
  parts: StatePart[];
  /** opens the records one state counts */
  onSelect?: ((key: string) => void) | undefined;
  className?: string | undefined;
};

/* the cumulative flow's strengths (blocks/cumulative-flow.tsx), validated as a set in light and dark */
const TINT: Record<string, [string, number]> = {
  done: ["var(--ns-state-done)", 0.3],
  review: ["var(--ns-state-review)", 0.6],
  doing: ["var(--ns-state-doing)", 0.6],
  todo: ["var(--ns-state-todo)", 0.3],
  backlog: ["var(--ns-state-todo)", 0.18],
};
const fill = (p: StatePart) => {
  const [c, a] = TINT[p.state ?? p.key] ?? ["var(--ns-ink-2)", 0.4];
  return `color-mix(in oklab, ${c} ${Math.round(a * 100)}%, var(--ns-panel))`;
};

function StateBar({ label, parts, onSelect, className }: StateBarProps) {
  const total = parts.reduce((a, p) => a + p.count, 0);
  const [lit, setLit] = React.useState<string | null>(null);
  const shown = parts.filter((p) => p.count > 0);
  return (
    <div data-slot="state-bar" className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      <div role="img" aria-label={`${label}: ${parts.map((p) => `${p.label} ${p.count}`).join(", ")}`} className={cn("flex h-3 w-full gap-[2px] rounded-full", total > 0 ? "" : "bg-[var(--ns-line-soft)]")}>
        {total > 0 &&
          shown.map((p, i) => (
            <i
              key={p.key}
              data-ns-glide=""
              data-ns-fill="column"
              data-ns-focus={lit === p.key ? "" : undefined}
              className={cn("block h-full [transition:flex-grow_520ms_var(--ns-ease),box-shadow_150ms_var(--ns-ease)]", i === 0 && "rounded-l-full", i === shown.length - 1 && "rounded-r-full")}
              style={{ flexGrow: p.count, flexBasis: 0, "--ns-fill": fill(p) } as React.CSSProperties}
            />
          ))}
      </div>
      <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">
        {parts.map((p) => {
          const body = (
            <>
              <i aria-hidden className="block size-2.5 rounded-[3px]" style={{ background: fill(p) }} />
              {p.label}
              <b className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] tabular-nums">{p.count}</b>
            </>
          );
          return (
            <li key={p.key}>
              {onSelect ? (
                <button type="button" onClick={() => onSelect(p.key)} onPointerEnter={() => setLit(p.key)} onPointerLeave={() => setLit(null)} onFocus={() => setLit(p.key)} onBlur={() => setLit(null)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] py-0.5 outline-hidden hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]">
                  {body}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 py-0.5">{body}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { StateBar, type StateBarProps, type StatePart };
