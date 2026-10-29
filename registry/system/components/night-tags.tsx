// Notchset night-tags 2.0.0 · https://notchset.dev/changelog
"use client";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Night tags: what was tagged on a night, from the Log and the routine ("Late meal 21:40", "Alcohol 1 glass"), with
 * "Add a tag" and, when the coach has one, a single cited correlation under them ("On your 6 nights tagged late meal,
 * you took 9 minutes longer to fall asleep", its source in mono). The coach's line is a fact about your nights,
 * never advice.
 *
 *   <NightTags tags={[{ label: "Late meal", at: "21:40" }]} onAdd={openLog} finding={{ text: "…", source: "Log tags · 6 nights · Ring" }} />
 */
type NightTag = { label: string; at?: string | undefined };
type NightTagsProps = {
  tags: NightTag[];
  /** opens the Log on this night; without it there's no Add button */
  onAdd?: (() => void) | undefined;
  /** the coach's one cited correlation */
  finding?: { text: string; source: string } | undefined;
  title?: string | undefined;
  className?: string | undefined;
};

function NightTags({ tags, onAdd, finding, title = "Tags on this night", className }: NightTagsProps) {
  return (
    <section data-slot="night-tags" aria-label={title} className={cn("flex min-w-0 flex-col gap-3", className)}>
      <h3 className="m-0 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{title}</h3>
      <ul className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        {tags.map((t) => (
          <li key={`${t.label}${t.at ?? ""}`} className="inline-flex h-[var(--ns-chip)] items-center gap-1.5 rounded-full bg-[var(--ns-raised)] px-2.5 text-[length:var(--ns-text-meta)] text-[var(--ns-ink)] shadow-[0_0_0_1px_var(--ns-line-soft)]">
            {t.label}
            {t.at && <span className="font-[family-name:var(--ns-font-mono)] text-[var(--ns-ink-3)] tabular-nums">{t.at}</span>}
          </li>
        ))}
        {!tags.length && <li className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">Nothing tagged.</li>}
        {onAdd && (
          <li>
            <button type="button" onClick={onAdd} className="inline-flex h-[var(--ns-chip)] cursor-pointer items-center gap-1 rounded-full px-2.5 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)] shadow-[inset_0_0_0_1px_var(--ns-line)] outline-hidden hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] pointer-coarse:h-9">
              <Plus aria-hidden className="size-3" />
              Add a tag
            </button>
          </li>
        )}
      </ul>
      {finding && (
        <p data-slot="night-tags-finding" className="m-0 flex flex-col gap-1 border-l-2 border-[var(--ns-series)] pl-3 text-[length:var(--ns-text-small)] text-[var(--ns-ink)]">
          {finding.text}
          <span className="font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{finding.source}</span>
        </p>
      )}
    </section>
  );
}

export { NightTags, type NightTag, type NightTagsProps };
