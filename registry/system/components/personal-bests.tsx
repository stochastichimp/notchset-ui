// Notchset personal-bests 2.0.0 · https://notchset.dev/changelog
import { cn } from "@/lib/utils";

/*
 * Personal bests: quiet fact rows for a metric (highest night, best month, longest run over your usual), each with
 * its value and when. No badges, no colour: a best is a fact, not a prize. A description list, read in order.
 *
 *   <PersonalBests items={[{ label: "Highest night", value: "74 ms", when: "12 Jun" }, …]} />
 */
type PersonalBest = { label: string; value: string; when?: string | undefined };
type PersonalBestsProps = { items: PersonalBest[]; title?: string | undefined; className?: string | undefined };

function PersonalBests({ items, title = "Personal bests", className }: PersonalBestsProps) {
  return (
    <section data-slot="personal-bests" aria-label={title} className={cn("flex min-w-0 flex-col gap-2", className)}>
      <h3 className="m-0 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{title}</h3>
      {items.length ? (
        <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-4 text-[length:var(--ns-text-small)] tabular-nums">
          {items.map((b) => (
            <div key={b.label} className="col-span-3 grid grid-cols-subgrid items-baseline border-b border-[var(--ns-line-soft)] py-2 last:border-b-0">
              <dt className="truncate text-[var(--ns-ink-2)]">{b.label}</dt>
              <dd className="m-0 text-right font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{b.value}</dd>
              <dd className="m-0 min-w-[6ch] text-right font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{b.when ?? ""}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="m-0 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">Bests appear after a month of readings.</p>
      )}
    </section>
  );
}

export { PersonalBests, type PersonalBest, type PersonalBestsProps };
