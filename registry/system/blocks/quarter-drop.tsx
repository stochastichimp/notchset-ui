// Notchset quarter-drop 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { CompanyMark } from "@/components/ui/notchset/company-mark";
import { RollingNumber } from "@/components/ui/notchset/rolling-number";
import { TickBar } from "@/components/ui/notchset/tick-bar";

/* measured before paint in the browser; on the server (where layout effects warn) an ordinary effect */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/*
 * Drop a deal, the quarter answers: a few deals in their stages over the quarter's progress toward quota. Move a
 * card (drag it, or focus it and press the arrow keys) and everything that depends on it answers at once: the
 * column totals roll, the quarter's bar moves, and crossing quota is the one moment the ring sweeps the bar. Undo
 * takes it all back. When the host's save fails, the card goes home, the numbers roll back and the reason is said
 * with Retry, never a move that silently didn't happen.
 *
 *   <QuarterDrop columns={[…]} deals={[…]} wonColumn="won" quota={500000} wonBefore={420000} format={money}
 *     onMove={(id, to) => save(id, to)} />
 */
type DropDeal = { id: string; company: string; color: string; value: number; column: string };
type QuarterDropProps = {
  columns: { key: string; label: string }[];
  deals: DropDeal[];
  /** the column that counts as won */
  wonColumn: string;
  quota: number;
  /** what was already won this quarter before these deals */
  wonBefore: number;
  format: (v: number) => string;
  /** the host's save; reject (or resolve false) to refuse the move */
  onMove?: ((id: string, to: string) => Promise<boolean | void> | boolean | void) | undefined;
  className?: string | undefined;
};
/* g: the move's place among every move on the board, so one card's older answer never speaks over another's newer one */
type Note = { kind: "moved" | "failed"; id: string; from: string; to: string; g: number };

function QuarterDrop({ columns, deals: initial, wonColumn, quota, wonBefore, format, onMove, className }: QuarterDropProps) {
  const [deals, setDeals] = React.useState(initial);
  const [note, setNote] = React.useState<Note | null>(null);
  const [drag, setDrag] = React.useState<{ id: string; dx: number; dy: number; x0: number; y0: number; over?: string | undefined } | null>(null);
  const [sweep, setSweep] = React.useState(0);
  const cols = React.useRef<Record<string, HTMLDivElement | null>>({});
  const won = wonBefore + deals.filter((d) => d.column === wonColumn).reduce((a, d) => a + d.value, 0);
  const sum = (k: string) => deals.filter((d) => d.column === k).reduce((a, d) => a + d.value, 0);
  const place = (id: string, to: string) => setDeals((ds) => ds.map((d) => (d.id === id ? { ...d, column: to } : d)));

  /* each deal's moves are kept in order: a refused move sends the card to the newest of its moves that hasn't been
     refused (still saving, or saved), else where it started; an older answer never overrides a newer move */
  const ops = React.useRef<Record<string, { n: number; to: string; state: "saving" | "ok" | "no" }[]>>({});
  const start = React.useRef<Record<string, string>>(Object.fromEntries(initial.map((d) => [d.id, d.column])));
  const seq = React.useRef(0);
  const alive = React.useRef(true);
  React.useEffect(() => {
    alive.current = true;
    return () => void (alive.current = false);
  }, []);
  const move = async (id: string, to: string, quiet = false) => {
    const d = deals.find((x) => x.id === id);
    if (!d || d.column === to) return;
    const from = d.column;
    const list = (ops.current[id] ??= []);
    const op = { n: (list.at(-1)?.n ?? 0) + 1, to, state: "saving" as "saving" | "ok" | "no" };
    list.push(op);
    const g = ++seq.current;
    const wonNow = won + (to === wonColumn ? d.value : 0) - (from === wonColumn ? d.value : 0);
    if (won < quota && wonNow >= quota) setSweep((n) => n + 1);
    place(id, to);
    setNote(quiet ? null : { kind: "moved", id, from, to, g });
    let ok = true;
    try {
      ok = (await onMove?.(id, to)) !== false;
    } catch {
      ok = false;
    }
    op.state = ok ? "ok" : "no";
    /* a saved move is where the host has the deal; older moves no longer matter. Pruned from the history as it is
       now, never from the list this move started with: a late older success must not bring back moves dropped since */
    if (ok) ops.current[id] = (ops.current[id] ?? []).filter((o) => o.n >= op.n || o.state === "saving");
    if (ok) return;
    /* the card goes home a beat after it landed, so you see it refused */
    setTimeout(() => {
      if (!alive.current) return;
      const cur = ops.current[id] ?? [];
      const live = cur.filter((o) => o.state !== "no").at(-1);
      const home = live?.to ?? start.current[id] ?? from;
      place(id, home);
      if (live?.state === "ok") start.current[id] = live.to;
      /* only the newest move speaks; where it ended is where you last asked for it: nothing to retry. A refusal outranks
         a "moved" note on another card, but never replaces another card's newer refusal, nor clears another's note */
      if (cur.at(-1) === op) setNote((n) => (home === to ? (n?.id === id ? null : n) : n && n.kind === "failed" && n.id !== id && n.g > g ? n : { kind: "failed", id, from: home, to, g }));
    }, 260);
  };
  /* the card you're on from the keyboard stays focused when it moves to another column (a new button there) or goes
     home after a refusal; focus you moved to something else stays where you put it */
  const root = React.useRef<HTMLDivElement>(null);
  const focused = React.useRef<string | null>(null);
  useIsomorphicLayoutEffect(() => {
    const id = focused.current;
    const a = document.activeElement;
    if (!id || (a && a !== document.body && !root.current?.contains(a))) return;
    const el = root.current?.querySelector<HTMLElement>(`[data-deal="${CSS.escape(id)}"]`);
    if (el && a !== el) el.focus({ preventScroll: true });
  }, [deals]);
  const step = (id: string, dir: 1 | -1) => {
    const d = deals.find((x) => x.id === id)!;
    const i = columns.findIndex((c) => c.key === d.column) + dir;
    if (columns[i]) void move(id, columns[i]!.key);
  };
  const dropAt = (x: number, y: number) =>
    columns.find((c) => {
      const r = cols.current[c.key]?.getBoundingClientRect();
      return r && x >= r.left && x <= r.right && y >= r.top - 40 && y <= r.bottom + 40;
    })?.key;
  const nd = note ? deals.find((x) => x.id === note.id) : null;
  return (
    <div ref={root} data-slot="quarter-drop" className={cn("flex w-full min-w-0 flex-col gap-4", className)}>
      <div key={sweep} className={cn("flex flex-col gap-1.5 rounded-[var(--ns-radius-lg)] p-1", sweep > 0 && "[animation:ns-ring-sweep_900ms_var(--ns-ease)_1]")} data-ns-moves="">
        <div className="flex items-baseline justify-between gap-3 text-[length:var(--ns-text-small)]">
          <span className="text-[var(--ns-ink-2)]">Won this quarter</span>
          <span className="tabular-nums text-[var(--ns-ink-3)]">
            <RollingNumber value={format(won)} className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]" /> of {format(quota)}
          </span>
        </div>
        <TickBar value={won} max={Math.max(quota * 1.25, won)} target={quota} done={won} label="Won against quota" valueText={`${format(won)} of ${format(quota)}`} />
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((c) => (
          <div key={c.key} ref={(el) => void (cols.current[c.key] = el)} className={cn("flex min-h-[13rem] min-w-0 flex-col gap-1.5 rounded-[var(--ns-radius-lg)] p-1.5 [transition:background-color_var(--ns-time-color)]", drag?.over === c.key ? "bg-[var(--ns-selected)]" : "bg-[color-mix(in_oklab,var(--ns-well)_80%,transparent)]")}>
            <span className="flex flex-wrap items-baseline gap-x-1.5 px-1 pt-0.5 text-[length:var(--ns-text-meta)]">
              <b className="truncate font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-2)]">{c.label}</b>
              <RollingNumber value={format(sum(c.key))} className={cn("ml-auto shrink-0", c.key === wonColumn ? "text-[var(--ns-ok-ink)]" : "text-[var(--ns-ink-3)]")} />
            </span>
            {deals
              .filter((d) => d.column === c.key)
              .map((d) => {
                const dragging = drag?.id === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    data-deal={d.id}
                    aria-label={`${d.company}, ${format(d.value)}, in ${c.label}. Arrow keys move it`}
                    onFocus={() => void (focused.current = d.id)}
                    onBlur={(e) => void (e.relatedTarget && (focused.current = null))}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                        e.preventDefault();
                        step(d.id, e.key === "ArrowRight" ? 1 : -1);
                      }
                    }}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                      setDrag({ id: d.id, dx: 0, dy: 0, x0: e.clientX, y0: e.clientY });
                    }}
                    onPointerMove={(e) => (dragging && drag ? setDrag({ ...drag, dx: e.clientX - drag.x0, dy: e.clientY - drag.y0, over: dropAt(e.clientX, e.clientY) }) : undefined)}
                    onPointerUp={(e) => {
                      if (!dragging) return;
                      const to = dropAt(e.clientX, e.clientY);
                      setDrag(null);
                      if (to && to !== d.column) void move(d.id, to);
                    }}
                    onPointerCancel={() => setDrag(null)}
                    data-ns-moves=""
                    className={cn(
                      "flex min-w-0 cursor-grab touch-none items-center gap-2 rounded-[var(--ns-radius)] bg-[var(--ns-panel)] px-2.5 py-2 text-left outline-hidden select-none [animation:ns-island-in_var(--ns-time-dialog)_var(--ns-ease)_both] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ns-signal)]",
                      dragging ? "relative z-10 cursor-grabbing shadow-[0_0_0_1px_var(--ns-signal),0_14px_30px_-12px_rgb(0_0_0/0.4)]" : "shadow-[var(--ns-bezel)]",
                    )}
                    style={dragging && drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(1.5deg)` } : undefined}
                  >
                    <CompanyMark name={d.company} color={d.color} size={16} className="shrink-0 self-start max-[600px]:hidden" />
                    {/* the name over the value, so a narrow column still reads both whole */}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{d.company}</span>
                      <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)] tabular-nums">{format(d.value)}</span>
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
      <div aria-live="polite" className="min-h-9">
        {note && nd && (
          <div data-ns-moves="" className="flex items-center gap-3 rounded-[var(--ns-radius)] bg-[var(--ns-ink)] px-3 py-2 text-[length:var(--ns-text-small)] text-[var(--ns-canvas)] [animation:ns-island-in_var(--ns-time-dialog)_var(--ns-ease)_both]">
            <span className="min-w-0 flex-1">
              {note.kind === "moved" ? `${nd.company} moved to ${columns.find((c) => c.key === note.to)?.label}` : `Couldn't move ${nd.company}. The save was refused; nothing changed.`}
            </span>
            <button
              type="button"
              onClick={() => (note.kind === "moved" ? void move(note.id, note.from, true) : void move(note.id, note.to))}
              className="shrink-0 cursor-pointer rounded-[6px] px-2 py-0.5 font-[number:var(--ns-weight-medium)] outline-hidden hover:bg-[color-mix(in_oklab,var(--ns-canvas)_14%,transparent)] focus-visible:outline-2 focus-visible:outline-[var(--ns-canvas)]"
            >
              {note.kind === "moved" ? "Undo" : "Retry"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { QuarterDrop, type DropDeal, type QuarterDropProps };
