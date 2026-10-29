// Notchset pipeline-shapes 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { CompanyMark } from "@/components/ui/notchset/company-mark";
import { SegmentedControl } from "@/components/ui/notchset/segmented-control";

/*
 * One pipeline, five shapes: the same deals as a board, a list, the forecast's stacks, a month of close dates and
 * the people who own them. Each deal is one card that travels to its place in the next shape, so you watch the same
 * records rearrange; the total above never changes, because the facts don't. The deal you picked keeps its ring
 * through every shape. Positions come from the data, not from measuring, so the move is exact and cheap; reduced
 * motion lands each shape at once.
 *
 *   <PipelineShapes deals={deals} stages={["Discovery", "Evaluation", "Proposal", "Negotiation"]} format={money} />
 *
 * Capacity: every shape fits its fixed height, so no card covers another or leaves the box. A crowded column's cards
 * get shorter; a forecast stack keeps each deal's share but never runs above its column; a day with more deals than
 * its cell holds lays them side by side (each still a card, named in full to a screen reader).
 */
type ShapeDeal = {
  id: string;
  company: string;
  color: string;
  title: string;
  value: number;
  stage: string;
  forecast: "Commit" | "Best case" | "Pipeline";
  /** YYYY-MM-DD, all in the month shown */
  close: string;
  owner: string;
};
type Shape = "board" | "list" | "forecast" | "calendar" | "people";
type PipelineShapesProps = {
  deals: ShapeDeal[];
  stages: string[];
  format: (v: number) => string;
  /** the month the calendar shows: YYYY-MM */
  month: string;
  className?: string | undefined;
};
type Box = { x: number; y: number; w: number; h: number };

const SHAPES: { value: Shape; label: string }[] = [
  { value: "board", label: "Board" },
  { value: "list", label: "List" },
  { value: "forecast", label: "Forecast" },
  { value: "calendar", label: "Calendar" },
  { value: "people", label: "People" },
];
const FORECASTS = ["Commit", "Best case", "Pipeline"] as const;
const GAP = 8, HEAD = 26, H = 392;

/** Where every deal sits in a shape, and the labels that shape draws, for a stage `w` wide. */
function layout(shape: Shape, deals: ShapeDeal[], stages: string[], month: string, w: number, format: (v: number) => string) {
  const at: Record<string, Box> = {};
  const labels: { key: string; text: string; sum?: string; x: number; y: number; w: number }[] = [];
  const cells: (Box & { key: string; day: number })[] = [];
  const sum = (xs: ShapeDeal[]) => format(xs.reduce((a, d) => a + d.value, 0));
  const cols = (n: number) => {
    const cw = (w - GAP * (n - 1)) / n;
    return (i: number) => ({ x: i * (cw + GAP), w: cw });
  };
  if (shape === "board" || shape === "people") {
    const keys = shape === "board" ? stages : [...new Set(deals.map((d) => d.owner))];
    const col = cols(keys.length);
    const full = shape === "board" ? 58 : 34;
    keys.forEach((k, i) => {
      const c = col(i);
      const mine = deals.filter((d) => (shape === "board" ? d.stage : d.owner) === k);
      labels.push({ key: `${shape}-${k}`, text: shape === "people" ? k.split(" ")[0]! : k, sum: sum(mine), x: c.x, y: 0, w: c.w });
      /* a crowded column's cards get shorter, so the last one still ends inside the box */
      const gap = Math.min(6, (H - HEAD) / Math.max(1, mine.length) / 4), card = Math.min(full, (H - HEAD) / Math.max(1, mine.length) - gap);
      mine.forEach((d, j) => (at[d.id] = { x: c.x, y: HEAD + j * (card + gap), w: c.w, h: card }));
    });
  } else if (shape === "list") {
    const row = Math.min(34, (H - HEAD) / deals.length - 4);
    labels.push({ key: "list-h", text: "Deal", x: 0, y: 0, w: w / 2 });
    [...deals].sort((a, b) => b.value - a.value).forEach((d, i) => (at[d.id] = { x: 0, y: HEAD + i * (row + 4), w, h: row }));
  } else if (shape === "forecast") {
    const col = cols(3), max = Math.max(...FORECASTS.map((f) => deals.filter((d) => d.forecast === f).reduce((a, d) => a + d.value, 0)), 1);
    FORECASTS.forEach((f, i) => {
      const c = col(i), bw = Math.min(c.w, 140), x = c.x + (c.w - bw) / 2;
      labels.push({ key: `fc-${f}`, text: f, sum: sum(deals.filter((d) => d.forecast === f)), x: c.x, y: 0, w: c.w });
      /* each deal's share of the tallest stack, at least a readable sliver; when the slivers would push a stack past
         its column, the larger blocks give up the room, so the stack always fits */
      const mine = deals.filter((d) => d.forecast === f), room = H - HEAD - 8;
      const floor = Math.min(14, room / Math.max(1, mine.length) - 2);
      const hs = mine.map((d) => Math.max(floor, (Math.max(0, d.value) / max) * room - 2));
      const over = hs.reduce((a, h) => a + h + 2, 0) - room, give = hs.reduce((a, h) => a + h - floor, 0);
      const k = over > 0 && give > 0 ? Math.max(0, 1 - over / give) : 1;
      let y = H;
      mine.forEach((d, j) => {
        const h = floor + (hs[j]! - floor) * k;
        y -= h + 2;
        at[d.id] = { x, y, w: bw, h };
      });
    });
  } else {
    const [yy, mm] = month.split("-").map(Number) as [number, number];
    const first = new Date(Date.UTC(yy, mm - 1, 1)).getUTCDay(), col = cols(7);
    const weeks = Math.ceil((first + new Date(Date.UTC(yy, mm, 0)).getUTCDate()) / 7), rh = (H - HEAD) / weeks;
    ["S", "M", "T", "W", "T", "F", "S"].forEach((d, i) => labels.push({ key: `cal-${i}`, text: d, ...col(i), y: 0 }));
    const days = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
    for (let day = 1; day <= days; day++) {
      const cell = first + day - 1, c = col(cell % 7);
      cells.push({ key: `d${day}`, day, x: c.x, y: HEAD + Math.floor(cell / 7) * rh, w: c.w, h: rh - 4 });
    }
    /* a day's cell holds as many 18px cards as fit under its number; more than that share the cell side by side */
    const fits = Math.max(1, Math.floor((rh - 4 - 18 + 2) / 20)), card = Math.min(18, rh - 4 - 18 - 2);
    const byDay = new Map<number, ShapeDeal[]>();
    deals.forEach((d) => byDay.set(+d.close.slice(8, 10), [...(byDay.get(+d.close.slice(8, 10)) ?? []), d]));
    byDay.forEach((ds, day) => {
      const cell = first + day - 1, c = col(cell % 7), across = Math.ceil(ds.length / fits), down = Math.ceil(ds.length / across);
      const cw = (c.w - 4 - (across - 1) * 2) / across, ch = Math.min(card, (rh - 4 - 18 - (down - 1) * 2) / down);
      ds.forEach((d, n) => (at[d.id] = { x: c.x + 2 + (n % across) * (cw + 2), y: HEAD + Math.floor(cell / 7) * rh + 18 + Math.floor(n / across) * (ch + 2), w: cw, h: ch }));
    });
  }
  return { at, labels, cells };
}

function PipelineShapes({ deals, stages, format, month, className }: PipelineShapesProps) {
  const [shape, setShape] = React.useState<Shape>("board");
  const [picked, setPicked] = React.useState<string | null>(deals[0]?.id ?? null);
  const box = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(720);
  React.useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => e && setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { at, labels, cells } = React.useMemo(() => layout(shape, deals, stages, month, w, format), [shape, deals, stages, month, w, format]);
  const total = deals.reduce((a, d) => a + d.value, 0);
  const narrow = w < 560;
  return (
    <div data-slot="pipeline-shapes" className={cn("flex w-full min-w-0 flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)] tabular-nums">
          <b className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{format(total)}</b> · {deals.length} open deals
        </span>
        <SegmentedControl label="Shape" size="sm" options={SHAPES} value={shape} onValueChange={setShape} />
      </div>
      <div ref={box} className="relative w-full" style={{ height: H }}>
        {cells.map((c) => (
          <span key={c.key} aria-hidden data-ns-moves="" className="absolute rounded-[var(--ns-radius-sm)] bg-[color-mix(in_oklab,var(--ns-well)_70%,transparent)] px-1.5 pt-0.5 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums [animation:ns-fade_var(--ns-time-page)_var(--ns-ease)_both]" style={{ left: c.x, top: c.y, width: c.w, height: c.h }}>
            {c.day}
          </span>
        ))}
        {labels.map((l) => (
          <span key={l.key} aria-hidden data-ns-moves="" className="absolute flex items-baseline gap-1.5 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] [animation:ns-fade_var(--ns-time-page)_var(--ns-ease)_both]" style={{ left: l.x, top: l.y, width: l.w }}>
            <span className="truncate font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-2)]">{l.text}</span>
            {l.sum && <span className="ml-auto shrink-0 tabular-nums">{l.sum}</span>}
          </span>
        ))}
        {deals.map((d, i) => {
          const b = at[d.id] ?? { x: 0, y: 0, w: 0, h: 0 };
          const roomy = b.h >= 50, tiny = b.h < 22 || b.w < 72;
          const on = picked === d.id;
          return (
            <button
              key={d.id}
              type="button"
              data-deal={d.id}
              aria-pressed={on}
              aria-label={`${d.company}, ${d.title}, ${format(d.value)}, ${d.stage}, ${d.forecast}, closes ${d.close}, ${d.owner}`}
              onClick={() => setPicked(on ? null : d.id)}
              data-ns-glide=""
              className={cn(
                "absolute top-0 left-0 flex cursor-pointer items-center overflow-hidden rounded-[var(--ns-radius)] bg-[var(--ns-panel)] text-left text-[var(--ns-ink)] outline-hidden [transition:transform_420ms_var(--ns-ease-panel),width_420ms_var(--ns-ease-panel),height_420ms_var(--ns-ease-panel),box-shadow_var(--ns-time-color)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ns-signal)]",
                tiny ? "gap-1 px-1.5" : "gap-2 px-2.5",
                on ? "z-10 shadow-[0_0_0_2px_var(--ns-signal),0_6px_16px_-8px_rgb(0_0_0/0.35)]" : "shadow-[var(--ns-bezel)]",
              )}
              style={{ transform: `translate(${b.x}px, ${b.y}px)`, width: b.w, height: b.h, transitionDelay: `${i * 14}ms` }}
            >
              <CompanyMark name={d.company} color={d.color} size={tiny ? 12 : 18} className="shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={cn("truncate font-[number:var(--ns-weight-medium)]", tiny ? "text-[length:var(--ns-text-meta)]" : "text-[length:var(--ns-text-small)]")}>{d.company}</span>
                {roomy && !narrow && <span className="truncate text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{d.title}</span>}
              </span>
              {!tiny && <span className="shrink-0 text-[length:var(--ns-text-small)] tabular-nums">{format(d.value)}</span>}
            </button>
          );
        })}
      </div>
      <span aria-live="polite" className="sr-only">
        {SHAPES.find((s) => s.value === shape)!.label}
      </span>
    </div>
  );
}

export { PipelineShapes, type PipelineShapesProps, type ShapeDeal };
