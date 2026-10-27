// Notchset adherence-dots 2.0.0 · https://notchset.dev/changelog
import { cn } from "@/lib/utils";

/*
 * Adherence dots: one row of seven quiet dots per routine item, filled on a day it happened, an outline on a day it
 * didn't, and today hollow and dashed until it happens; the count "5/7" closes the row. A table underneath for a
 * screen reader carries every day in words.
 *
 *   <AdherenceDots days={["M","T","W","T","F","S","S"]} rows={[{ name: "Walk 30 min", done: [true, true, false, true, true, true, null] }]} />
 *
 * `null` is a day still to come (today, before it happens).
 */
type AdherenceRow = { name: string; done: (boolean | null)[] };
type AdherenceDotsProps = {
  rows: AdherenceRow[];
  days: string[];
  /** names the section (and heads the rows, unless `head` says otherwise) */
  title?: string | undefined;
  /** the words over the item column; "" when the host's section already names it */
  head?: string | undefined;
  className?: string | undefined;
};

const said = (v: boolean | null) => (v == null ? "not yet" : v ? "done" : "missed");

function AdherenceDots({ rows, days, title = "This week", head = title, className }: AdherenceDotsProps) {
  return (
    <section data-slot="adherence-dots" aria-label={title} className={cn("flex min-w-0 flex-col gap-1", className)}>
      <div aria-hidden className="grid grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-x-4 pb-1 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        <span className="text-[var(--ns-ink)]">{head}</span>
        <span className="flex gap-2.5">
          {days.map((d, i) => (
            <span key={i} className="w-2 text-center font-[family-name:var(--ns-font-mono)]">
              {d}
            </span>
          ))}
        </span>
        <span />
      </div>
      {rows.map((r) => {
        const n = r.done.filter((v) => v != null).length;
        const x = r.done.filter(Boolean).length;
        return (
          <div key={r.name} aria-hidden className="grid grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-x-4 border-b border-[var(--ns-line-soft)] py-2 last:border-b-0 text-[length:var(--ns-text-small)]">
            <span className="truncate text-[var(--ns-ink-2)]">{r.name}</span>
            <span className="flex gap-2.5">
              {r.done.map((v, i) => (
                <i key={i} data-done={v == null ? "later" : v ? "yes" : "no"} className={cn("block size-2 rounded-full", v == null ? "border border-dashed border-[var(--ns-ink-3)]" : v ? "bg-[var(--ns-ink-2)]" : "border border-[var(--ns-line)]")} />
              ))}
            </span>
            <span className="text-right font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">
              {x}/{n}
            </span>
          </div>
        );
      })}
      <table className="sr-only">
        <caption>{title}, by day</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            {days.map((d, i) => (
              <th key={i} scope="col">
                {d}
              </th>
            ))}
            <th scope="col">Done</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <th scope="row">{r.name}</th>
              {r.done.map((v, i) => (
                <td key={i}>{said(v)}</td>
              ))}
              <td>
                {r.done.filter(Boolean).length} of {r.done.filter((v) => v != null).length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export { AdherenceDots, type AdherenceRow, type AdherenceDotsProps };
