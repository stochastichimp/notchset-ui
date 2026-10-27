// Notchset results-strip 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useWidth } from "@/lib/notchset/physics";
import { flagWord, standingWord, type Standing, type ValueFlag } from "@/lib/notchset/standing";

/*
 * Results strip: every result of a panel as one tick in a row, grouped by system, so the whole panel reads at a glance
 * and the few that need attention stand out: in range is a quiet ink tick, out of range the warn tone, a value that
 * may be wrong or that the lab flagged the bad tone (hollow when it may be wrong). The counts are written above it
 * ("45 results · 4 out of range · 1 to check"). Point at a tick, or use the arrow keys, to read it; press, Enter or
 * Space opens it. One stop for the keyboard, however many results.
 *
 *   <ResultsStrip label="Follow-up panel · 16 Oct" items={items} onOpen={(id) => openBiomarker(id)} />
 *
 * The host orders the items (by system, the lock's order) and says each one's standing from its own range.
 */
type StripItem = { id: string; name: string; system: string; value: string; standing: Standing; flag?: ValueFlag };
type ResultsStripProps = {
  /** what the strip shows: "Follow-up panel · 16 Oct" */
  label: string;
  items: StripItem[];
  onOpen?: ((id: string) => void) | undefined;
  /** the result open beside it, marked */
  open?: string | null | undefined;
  className?: string | undefined;
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function ResultsStrip({ label, items, onOpen, open, className }: ResultsStripProps) {
  const [at, setAt] = React.useState<number | null>(null);
  const [box, width] = useWidth<HTMLDivElement>(300);
  const out = items.filter((i) => !i.flag && (i.standing === "low" || i.standing === "high")).length;
  const check = items.filter((i) => i.flag).length;
  /* groups in the order given, with a gap between systems */
  const groups: { system: string; from: number; to: number }[] = [];
  items.forEach((it, i) => {
    const g = groups[groups.length - 1];
    if (g && g.system === it.system) g.to = i;
    else groups.push({ system: it.system, from: i, to: i });
  });
  const GAP = 6;
  const tickW = Math.max(3, (width - GAP * (groups.length - 1)) / Math.max(1, items.length));
  /* a slim tick in the middle of its slot: a panel reads as a run of marks, not a row of boxes */
  const barW = Math.max(2.5, Math.min(5, tickW * 0.42));
  const xOf = (i: number) => i * tickW + groups.findIndex((g) => i >= g.from && i <= g.to) * GAP;
  const words = (it: StripItem) => `${it.name} ${it.value}, ${flagWord(it.flag) ?? standingWord(it.standing)}, ${it.system}`;
  const cur = at == null ? null : items[at];
  const pick = (clientX: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const x = clientX - r.left;
    let best = 0, d = Infinity;
    for (let i = 0; i < items.length; i++) {
      const dd = Math.abs(xOf(i) + tickW / 2 - x);
      if (dd < d) {
        d = dd;
        best = i;
      }
    }
    return best;
  };
  const counts = [plural(items.length, "result"), out ? `${out} out of range` : "none out of range", check ? `${check} to check` : null].filter(Boolean).join(" · ");

  if (!items.length)
    return (
      <div data-slot="results-strip" className={cn("text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]", className)}>
        No results in this panel yet.
      </div>
    );

  return (
    <div data-slot="results-strip" className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">{label}</span>
        <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink)] tabular-nums">{counts}</span>
      </div>
      <div
        ref={box}
        role="slider"
        tabIndex={0}
        aria-label={`${label}: ${counts}`}
        aria-valuemin={0}
        aria-valuemax={items.length - 1}
        aria-valuenow={at ?? 0}
        aria-valuetext={cur ? words(cur) : counts}
        aria-describedby={undefined}
        data-slot="results-strip-ticks"
        onPointerMove={(e) => setAt(pick(e.clientX, e.currentTarget))}
        onPointerLeave={() => setAt(null)}
        onFocus={() => at == null && setAt(items.findIndex((i) => i.flag || i.standing === "low" || i.standing === "high") >= 0 ? items.findIndex((i) => i.flag || i.standing === "low" || i.standing === "high") : 0)}
        onBlur={() => setAt(null)}
        onClick={(e) => onOpen?.(items[pick(e.clientX, e.currentTarget)]!.id)}
        onKeyDown={(e) => {
          const c = at ?? 0;
          const to = e.key === "ArrowRight" ? c + 1 : e.key === "ArrowLeft" ? c - 1 : e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : e.key === "PageDown" ? (groups.find((g) => g.from > c)?.from ?? c) : e.key === "PageUp" ? ([...groups].reverse().find((g) => g.from < (groups.find((x) => c >= x.from && c <= x.to)?.from ?? c))?.from ?? 0) : null;
          if (to != null) {
            e.preventDefault();
            setAt(Math.max(0, Math.min(items.length - 1, to)));
            return;
          }
          if ((e.key === "Enter" || e.key === " ") && cur) {
            e.preventDefault();
            onOpen?.(cur.id);
          }
          if (e.key === "Escape") setAt(null);
        }}
        className="relative h-[34px] w-full cursor-pointer rounded-[6px] outline-hidden select-none focus-visible:shadow-[0_0_0_2px_var(--ns-panel),0_0_0_4px_var(--ns-signal)]"
      >
        {items.map((it, i) => {
          const tone = it.flag ? "bad" : it.standing === "low" || it.standing === "high" ? "warn" : "in";
          return (
            <i
              key={it.id}
              aria-hidden
              data-tone={tone}
              data-open={open === it.id || undefined}
              className={cn(
                "absolute top-[4px] bottom-[4px] block rounded-full [transition:transform_var(--ns-time-color)_var(--ns-ease),opacity_var(--ns-time-color)]",
                tone === "in" && "bg-[var(--ns-band-edge)] opacity-60",
                tone === "warn" && "bg-[var(--ns-warn)]",
                tone === "bad" && (it.flag === "may-be-wrong" ? "shadow-[inset_0_0_0_1.5px_var(--ns-bad)]" : "bg-[var(--ns-bad)]"),
                (at === i || open === it.id) && "scale-y-[1.18]",
                open === it.id && "shadow-[0_0_0_2px_var(--ns-panel),0_0_0_3.5px_var(--ns-ink)]",
              )}
              style={{ left: xOf(i) + (tickW - barW) / 2, width: barW }}
            />
          );
        })}
        {cur && (
          <span
            aria-hidden
            data-slot="results-strip-read"
            className="pointer-events-none absolute bottom-[calc(100%+8px)] z-[2] flex items-baseline gap-1.5 rounded-full bg-[var(--ns-ink)] px-[10px] py-[5px] text-[length:var(--ns-text-meta)] whitespace-nowrap text-[var(--ns-canvas)] shadow-[0_8px_18px_-8px_rgb(0_0_0/0.5)]"
            style={{ left: Math.max(0, Math.min(width - 220, xOf(at!) - 60)) }}
          >
            <b className="font-[number:var(--ns-weight-strong)]">{cur.name}</b>
            <span className="tabular-nums">{cur.value}</span>
            <span className="opacity-75">{flagWord(cur.flag) ?? standingWord(cur.standing)}</span>
          </span>
        )}
      </div>
      <div aria-hidden className="relative h-4 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-4 text-[var(--ns-ink-3)]">
        {groups.map((g) => {
          const w = (g.to - g.from + 1) * tickW;
          /* a name that doesn't fit its group is left out (the reading still says it) */
          if (g.system.length * 7.2 > w + 2) return null;
          return (
            <span key={g.system} className="absolute top-0 truncate" style={{ left: xOf(g.from), width: w }}>
              {g.system}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export { ResultsStrip, type ResultsStripProps, type StripItem };
