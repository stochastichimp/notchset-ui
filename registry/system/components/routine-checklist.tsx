// Notchset routine-checklist 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/notchset/button";
import { Checkbox } from "@/components/ui/notchset/checkbox";
import { TextField } from "@/components/ui/notchset/text-field";

/*
 * Routine checklist: today's routine to tick, time first. Each row is the tick, the planned time in mono, the item
 * and one quiet sub-line: your note, or who ticked it ("ticked 07:10", "from the ring"), or the coach's pick for
 * tonight. A row takes a note in place (Add a note, then Save or Escape). Count in the head ("3 of 5 done"); no
 * streaks, no badges, no confetti: a routine is a habit, not a game.
 *
 *   <RoutineChecklist items={[{ id: "walk", at: "08:10", title: "Walk, 30 min", done: true, by: "from the ring" }]}
 *     onToggle={(id, done) => tick(id, done)} onNote={(id, note) => tick(id, true, note)} />
 */
type RoutineChecklistItem = {
  id: string;
  /** the planned time, "13:00" */
  at?: string | undefined;
  title: string;
  done: boolean;
  /** who ticked it, or when ("ticked 07:10", "from the ring") */
  by?: string | undefined;
  note?: string | undefined;
  /** the coach's pick for today: marked, never louder than a word */
  pick?: boolean | undefined;
  /** a change to this row is on its way to the server: the tick keeps showing what is stored (a dose is not "taken" until it is), and can't be pressed again meanwhile */
  busy?: boolean | undefined;
  /** the host's word on this row's save ("Saving…", "Not saved: offline. Retry"), in place of the sub-line */
  status?: React.ReactNode;
};
type RoutineChecklistProps = {
  items: RoutineChecklistItem[];
  onToggle: (id: string, done: boolean) => void;
  /** left out, rows take no notes */
  onNote?: ((id: string, note: string) => void) | undefined;
  title?: string | undefined;
  /** false: no head row (the host's section names it and carries the count) */
  head?: boolean | undefined;
  className?: string | undefined;
};

function Row({ it, onToggle, onNote }: { it: RoutineChecklistItem; onToggle: RoutineChecklistProps["onToggle"]; onNote: RoutineChecklistProps["onNote"] }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(it.note ?? "");
  const sub = it.note ?? it.by ?? (it.pick ? "the coach's pick" : undefined);
  const save = () => {
    setEditing(false);
    if (draft.trim() !== (it.note ?? "")) onNote?.(it.id, draft.trim());
  };
  return (
    <li data-slot="routine-item" data-done={it.done || undefined} className="grid grid-cols-[24px_3.25rem_minmax(0,1fr)_auto] items-start gap-x-3 border-0 border-b-[0.5px] border-[var(--ns-line)] py-3 last:border-b-0 max-[600px]:grid-cols-[24px_minmax(0,1fr)_auto]">
      <Checkbox tone="done" checked={it.done} disabled={it.busy} aria-busy={it.busy || undefined} onCheckedChange={(v) => onToggle(it.id, !!v)} aria-label={`${it.title}${it.at ? ` at ${it.at}` : ""}: ${it.done ? "done" : "not done"}`} className="mt-0.5" />
      <span className="pt-0.5 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums max-[600px]:hidden">{it.at ?? ""}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("text-[length:var(--ns-text-body)]", it.done ? "text-[var(--ns-ink-2)]" : "text-[var(--ns-ink)]")}>
          <span className="hidden font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] max-[600px]:inline">{it.at ? `${it.at} ` : ""}</span>
          {it.title}
        </span>
        {editing ? (
          <form
            className="flex items-end gap-2 pt-1"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <TextField aria-label={`Note on ${it.title}`} value={draft} autoFocus onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Escape" && (setDraft(it.note ?? ""), setEditing(false))} placeholder="Before work, with lunch…" fieldClassName="min-w-0 flex-1" />
            <Button size="sm" type="submit">
              Save
            </Button>
          </form>
        ) : (
          (it.status ?? (sub && <span className={cn("text-[length:var(--ns-text-small)]", it.note ? "text-[var(--ns-ink-2)]" : "text-[var(--ns-ink-3)]")}>{sub}</span>))
        )}
      </span>
      {onNote && !editing && !it.busy ? (
        <Button size="sm" variant="ghost" onClick={() => {
            setDraft(it.note ?? "");
            setEditing(true);
          }} aria-label={`${it.note ? "Edit the note" : "Add a note"} on ${it.title}`} className="-mt-1">
          {it.note ? "Edit note" : "Note"}
        </Button>
      ) : (
        <span />
      )}
    </li>
  );
}

function RoutineChecklist({ items, onToggle, onNote, title = "Today's routine", head = true, className }: RoutineChecklistProps) {
  const done = items.filter((x) => x.done).length;
  return (
    <section data-slot="routine-checklist" aria-label={title} className={cn("flex min-w-0 flex-col", className)}>
      <div className={cn("flex items-baseline justify-between gap-3 pb-1", !head && "sr-only")}>
        <h3 className="m-0 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-2)]">{title}</h3>
        <span className="font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums" aria-live="polite">
          {done} of {items.length} done
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {items.map((it) => (
          <Row key={it.id} it={it} onToggle={onToggle} onNote={onNote} />
        ))}
      </ul>
    </section>
  );
}

export { RoutineChecklist, type RoutineChecklistItem, type RoutineChecklistProps };
