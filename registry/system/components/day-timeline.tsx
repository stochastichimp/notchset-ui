// Notchset day-timeline 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChartWidth } from "@/components/ui/notchset/chart";

/*
 * Day timeline: a day on one hairline axis, carrying what the wearable saw, what you logged and the routine, ticked or
 * still planned. Solid up to now, dotted after, and Now is the axis's one lit mark. It shows at most `max` entries
 * (the coach's pick and those nearest now). Labels alternate above and below the axis on leader lines and never touch;
 * moments too close to label apart collapse into one counted marker (layoutDay). The counted marker and "View the day"
 * open the whole day in place as an upright list, which is also how the day stands in a narrow box (a phone). The entries are an ordered list either way, so a screen reader reads the day in
 * order; the drawn axis is decoration.
 *
 *   <DayTimeline now="09:40" events={[{ id: "w", at: "06:40", title: "Woke", kind: "ring" }, …]} />
 *
 * Marks: ring a filled dot, log a hollow ring, routine an ink dot with a tick, planned a dashed ring (lit when it's
 * the coach's pick). An entry with `end` is drawn as a capsule for its length.
 */
type DayTimelineKind = "ring" | "log" | "routine" | "planned";
type DayTimelineEvent = {
  id: string;
  at: string;
  end?: string | undefined;
  title: string;
  detail?: string | undefined;
  kind: DayTimelineKind;
  pick?: boolean | undefined;
};
type DayTimelineProps = {
  events: DayTimelineEvent[];
  /** "09:40" */
  now: string;
  /** the axis runs from this hour to that (default 5 to 24) */
  from?: number | undefined;
  to?: number | undefined;
  /** entries shown before "View the day" (default 6) */
  max?: number | undefined;
  label?: string | undefined;
  className?: string | undefined;
};

const hours = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h! + m! / 60;
};
const KIND_WORD: Record<DayTimelineKind, string> = {
  ring: "From the ring",
  log: "Logged",
  routine: "Routine, ticked",
  planned: "Planned",
};

/** The entries kept when there are more than `max`: the pick, then those nearest now, back in time order. */
function keep(events: DayTimelineEvent[], now: string, max: number) {
  if (events.length <= max) return events;
  const n = hours(now);
  const ranked = [...events].sort((a, b) => Number(!!b.pick) - Number(!!a.pick) || Math.abs(hours(a.at) - n) - Math.abs(hours(b.at) - n));
  const ids = new Set(ranked.slice(0, max).map((e) => e.id));
  return events.filter((e) => ids.has(e.id));
}

function Mark({ kind, pick, className }: { kind: DayTimelineKind; pick?: boolean | undefined; className?: string | undefined }) {
  if (kind === "routine")
    return (
      <i aria-hidden className={cn("grid size-[11px] place-items-center rounded-full bg-[var(--ns-ink)] text-[var(--ns-canvas)]", className)}>
        <Check className="size-[8px]" strokeWidth={3.2} />
      </i>
    );
  return (
    <i
      aria-hidden
      className={cn(
        "block size-[8px] rounded-full",
        kind === "ring" && "bg-[var(--ns-series)]",
        kind === "log" && "bg-[var(--ns-canvas)] shadow-[inset_0_0_0_1.25px_var(--ns-ink-2)]",
        kind === "planned" && "size-[9px] border border-dashed bg-[var(--ns-canvas)]",
        kind === "planned" && (pick ? "border-[var(--ns-series)] shadow-[0_0_10px_2px_color-mix(in_oklab,var(--ns-glow)_55%,transparent)]" : "border-[var(--ns-ink-3)]"),
        className,
      )}
    />
  );
}

/* the axis layout: where each mark and its label sit at width W */
const AXIS = 104;
const LABEL_H = 30;
type Rect = { l: number; r: number; t: number; b: number };
type DayMoment = {
  events: DayTimelineEvent[];
  x: number;
  at: string;
  end?: string | undefined;
  title: string;
};
type PlacedMoment = {
  m: DayMoment;
  up: boolean;
  lvl: number;
  right: boolean;
  label: Rect;
  stem: [number, number];
};

const momentOf = (events: DayTimelineEvent[], x: number): DayMoment => {
  const lead = events.find((e) => e.pick) ?? events[0]!;
  const last = events.at(-1)!;
  if (events.length === 1) return { events, x, at: lead.at, end: lead.end, title: lead.title };
  return {
    events,
    x,
    at: `${events[0]!.at}–${last.end ?? last.at}`,
    title: `${lead.title} and ${events.length - 1} more`,
  };
};

/*
 * Lays the day out on the axis so no two labels, stems or marks ever touch. Marks closer than `merge` px collapse into
 * one moment with a count. Labels alternate above and below in time order (above can't sit across Now's line); when a
 * label's own side and the other side are both taken it stacks one level out on a longer leader line, and when that
 * is taken too, it joins its nearest neighbour as one counted moment and the day is laid out again.
 */
function layoutDay(events: DayTimelineEvent[], now: string, W: number, from = 5, to = 24, merge = 26): PlacedMoment[] {
  const X = (t: number) => 8 + ((Math.min(to, Math.max(from, t)) - from) / (to - from)) * (W - 16);
  const nowX = X(hours(now));
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));
  let groups: DayTimelineEvent[][] = [];
  for (const e of sorted) {
    const g = groups.at(-1);
    if (g && X(hours(e.at)) - X(hours(g[0]!.at)) < merge) g.push(e);
    else groups.push([e]);
  }
  for (;;) {
    const moments = groups.map((g) => momentOf(g, X(hours(g[0]!.at))));
    const placed: PlacedMoment[] = [];
    let failed = -1;
    moments.forEach((m, i) => {
      if (failed >= 0) return;
      const w = Math.max(m.title.length * 7, m.at.length * 7.2, 40) + 4;
      const right = m.x + 6 + w > W;
      const [l, r] = right ? [m.x - 6 - w, m.x - 6] : [m.x + 6, m.x + 6 + w];
      const pref = i % 2 === 0;
      const slots = [
        { up: pref, lvl: 0 },
        { up: !pref, lvl: 0 },
        { up: pref, lvl: 1 },
        { up: !pref, lvl: 1 },
      ];
      const slot = slots.find(({ up, lvl }) => {
        const t = up ? AXIS - 46 - lvl * 36 : AXIS + 40 + lvl * 36;
        const label = { l, r, t, b: t + LABEL_H };
        const stem: [number, number] = up ? [label.b, AXIS - 8] : [AXIS + 8, label.t];
        if (up && l - 6 < nowX && nowX < r + 6) return false;
        return !placed.some(
          (p) =>
            (p.label.l < r + 8 && l < p.label.r + 8 && p.label.t < label.b && t < p.label.b) ||
            (p.label.l - 3 < m.x && m.x < p.label.r + 3 && p.label.t < stem[1] && stem[0] < p.label.b) ||
            (l - 3 < p.m.x && p.m.x < r + 3 && p.stem[0] < label.b && t < p.stem[1]),
        );
      });
      if (!slot) {
        failed = i;
        return;
      }
      const t = slot.up ? AXIS - 46 - slot.lvl * 36 : AXIS + 40 + slot.lvl * 36;
      placed.push({
        m,
        up: slot.up,
        lvl: slot.lvl,
        right,
        label: { l, r, t, b: t + LABEL_H },
        stem: slot.up ? [t + LABEL_H, AXIS - 8] : [AXIS + 8, t],
      });
    });
    if (failed < 0 || groups.length < 2) return placed;
    const i = failed;
    const j = i === 0 ? 1 : i === groups.length - 1 ? i - 1 : moments[i]!.x - moments[i - 1]!.x <= moments[i + 1]!.x - moments[i]!.x ? i - 1 : i + 1;
    const lo = Math.min(i, j);
    groups = [...groups.slice(0, lo), [...groups[lo]!, ...groups[lo + 1]!], ...groups.slice(lo + 2)];
  }
}

function DayTimeline({ events, now, from = 5, to = 24, max = 6, label = "Today", className }: DayTimelineProps) {
  const [box, W] = useChartWidth<HTMLDivElement>(900);
  const [all, setAll] = React.useState(false);
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));
  /* the whole day opens as the upright list, every entry in order */
  const shown = all ? sorted : keep(sorted, now, max);
  const upright = all || W < 560;
  const nowH = hours(now);
  const X = (t: number) => 8 + ((Math.min(to, Math.max(from, t)) - from) / (to - from)) * (W - 16);
  const placed = upright ? [] : layoutDay(shown, now, W, from, to);
  const past = (e: DayTimelineEvent) => hours(e.at) <= nowH;
  const list = (
    <ol aria-label={label} className={cn("m-0 list-none p-0", upright ? "relative flex flex-col pl-[22px]" : "sr-only")}>
      {upright && (
        <>
          <span
            aria-hidden
            className="absolute top-3 left-[5px] w-px bg-[var(--ns-ink-3)] opacity-70"
            style={{
              height: `calc(${(shown.filter(past).length / Math.max(1, shown.length + 1)) * 100}% + 12px)`,
            }}
          />
          <span
            aria-hidden
            className="absolute bottom-3 left-[5px] border-0 border-l border-dotted border-[var(--ns-ink-3)]"
            style={{
              top: `calc(${(shown.filter(past).length / Math.max(1, shown.length + 1)) * 100}% + 12px)`,
            }}
          />
        </>
      )}
      {(() => {
        const rows: React.ReactNode[] = [];
        let nowDone = false;
        const nowRow = (
          <li key="now" className="relative grid grid-cols-[48px_minmax(0,1fr)] items-baseline gap-2 py-2">
            {upright && <i aria-hidden className="absolute top-[13px] -left-[21px] block size-[9px] rounded-full bg-[var(--ns-series)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--ns-glow)_25%,transparent),0_0_14px_2px_var(--ns-glow)]" />}
            <span className="font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)] tabular-nums">{now}</span>
            <span className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">Now</span>
          </li>
        );
        for (const e of shown) {
          if (!nowDone && hours(e.at) > nowH) {
            rows.push(nowRow);
            nowDone = true;
          }
          rows.push(
            <li key={e.id} className="relative grid grid-cols-[48px_minmax(0,1fr)] items-baseline gap-2 py-2">
              {upright && (
                <span className="absolute top-[13px] -left-[22px] flex w-[11px] justify-center">
                  <Mark kind={e.kind} pick={e.pick} />
                </span>
              )}
              <span className="font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)] tabular-nums">{e.end ? `${e.at}–${e.end}` : e.at}</span>
              <span className="flex min-w-0 flex-col">
                <span className={cn(e.kind === "planned" && !e.pick ? "text-[var(--ns-ink-2)]" : "text-[var(--ns-ink)]", e.pick && "font-[number:var(--ns-weight-medium)]")}>{e.title}</span>
                <span className={upright ? "text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]" : undefined}>{e.detail ?? KIND_WORD[e.kind]}</span>
              </span>
            </li>,
          );
        }
        if (!nowDone) rows.push(nowRow);
        return rows;
      })()}
    </ol>
  );
  return (
    <div data-slot="day-timeline" className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div ref={box} className="relative min-w-0">
        {list}
        {!upright && (
          <div aria-hidden className="relative h-[220px] min-w-0 text-[length:var(--ns-text-meta)]">
            <span className="absolute h-px bg-[var(--ns-ink-3)] opacity-80" style={{ top: AXIS, left: X(from), width: X(nowH) - X(from) }} />
            <span className="absolute border-0 border-t border-dotted border-[var(--ns-ink-3)]" style={{ top: AXIS, left: X(nowH), width: X(to) - X(nowH) }} />
            {Array.from({ length: Math.floor((to - from) / 3) + 1 }, (_, i) => from + 1 + i * 3)
              .filter((h) => h <= to)
              .map((h) => (
                <span key={h} className={cn("absolute font-[family-name:var(--ns-font-mono)] text-[var(--ns-ink-3)]", h === to ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: X(h), top: AXIS + 12 }}>
                  {`${String(h).padStart(2, "0")}:00`}
                </span>
              ))}
            {placed.map(({ m, up, right, label: r, stem }) => {
              const e = m.events[0]!;
              const many = m.events.length > 1;
              const strong = m.events.some((v) => v.pick);
              const quiet = !many && e.kind === "planned" && !e.pick;
              const title = <span className={cn("text-[length:var(--ns-text-small)]", quiet ? "text-[var(--ns-ink-2)]" : "text-[var(--ns-ink)]", strong && "font-[number:var(--ns-weight-medium)]")}>{m.title}</span>;
              const time = <span className="font-[family-name:var(--ns-font-mono)] text-[var(--ns-ink-3)] tabular-nums">{m.at}</span>;
              return (
                <React.Fragment key={e.id}>
                  {stem[1] - stem[0] > 4 && (
                    <span
                      className="absolute w-px bg-[var(--ns-ink-3)] opacity-50"
                      style={{
                        left: m.x,
                        top: stem[0],
                        height: stem[1] - stem[0],
                      }}
                    />
                  )}
                  {many ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setAll(true)}
                      className="absolute grid size-[18px] -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-[var(--ns-canvas)] font-[family-name:var(--ns-font-mono)] text-[10px] leading-none text-[var(--ns-ink)] shadow-[inset_0_0_0_1.25px_var(--ns-ink-2)] tabular-nums"
                      style={{ left: m.x, top: AXIS + 0.5 }}
                    >
                      {m.events.length}
                    </button>
                  ) : e.end ? (
                    <span
                      className={cn("absolute h-[6px] rounded-full", e.kind === "planned" ? "border border-dashed border-[var(--ns-series)]" : "bg-[var(--ns-series)] opacity-85")}
                      style={{
                        left: m.x,
                        top: AXIS - 3,
                        width: Math.max(6, X(hours(e.end)) - m.x),
                      }}
                    />
                  ) : (
                    <span className="absolute flex -translate-x-1/2 -translate-y-1/2" style={{ left: m.x, top: AXIS + 0.5 }}>
                      <Mark kind={e.kind} pick={e.pick} />
                    </span>
                  )}
                  <span
                    className={cn("absolute flex flex-col whitespace-nowrap", right ? "items-end" : "items-start")}
                    style={{
                      top: r.t,
                      left: r.l,
                      width: r.r - r.l,
                      height: LABEL_H,
                    }}
                  >
                    {up ? (
                      <>
                        {time}
                        {title}
                      </>
                    ) : (
                      <>
                        {title}
                        {time}
                      </>
                    )}
                  </span>
                </React.Fragment>
              );
            })}
            {/* now: the axis's one glow */}
            <span className="absolute w-[5px] -translate-x-1/2 rounded-full bg-[var(--ns-glow)] opacity-35 blur-[3px]" style={{ left: X(nowH), top: AXIS - 84, height: 112 }} />
            <span className="absolute w-px bg-[var(--ns-series)]" style={{ left: X(nowH), top: AXIS - 80, height: 104 }} />
            <span className="absolute -translate-x-1/2 rounded-full bg-[var(--ns-ink)] px-2 py-[3px] font-[family-name:var(--ns-font-mono)] leading-none whitespace-nowrap text-[var(--ns-canvas)]" style={{ left: X(nowH), top: AXIS - 100 }}>
              Now {now}
            </span>
          </div>
        )}
      </div>
      {(all || sorted.length > max || placed.some((p) => p.m.events.length > 1)) && (
        <button
          type="button"
          aria-expanded={all}
          onClick={() => setAll(!all)}
          className="cursor-pointer self-start rounded-[6px] text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] underline decoration-[var(--ns-ink-3)] underline-offset-4 outline-hidden hover:decoration-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]"
        >
          {all ? "Show less" : "View the day"}
        </button>
      )}
    </div>
  );
}

export { DayTimeline, layoutDay, type DayMoment, type PlacedMoment, type DayTimelineEvent, type DayTimelineKind, type DayTimelineProps };
