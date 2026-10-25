// Notchset stage-checklist 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Stage checklist: what a step usually needs before it moves on, ticking itself as each thing comes true (the
 * quote goes out, the buyer is in the thread). A tick draws itself the moment its condition turns true, and when
 * the last one lands the header says so: "Ready to move on". It is a soft gate: it informs, it never blocks; the
 * host decides what, if anything, happens next. Items that start done are simply done, with no replayed draw.
 *
 *   <StageChecklist title="Proposal usually needs" items={[
 *     { id: "quote", label: "Quote sent", done: quoteSent },
 *     { id: "buyer", label: "Economic buyer has seen it", done: buyerSeen, hint: "Forward the quote to Ines" },
 *   ]} />
 */
type ChecklistItem = { id: string; label: string; done: boolean; hint?: string | undefined };
type StageChecklistProps = {
  title: string;
  items: ChecklistItem[];
  /** what the header says once everything is done */
  doneLabel?: string | undefined;
  /** an optional next step, shown once everything is done */
  action?: React.ReactNode;
  className?: string | undefined;
};

/** A tick in a ring; it draws itself only when it turns true after mount. */
function Tick({ done, fresh }: { done: boolean; fresh: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-full [transition:background-color_var(--ns-time-color),box-shadow_var(--ns-time-color)]",
        done ? "bg-[var(--ns-ok)] text-white" : "shadow-[inset_0_0_0_1.5px_var(--ns-line)]",
      )}
    >
      {done && (
        <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 6.2 5 8.6l4.6-5.1" pathLength={1} strokeDasharray="1" data-ns-still="" className={cn(fresh && "[animation:ns-tick-draw_var(--ns-time-dialog)_var(--ns-ease)_both]")} />
        </svg>
      )}
    </span>
  );
}

function StageChecklist({ title, items, doneLabel = "Ready to move on", action, className }: StageChecklistProps) {
  const done = items.filter((i) => i.done).length;
  const all = items.length > 0 && done === items.length;
  /* remember what was already true at mount, so only a change draws */
  const [seen] = React.useState(() => new Set(items.filter((i) => i.done).map((i) => i.id)));
  const titleId = React.useId();
  return (
    <section data-slot="stage-checklist" data-complete={all || undefined} aria-labelledby={titleId} className={cn("flex flex-col gap-2.5 rounded-[var(--ns-radius-lg)] bg-[var(--ns-panel)] px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--ns-line-soft)]", className)}>
      <header className="flex items-baseline gap-2">
        <h3 id={titleId} className={cn("m-0 text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-medium)] [transition:color_var(--ns-time-color)]", all ? "text-[var(--ns-ok-ink)]" : "text-[var(--ns-ink)]")}>
          {all ? doneLabel : title}
        </h3>
        <span role="status" aria-live="polite" className="ml-auto text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)] tabular-nums">
          {done} of {items.length}
        </span>
      </header>
      {/* progress as a hairline, so the whole reads at a glance */}
      <span aria-hidden className="block h-[3px] overflow-hidden rounded-full bg-[var(--ns-line-soft)]">
        <i data-ns-glide="" style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} className={cn("block h-full rounded-full [transition:width_var(--ns-time-dialog)_var(--ns-ease),background-color_var(--ns-time-color)]", all ? "bg-[var(--ns-ok)]" : "bg-[var(--ns-ink-2)]")} />
      </span>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {items.map((i) => (
          <li key={i.id} className="flex items-start gap-2.5">
            <span className="pt-px">
              <Tick done={i.done} fresh={i.done && !seen.has(i.id)} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className={cn("text-[length:var(--ns-text-small)] [transition:color_var(--ns-time-color)]", i.done ? "text-[var(--ns-ink-2)]" : "text-[var(--ns-ink)]")}>
                {i.label}
                <span className="sr-only">{i.done ? ", done" : ", not yet"}</span>
              </span>
              {!i.done && i.hint && <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{i.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
      {all && action && <div className="flex pt-0.5">{action}</div>}
    </section>
  );
}

export { StageChecklist, type ChecklistItem, type StageChecklistProps };
