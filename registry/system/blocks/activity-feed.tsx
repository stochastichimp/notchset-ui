// Notchset activity-feed 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs } from "@/components/ui/notchset/tabs";

/* useLayoutEffect warns during server rendering on React 18; the effect only measures, so the server can skip it. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/*
 * Activity feed (block 24): what happened on a record, newest first, grouped by day ("Upcoming", "Today",
 * "Oct 16"). Each entry is an icon for its kind, who did it, what, and the time; an email or a note carries
 * its words in a card, and a `tag` says in one quiet word how it went. Tabs filter by kind with counts. The feed opens on what's current; anything older waits
 * behind one honest line that says how much and how far back. A fresh entry rises in once.
 */
type FeedItem = { id: string; icon: React.ReactNode; day: string; time: string; who?: string | undefined; text: React.ReactNode; detail?: React.ReactNode; fresh?: boolean | undefined; upcoming?: boolean | undefined;
  /** One quiet word after the entry ("Voicemail"): how it went, never a second sentence. */
  tag?: string | undefined };
type FeedFilter<F extends string> = { value: F; label: string; count: number };
type ActivityFeedProps<F extends string> = {
  items: FeedItem[];
  filters: FeedFilter<F>[];
  filter: F;
  onFilterChange: (f: F) => void;
  /** Between the filter tabs and the entries: the composer. */
  composer?: React.ReactNode;
  empty: string;
  older?: { label: string; hint: string; shown: boolean; onToggle: () => void } | undefined;
  className?: string | undefined;
};

function ActivityFeed<F extends string>({ items, filters, filter, onFilterChange, composer, empty, older, className }: ActivityFeedProps<F>) {
  /*
   * The tabs stay where they are when a filter shows fewer entries: the list keeps the tallest height it has had, so a
   * block centred or bottom-aligned by its host never slides. A change of filter keeps the height; an entry really
   * removed under the same filter lets it settle (the box measures itself, then rests on what it measured).
   */
  const [peak, setPeak] = React.useState(0);
  const list = React.useRef<HTMLOListElement>(null);
  const was = React.useRef({ filter, height: 0 });
  useIsomorphicLayoutEffect(() => {
    const el = list.current;
    if (el) el.style.minHeight = "";
    const h = el?.offsetHeight ?? 0;
    if (el && peak) el.style.minHeight = `${peak}px`;
    const same = was.current.filter === filter;
    setPeak((p) => (h > p || (same && h < was.current.height) ? h : p));
    was.current = { filter, height: h };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- peak is read to restore the box, never a trigger
  }, [items, filter]);
  return (
    <section data-slot="activity-feed" aria-label="Activity" className={cn("flex min-w-0 flex-col gap-4", className)}>
      <div className="border-b border-[var(--ns-line-soft)] pb-2.5">
        <Tabs label="Activity kinds" value={filter} onValueChange={onFilterChange} tabs={filters} />
      </div>
      {composer}
      <ol ref={list} style={{ minHeight: peak || undefined }} className="m-0 flex list-none flex-col p-0">
        {items.length === 0 && <li className="py-2.5 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">{empty}</li>}
        {items.map((a, i) => {
          const head = a.day !== items[i - 1]?.day;
          return (
            <li key={a.id} className={cn(a.fresh && "[animation:ns-rise_var(--ns-time-page)_var(--ns-ease)]")}>
              {head && <div className="pt-3 pb-2 text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-3)] first:pt-1">{a.day}</div>}
              <div className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-x-3 py-1.5">
                <span className={cn("grid size-7 place-items-center rounded-[8px] text-[var(--ns-ink-2)] shadow-[inset_0_0_0_1px_var(--ns-line)] [&_svg]:size-3.5", a.upcoming && "border border-dashed border-[var(--ns-line)] shadow-none")}>{a.icon}</span>
                <div className="min-w-0 pt-[5px] text-[length:var(--ns-text-body)] leading-[1.45] text-[var(--ns-ink-2)] [overflow-wrap:anywhere]">
                  {a.who && <b className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{a.who} · </b>}
                  {a.text}
                  {a.tag && <span className="ml-2 inline-flex h-5 items-center rounded-[5px] px-1.5 align-[1px] text-[length:var(--ns-text-meta)] leading-none whitespace-nowrap text-[var(--ns-ink-3)] shadow-[inset_0_0_0_1px_var(--ns-line)]">{a.tag}</span>}
                  {a.detail && <div className="mt-2 max-w-[64ch] rounded-[var(--ns-radius)] px-3 py-2.5 text-[var(--ns-ink)] shadow-[inset_0_0_0_1px_var(--ns-line)] whitespace-pre-wrap">{a.detail}</div>}
                </div>
                <span className="pt-[5px] text-[length:var(--ns-text-meta)] whitespace-nowrap text-[var(--ns-ink-3)] tabular-nums">{a.time}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {older && (
        <button
          type="button"
          aria-expanded={older.shown}
          onClick={older.onToggle}
          className="ml-10 inline-flex h-8 cursor-pointer items-center gap-2 self-start rounded-[var(--ns-radius)] px-3 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-2)] shadow-[inset_0_0_0_1px_var(--ns-line)] outline-hidden hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] max-[600px]:ml-0 [&_svg]:size-3.5"
        >
          {older.shown ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
          {older.label}
          <span className="font-[number:var(--ns-weight-regular)] text-[var(--ns-ink-3)] max-[600px]:hidden">{older.hint}</span>
        </button>
      )}
    </section>
  );
}

export { ActivityFeed, type ActivityFeedProps, type FeedItem };
