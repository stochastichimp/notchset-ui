// Notchset chart 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { usePortalContainer } from "@/lib/notchset/portal";
import { RollingNumber } from "@/components/ui/notchset/rolling-number";
import { type Pt, areaPath, niceTicks, smoothPath, stepPath } from "@/lib/notchset/curve";

/*
 * Chart: the parts every chart in the system is drawn with, so a burn-up, a week of bars, a cumulative flow and a
 * revenue line read as one family (the violet glow: one focus element per chart).
 *
 * - One hue. The measured series is drawn in --ns-series (a calm violet), a smooth 2px line (monotone, so a running
 *   total never dips between two points) with a soft glow under it and the area under it fading from that hue down to
 *   the surface; bars are its soft tints with one focus bar. A band ladders the same hue in steps (SERIES_STEPS,
 *   validated light and dark). References (scope, pace, target, markers, grid) and every value stay ink.
 * - A halo on the point you're on (at rest: the latest), a thin guide and a dark pill with the value that follow the
 *   pointer or the arrow keys, and the period you're in raised as a chip on the axis.
 * - A grid that is barely there, its labels in the mono face; one hero figure above, its label small beside it.
 * - Still on arrival. It moves only for the reader: the halo and pill follow a scrub, and a range you pick redraws
 *   the line in ink (useInkDraw). Reduced motion lands every state at once.
 * - Every chart writes its numbers: the surface is a slider whose value text says the point you're on, and
 *   ChartTable carries every point for a screen reader.
 *
 * The parts are plain: a block measures its width (useChartWidth), draws its marks in an SVG at that pixel size and
 * lays the HTML parts (halo, pill, axis) over it with ChartSurface.
 */
/** The steps of the one series hue for an ordered band (lightest first), as opacities over the surface. */
const SERIES_STEPS = [0.45, 0.63, 0.82, 1] as const;

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

/* measured before paint in the browser; an ordinary effect on the server, where layout effects warn */
const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * The width a chart is given, kept current; it draws at that size so its text stays its real size on a phone.
 * The ref is a callback, so the measuring follows the element itself: a chart that first renders empty and then
 * gets points starts measuring the box it now draws, and a replaced or removed box is let go.
 */
function useChartWidth<T extends HTMLElement>(fallback = 640): [React.RefCallback<T>, number, T | null] {
  const [el, setEl] = React.useState<T | null>(null);
  const [w, setW] = React.useState(fallback);
  React.useEffect(() => {
    if (!el) return;
    const read = () => setW(Math.max(200, Math.round(el.clientWidth || fallback)));
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el, fallback]);
  return [setEl, w, el];
}

/**
 * The ink draw: a token that changes when `key` changes after the chart is on screen (a range picked), never on
 * arrival. Key a line with it and pass `drawn` to InkLine so the line draws itself once.
 */
function useInkDraw(key: unknown): number {
  const [n, setN] = React.useState(0);
  const first = React.useRef(true);
  const prev = React.useRef(key);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (prev.current !== key) {
      prev.current = key;
      setN((x) => x + 1);
    }
  }, [key]);
  return n;
}

/** Reduced motion, from the page's own setting (data-motion) or the device's, which always wins. */
const reducedMotion = () => {
  if (typeof document === "undefined") return true;
  return document.documentElement.dataset.motion === "reduced" || (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
};
/** The foundation's ease (--ns-ease, cubic-bezier(0.22, 1, 0.36, 1)) for motion drawn frame by frame. */
function nsEase(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const [x1, y1, x2, y2] = [0.22, 1, 0.36, 1];
  const bez = (u: number, a: number, b: number) => 3 * a * u * (1 - u) * (1 - u) + 3 * b * u * u * (1 - u) + u * u * u;
  let lo = 0, hi = 1, u = t;
  for (let i = 0; i < 18; i++) {
    u = (lo + hi) / 2;
    if (bez(u, x1, x2) < t) lo = u;
    else hi = u;
  }
  return bez(u, y1, y2);
}
/** How long a chart takes to travel from one state of its data to the next (an edit, a filter, a range). */
const MORPH_MS = 520;

/*
 * The entrance: the first time a page's charts arrive in a session they enter once (bars rise, a line draws, an area
 * fades in), the way figures count up once; back on that page in the same session they are simply there. Reduced
 * motion never enters. Kept per page and kind in session storage (a private window without it enters once per load).
 */
const seenHere = new Set<string>();
const SEEN_KEY = "ns-charts-seen";
function chartSeen(key: string) {
  if (seenHere.has(key)) return true;
  try {
    return (JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]") as string[]).includes(key);
  } catch {
    return false;
  }
}
function rememberChart(key: string) {
  seenHere.add(key);
  try {
    const all = new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]") as string[]);
    all.add(key);
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...all].slice(-200)));
  } catch {}
}
/** True while this chart should play its entrance: its first arrival on this page this session, motion allowed. */
function useEntrance(kind: string): boolean {
  const [key] = React.useState(() => (typeof window === "undefined" ? kind : `${window.location.pathname}${window.location.hash.split("?")[0]}|${kind}`));
  const [first] = React.useState(() => typeof window !== "undefined" && !reducedMotion() && !chartSeen(key));
  React.useEffect(() => rememberChart(key), [key]);
  /* hydrating a server-rendered page, it reads as the server did (no entrance), so the HTML matches and the chart
     is simply there; a chart rendered in the browser enters as before */
  return React.useSyncExternalStore(NO_STORE, () => first, () => false);
}
const NO_STORE = () => () => {};

/** Resample a run of points to n, along its own index, so two runs of any lengths can blend point for point. */
function resample(pts: Pt[], n: number): Pt[] {
  if (!pts.length) return Array.from({ length: n }, () => [0, 0] as Pt);
  if (pts.length === n) return pts;
  return Array.from({ length: n }, (_, i) => {
    const f = n === 1 ? 0 : (i / (n - 1)) * (pts.length - 1);
    const a = pts[Math.floor(f)]!, b = pts[Math.min(pts.length - 1, Math.ceil(f))]!, t = f - Math.floor(f);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as Pt;
  });
}
/**
 * The morph: a set of point runs that travel, whenever the data changes (an edit, a task done, a filter, a range, a
 * workspace), from the geometry on screen to the new one in one eased move of MORPH_MS on the foundation's ease,
 * never redrawn from nothing; interrupted mid-move, the next move starts from wherever the points are. `enter` is
 * where the runs start on an entrance (bars at their baseline), with each point `stagger` ms after the one before;
 * without it they arrive in place. Reduced motion lands every state at once.
 */
function useMorph(target: Pt[][], ms = MORPH_MS, enter?: Pt[][] | null, stagger = 0, width?: number): Pt[][] {
  const [shown, setShown] = React.useState(() => enter ?? target);
  const cur = React.useRef(enter ?? target);
  const raf = React.useRef(0);
  const moving = React.useRef(false);
  const lastW = React.useRef(width);
  const key = JSON.stringify(target.map((r) => r.map(([x, y]) => [Math.round(x * 10), Math.round(y * 10)])));
  const first = React.useRef(true);
  React.useEffect(() => {
    cancelAnimationFrame(raf.current);
    const entering = first.current && !!enter;
    /* the chart measuring itself or the window resizing is not a change of data: it lands at once (unless an
       entrance is under way, which carries on to the new size) */
    const resized = width !== lastW.current;
    lastW.current = width;
    if ((first.current && !enter) || reducedMotion() || (resized && !moving.current)) {
      first.current = false;
      cur.current = target;
      moving.current = false;
      setShown(target);
      return;
    }
    first.current = false;
    moving.current = true;
    const from = target.map((r, k) => resample(cur.current[k] ?? r, r.length));
    const longest = Math.max(1, ...target.map((r) => r.length));
    /* a stagger never stretches the whole move by more than a quarter of a second */
    const lag = entering && longest > 1 ? Math.min(stagger, 240 / (longest - 1)) : 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      let done = true;
      const next = target.map((r, k) =>
        r.map(([x, y], i) => {
          const t = Math.min(1, Math.max(0, (now - t0 - i * lag) / ms));
          if (t < 1) done = false;
          const e = nsEase(t), f = from[k]![i]!;
          return [f[0] + (x - f[0]) * e, f[1] + (y - f[1]) * e] as Pt;
        }),
      );
      cur.current = next;
      setShown(next);
      if (!done) raf.current = requestAnimationFrame(tick);
      else moving.current = false;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return shown.length === target.length && shown.every((r, k) => r.length === target[k]!.length) ? shown : target;
}

/** The height of a run of points at x, along its straight segments (its ends held beyond them). */
function pointAt(run: Pt[], x: number): number {
  if (x <= run[0]![0]) return run[0]![1];
  for (let i = 1; i < run.length; i++)
    if (x <= run[i]![0]) {
      const [x0, y0] = run[i - 1]!, [x1, y1] = run[i]!;
      return y0 + (y1 - y0) * ((x - x0) / (x1 - x0 || 1));
    }
  return run.at(-1)![1];
}
/**
 * The gap between what happened (a) and the comparison (c), in pixels, over the span they share: one closed shape
 * per stretch where a stays above c (ahead) or below it (behind), split where they cross.
 */
function gapShapes(a: Pt[], c: Pt[]): { d: string; ahead: boolean }[] {
  if (a.length < 2 || c.length < 2) return [];
  const x0 = Math.max(a[0]![0], c[0]![0]), x1 = Math.min(a.at(-1)![0], c.at(-1)![0]);
  if (x1 - x0 < 1) return [];
  const xs = [...new Set([...a, ...c].map((p) => p[0]).filter((x) => x >= x0 && x <= x1).concat([x0, x1]))].sort((p, q) => p - q);
  const pts = xs.map((x) => [x, pointAt(a, x), pointAt(c, x)] as const);
  /* on screen, smaller y is higher: a above c is ahead, so the signed gap is yc − ya; a tie is within a hair */
  const gap = (p: readonly [number, number, number]) => (Math.abs(p[2] - p[1]) < 1e-6 ? 0 : Math.sign(p[2] - p[1]));
  /* 1. a crossing strictly between two samples becomes a sample of its own, where the lines meet */
  const all: (readonly [number, number, number])[] = [];
  pts.forEach((p, i) => {
    const q = pts[i - 1];
    if (q && gap(q) * gap(p) < 0) {
      const t = (q[2] - q[1]) / (q[2] - q[1] - (p[2] - p[1]));
      const x = q[0] + (p[0] - q[0]) * t, y = q[1] + (p[1] - q[1]) * t;
      all.push([x, y, y]);
    }
    all.push(p);
  });
  /* 2. now no interval changes side inside it: each is ahead, behind or a tie. Runs join intervals on one side
     (through a touching tie too); a change of side at a tie, or a stretch of ties, ends the run, and ties draw nothing. */
  const out: { d: string; ahead: boolean }[] = [];
  let run: (readonly [number, number, number])[] = [];
  let side = 0;
  const close = () => {
    if (run.length > 1 && side) {
      const top = run.map(([x, ya], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${ya.toFixed(1)}`).join("");
      const back = [...run].reverse().map(([x, , yc]) => `L${x.toFixed(1)} ${yc.toFixed(1)}`).join("");
      out.push({ d: `${top}${back}Z`, ahead: side > 0 });
    }
    run = [];
    side = 0;
  };
  for (let i = 1; i < all.length; i++) {
    const q = all[i - 1]!, p = all[i]!;
    const s = gap(q) || gap(p);
    if (!s) {
      close();
      continue;
    }
    if (s !== side) {
      close();
      side = s;
      run = [q];
    }
    run.push(p);
  }
  close();
  return out;
}

/* ahead in a soft tint of the ok colour, behind in a calm tint of the error colour: fills carry the meaning, lines stay ink */
/* the strengths are validated as a pair, light and dark, for normal and colour-blind separation (LANGUAGE.md §9) */
const GAP_TINT = { ahead: "color-mix(in srgb, var(--ns-ok) 60%, var(--ns-panel))", behind: "color-mix(in srgb, var(--ns-bad) 30%, var(--ns-panel))" } as const;
/** One stretch of the gap between two lines, shaded for ahead or behind; it fades in after the line on an entrance. */
function GapShape({ d, ahead, entering }: { d: string; ahead: boolean; entering?: boolean | undefined }) {
  return <path d={d} fill={ahead ? GAP_TINT.ahead : GAP_TINT.behind} data-ns-still="" className={entering ? "[animation:ns-fade_520ms_var(--ns-ease)_420ms_both]" : undefined} />;
}
/** The key for the shaded gap, naming only what is on screen. */
function GapKey({ gaps, ahead = "Ahead", behind = "Behind" }: { gaps: { ahead: boolean }[]; ahead?: string | undefined; behind?: string | undefined }) {
  if (!gaps.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {gaps.some((g) => g.ahead) && (
        <span className="inline-flex items-center gap-1.5">
          <i aria-hidden className="block size-2.5 rounded-[3px]" style={{ background: GAP_TINT.ahead }} />
          {ahead}
        </span>
      )}
      {gaps.some((g) => !g.ahead) && (
        <span className="inline-flex items-center gap-1.5">
          <i aria-hidden className="block size-2.5 rounded-[3px]" style={{ background: GAP_TINT.behind }} />
          {behind}
        </span>
      )}
    </span>
  );
}

/**
 * A change, read by what it means: every figure says which way is better ("up" for done, "down" for cycle time,
 * overdue, scope added, stuck and late). Better is ok, worse is bad, no change is grey; a change from zero reads
 * "+4 (new)"; with nothing to compare against it is a grey dash. `pct` writes it as a percentage of what it was.
 */
function deltaOf(now: number | null | undefined, then: number | null | undefined, better: "up" | "down", opts: { pct?: boolean; unit?: (n: number) => string } = {}): { value: string; tone: "ok" | "bad" | "neutral" } {
  if (now == null || then == null || Number.isNaN(now) || Number.isNaN(then)) return { value: "—", tone: "neutral" };
  const d = now - then;
  if (d === 0) return { value: opts.pct ? "±0%" : "±0", tone: "neutral" };
  const sign = d > 0 ? "+" : "−";
  const fmt = opts.unit ?? ((n: number) => String(n));
  const value = then === 0 ? `${sign}${fmt(Math.abs(d))} (new)` : opts.pct ? `${sign}${Math.abs(Math.round((d / Math.abs(then)) * 100))}%` : `${sign}${fmt(Math.abs(d))}`;
  return { value, tone: (d > 0) === (better === "up") ? "ok" : "bad" };
}

/**
 * The delta beside a hero figure: a small chip with its sign ("+31%", "2 days early"), tinted ok or bad by what it
 * means (never by its sign alone), and what it is measured against after it ("vs last 4 weeks").
 */
function ChartDelta({ value, tone, against, className }: { value: string; tone: "ok" | "bad" | "neutral"; against?: React.ReactNode; className?: string | undefined }) {
  return (
    <span data-slot="chart-delta" className={cn("inline-flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[length:var(--ns-text-small)]", className)}>
      <b className={cn("rounded-full px-2 py-0.5 whitespace-nowrap text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)] tabular-nums", tone === "ok" ? "bg-[color-mix(in_oklab,var(--ns-ok)_16%,var(--ns-panel))] text-[var(--ns-ok-ink)]" : tone === "bad" ? "bg-[color-mix(in_oklab,var(--ns-bad)_14%,var(--ns-panel))] text-[var(--ns-bad-ink)]" : "bg-[var(--ns-well)] text-[var(--ns-ink-2)]")}>{value}</b>
      {against != null && <span className="min-w-0 text-[var(--ns-ink-3)]">{against}</span>}
    </span>
  );
}

/*
 * Linked charts: inside a ChartLink, every chart that takes part reads the same day. Scrub one and the others light
 * the same day (a project's burn-up, its flow and its weeks). Days are numbers relative to today.
 */
const ChartLinkContext = React.createContext<{ day: number | null; set: (d: number | null) => void } | null>(null);
function ChartLink({ children }: { children: React.ReactNode }) {
  const [day, set] = React.useState<number | null>(null);
  const v = React.useMemo(() => ({ day, set }), [day]);
  return <ChartLinkContext.Provider value={v}>{children}</ChartLinkContext.Provider>;
}
/**
 * The point a chart is on, its own or the link's: `dayOf(i)` says which day stop i stands for (a week's bar, its
 * first day; `span` days long). Without a link it is the chart's own state.
 */
function useChartActive(n: number, dayOf?: ((i: number) => number) | undefined, span = 1): [number | null, (i: number | null) => void] {
  const link = React.useContext(ChartLinkContext);
  const [own, setOwn] = React.useState<number | null>(null);
  if (!link || !dayOf) return [own, setOwn];
  let at: number | null = null;
  if (link.day != null) for (let i = 0; i < n; i++) if (dayOf(i) <= link.day && link.day < dayOf(i) + span) at = i;
  return [at, (i) => link.set(i == null ? null : dayOf(i))];
}

/**
 * A series line in the one hue, 2px and smooth; `drawn` (useEntrance, or useInkDraw after a range change) draws it once
 * along its length. The main series line glows softly under itself (the violet glow: one blurred copy, its filter
 * defined here once, faded in after the draw and never animated itself); a dashed, ink or quiet line never glows.
 */
function InkLine({ d, drawn = 0, tone = "series", dashed, width = 2, glow = tone === "series" && !dashed, core, className }: { d: string; drawn?: number | undefined; tone?: "series" | "ink" | "quiet" | undefined; dashed?: boolean | undefined; width?: number | undefined; glow?: boolean | undefined; /** the line's own colour when it is light itself (a luminous line: a near-white core over the Signature's glow) */ core?: string | undefined; className?: string | undefined }) {
  const stroke = tone === "series" ? "var(--ns-series)" : tone === "ink" ? "var(--ns-ink)" : "var(--ns-ink-3)";
  const id = `gl${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      {glow && d && (
        <g key={`g${drawn}`} data-slot="chart-glow" aria-hidden data-ns-still={drawn ? "" : undefined} className={drawn ? "[animation:ns-fade_520ms_var(--ns-ease)_560ms_both]" : undefined}>
          <defs>
            <filter id={id} x="-10%" y="-30%" width="120%" height="160%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <path d={d} fill="none" stroke={stroke} strokeWidth={width + 3} strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id})`} style={{ opacity: "var(--ns-glow)" }} />
        </g>
      )}
      <path
        key={drawn}
        d={d}
        fill="none"
        stroke={core ?? stroke}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...(dashed ? { strokeDasharray: "1 4" } : drawn ? { pathLength: 1, strokeDasharray: 1 } : {})}
        data-ns-still={drawn && !dashed ? "" : undefined}
        className={cn(drawn && !dashed ? "[animation:ns-ink-draw_720ms_var(--ns-ease)_both]" : "", className)}
      />
    </>
  );
}

/** The area under a series, fading from its hue at the top (18%) to nothing at the surface. */
function InkArea({ d, top, bottom, drawn = 0, strength = 1 }: { d: string; top: number; bottom: number; drawn?: number | undefined; strength?: number | undefined }) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!d) return null;
  return (
    <>
      <defs>
        <linearGradient id={`ink${id}`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={top} y2={bottom}>
          <stop offset="0" stopColor="var(--ns-series)" stopOpacity={0.18 * strength} />
          <stop offset="0.62" stopColor="var(--ns-series)" stopOpacity={0.05 * strength} />
          <stop offset="1" stopColor="var(--ns-series)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path key={drawn} d={d} fill={`url(#ink${id})`} data-ns-still={drawn ? "" : undefined} className={drawn ? "[animation:ns-fade_520ms_var(--ns-ease)_260ms_both]" : undefined} />
    </>
  );
}

/** The grid: a few hairlines that are barely there. */
function ChartGrid({ ys, x1 = 0, x2 }: { ys: number[]; x1?: number | undefined; x2: number }) {
  return (
    <g aria-hidden>
      {ys.map((y) => (
        <line key={y} x1={x1} x2={x2} y1={Math.round(y) + 0.5} y2={Math.round(y) + 0.5} stroke="var(--ns-line-soft)" strokeWidth={1} />
      ))}
    </g>
  );
}

/** Values on the grid, in the mono face, sitting just above their line at the left edge. */
function ChartYLabels({ ticks }: { ticks: { y: number; label: string }[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {ticks.map((t) => (
        <span key={t.label} className="absolute left-0 rounded-[4px] bg-[var(--ns-panel)] py-px pr-1 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-ink-3)]" style={{ transform: `translate3d(0,${Math.round(t.y) - 15}px,0)` }}>
          {t.label}
        </span>
      ))}
    </div>
  );
}

/** The halo on the point you're on: the series dot, cut from the surface, with a soft ring of its hue and a faint glow (its strength the theme's glow). */
function ChartHalo({ x, y, hidden }: { x: number; y: number; hidden?: boolean | undefined }) {
  return (
    <i
      aria-hidden
      data-slot="chart-halo"
      data-ns-glide=""
      className="pointer-events-none absolute top-0 left-0 z-[3] -mt-[5.5px] -ml-[5.5px] block size-[11px] rounded-full bg-[var(--ns-series)] shadow-[0_0_0_2.5px_var(--ns-panel),0_0_0_9px_color-mix(in_oklab,var(--ns-series)_16%,transparent),0_0_16px_6px_color-mix(in_oklab,var(--ns-series)_var(--ns-glow),transparent)] [transition:transform_110ms_var(--ns-ease),opacity_var(--ns-time-color)]"
      style={{ transform: `translate3d(${f1(x)}px,${f1(y)}px,0)`, opacity: hidden ? 0 : 1 }}
    />
  );
}

/** The guide: a thin ink line through the point you're reading. */
function ChartGuide({ x, on }: { x: number; on: boolean }) {
  return <i aria-hidden data-ns-glide="" className="pointer-events-none absolute inset-y-0 left-0 z-[2] block w-px bg-[var(--ns-ink)] [transition:transform_110ms_var(--ns-ease),opacity_var(--ns-time-color)]" style={{ transform: `translate3d(${f1(x)}px,0,0)`, opacity: on ? 0.26 : 0 }} />;
}

/**
 * The dark pill: the value you're on and what it is, following the pointer. It tries above the point, then below,
 * left and right, and takes the first that fits the window; it is drawn over the page, so a card's clipped edge never
 * cuts it. `lines` are a few more figures (a band's parts); `more` shows only while the pill is pinned.
 */
function ChartPill({ x, y, width, value, detail, lines, more, on: shown }: { x: number; y: number; width: number; value: React.ReactNode; detail?: React.ReactNode; lines?: React.ReactNode[] | undefined; more?: React.ReactNode[] | undefined; on: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { el, pinned, inSurface, engaged } = React.useContext(SurfaceContext);
  /* a linked chart marks the day; only the chart you're on says it */
  const on = shown && engaged;
  const portal = usePortalContainer();
  const hydrated = React.useSyncExternalStore(NO_STORE, () => true, () => false);
  const [size, setSize] = React.useState<[number, number]>([120, 30]);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  useIsoLayoutEffect(() => {
    const p = ref.current;
    if (!p) return;
    const w = p.offsetWidth, h = p.offsetHeight;
    if (w !== size[0] || h !== size[1]) setSize([w, h]);
  });
  /* while it shows, a scroll moves it with its point */
  React.useEffect(() => {
    if (!on) return;
    window.addEventListener("scroll", bump, true);
    return () => window.removeEventListener("scroll", bump, true);
  }, [on]);
  const [tw, th] = size;
  const rows = [...(lines ?? []), ...(pinned ? (more ?? []) : [])];
  const r = el.current?.getBoundingClientRect();
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth, vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const px = (r?.left ?? 0) + x, py = (r?.top ?? 0) + y;
  const gone = py < 0 || py > vh;
  const fits = (left: number, top: number) => left >= 4 && top >= 4 && left + tw <= vw - 4 && top + th <= vh - 4;
  const tries: [number, number][] = [
    [px - tw / 2, py - th - 14],
    [px - tw / 2, py + 16],
    [px - tw - 16, py - th / 2],
    [px + 16, py - th / 2],
  ];
  const [left, top] = tries.find(([l, t]) => fits(l, t)) ?? [Math.max(4, Math.min(vw - tw - 4, px - tw / 2)), Math.max(4, py - th - 14)];
  const pill = (
    <div
      ref={ref}
      aria-hidden
      data-slot="chart-pill"
      data-ns-glide=""
      data-ns-layer=""
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-[60] flex max-w-[min(calc(100vw-8px),320px)] flex-col gap-1 bg-[var(--ns-ink)] px-[11px] py-[6px] text-[var(--ns-canvas)] shadow-[0_8px_18px_-8px_rgb(0_0_0/0.5)] [transition:transform_110ms_var(--ns-ease),opacity_var(--ns-time-color)]",
        rows.length ? "rounded-[12px]" : "rounded-full",
        pinned && "shadow-[0_0_0_1.5px_var(--ns-canvas),0_10px_24px_-8px_rgb(0_0_0/0.55)]",
      )}
      style={{ transform: `translate3d(${f1(left)}px,${f1(top)}px,0) scale(${on ? 1 : 0.96})`, opacity: on && r && !gone ? 1 : 0, visibility: on && !gone ? "visible" : "hidden" }}
    >
      <span className="flex items-baseline gap-[7px] whitespace-nowrap">
        <b className="font-[family-name:var(--ns-font-display)] text-[13px] leading-[1.1] font-[number:var(--ns-weight-strong)] tabular-nums">{value}</b>
        {detail != null && <span className="text-[length:var(--ns-text-meta)] leading-[1.1] opacity-75">{detail}</span>}
      </span>
      {rows.map((l, i) => (
        <span key={i} className="text-[length:var(--ns-text-meta)] leading-[1.2] whitespace-nowrap tabular-nums opacity-80">
          {l}
        </span>
      ))}
      {pinned && <span className="text-[length:var(--ns-text-meta)] leading-[1.2] opacity-75">Pinned · Esc lets go</span>}
    </div>
  );
  if (!inSurface) {
    /* drawn by a chart that lays out its own plot: inside it, above the point (below near the top), kept within */
    const l2 = Math.max(0, Math.min(width - tw, x - tw / 2));
    const t2 = y - th - 14 < -6 ? y + 16 : y - th - 14;
    return React.cloneElement(pill, { className: cn(pill.props.className, "absolute z-[4]"), style: { ...pill.props.style, position: "absolute", transform: `translate3d(${f1(l2)}px,${f1(t2)}px,0) scale(${on ? 1 : 0.96})`, opacity: on ? 1 : 0 } });
  }
  /* a portal can't hydrate: on a server-rendered page the pill joins once the page is live */
  if (!hydrated) return null;
  return createPortal(pill, portal ?? document.body);
}

/**
 * The time axis: period labels in the mono face; the period you're on (the one holding `active`) is raised as a
 * chip. Labels that would collide are left out, the latest kept. Widths come from the mono face, so nothing is
 * measured.
 */
function ChartAxis({ ticks, active, width, chip }: { ticks: { x: number; label: string }[]; active: number | null; width: number; chip?: { x: number; label: string } | null | undefined }) {
  const W = (l: string) => l.length * 7.25 + 14;
  const placed: { x: number; label: string; left: number }[] = [];
  let right = Infinity;
  for (const t of [...ticks].sort((a, b) => b.x - a.x)) {
    const w = W(t.label), left = Math.max(0, Math.min(width - w, t.x - w / 2));
    if (left + w > right - 6 || t.x < -1 || t.x > width + 1) continue;
    placed.unshift({ ...t, left });
    right = left;
  }
  const on = chip ? null : active == null ? null : [...placed].reverse().find((t) => t.x <= active + 0.5) ?? null;
  /* while you scrub, the chip follows you with the exact day, and the labels under it step aside */
  const cw = chip ? W(chip.label) : 0;
  const cl = chip ? Math.max(0, Math.min(width - cw, chip.x - cw / 2)) : 0;
  return (
    <div aria-hidden data-slot="chart-axis" className="relative mt-1.5 h-[26px]">
      {placed.map((t) => {
        const under = chip && t.left < cl + cw + 4 && t.left + W(t.label) > cl - 4;
        return (
          <span
            key={`${t.label}${t.x}`}
            className={cn(
              "absolute top-0 left-0 rounded-[7px] px-[7px] py-1 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none font-[number:var(--ns-weight-medium)] whitespace-nowrap text-[var(--ns-ink-3)] [transition:background-color_var(--ns-time-color),color_var(--ns-time-color),box-shadow_var(--ns-time-color),opacity_var(--ns-time-color)]",
              t === on && "bg-[var(--ns-raised)] text-[var(--ns-ink)] shadow-[var(--ns-bezel)]",
            )}
            style={{ transform: `translate3d(${f1(t.left)}px,0,0)`, opacity: under ? 0 : 1 }}
          >
            {t.label}
          </span>
        );
      })}
      {chip && (
        <span data-ns-glide="" className="absolute top-0 left-0 z-[1] rounded-[7px] bg-[var(--ns-raised)] px-[7px] py-1 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none font-[number:var(--ns-weight-medium)] whitespace-nowrap text-[var(--ns-ink)] shadow-[var(--ns-bezel)] [transition:transform_110ms_var(--ns-ease)]" style={{ transform: `translate3d(${f1(cl)}px,0,0)` }}>
          {chip.label}
        </span>
      )}
    </div>
  );
}

/**
 * The scrubbable surface a chart is drawn on: a slider over its stops. A mouse reads along it by hovering, a finger
 * by dragging (the page still scrolls up and down), the keys by ← → (Shift for a week), Home and End; Esc and
 * leaving go back to rest. The value text says the stop you're on in words.
 */
const SurfaceContext = React.createContext<{ el: React.RefObject<HTMLDivElement | null>; pinned: boolean; inSurface: boolean; engaged: boolean }>({ el: { current: null }, pinned: false, inSurface: false, engaged: true });
function ChartSurface({ label, valueText, count, limit, active, rest, onActive, height, padX = [0, 0], step = 7, hint, children, className }: {
  label: string;
  valueText: string;
  /** the stops across the plot's width */
  count: number;
  /** the last stop that can be read (a forecast drawn past today can't be): defaults to the last */
  limit?: number | undefined;
  active: number | null;
  /** the stop the chart rests on (the latest) */
  rest: number;
  onActive: (i: number | null) => void;
  height: number;
  /** the plot's own inset at each side, so a pointer maps onto the stops */
  padX?: [number, number] | undefined;
  /** stops Shift+arrow moves */
  step?: number | undefined;
  /** how to read it, said after the name (the name says what and when) */
  hint?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  const down = React.useRef(false);
  const moved = React.useRef(false);
  const el = React.useRef<HTMLDivElement>(null);
  const hintId = React.useId();
  /* pinned: the pill stays on its point (a click, Enter or Space), showing its fuller figures, until Esc or a second press */
  const [pinned0, setPinned] = React.useState(false);
  /* a pin lets go by itself when the chart goes back to rest */
  const pinned = pinned0 && active != null;
  /* engaged: the reader is on this chart (pointer, focus or pin); a linked chart beside it only marks the day */
  const [engaged, setEngaged] = React.useState(false);
  const at = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = (e.clientX - r.left - padX[0]) / Math.max(1, r.width - padX[0] - padX[1]);
    return Math.min(last, Math.round(Math.max(0, Math.min(1, f)) * (count - 1)));
  };
  const last = Math.min(count - 1, limit ?? count - 1);
  const ctx = React.useMemo(() => ({ el, pinned, inSurface: true, engaged: engaged || pinned }), [pinned, engaged]);
  return (
    <div
      ref={el}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-describedby={hintId}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, last)}
      aria-valuenow={active ?? rest}
      aria-valuetext={valueText}
      data-slot="chart-surface"
      data-pinned={pinned || undefined}
      onPointerEnter={() => setEngaged(true)}
      onFocus={() => setEngaged(true)}
      onPointerDown={(e) => {
        setEngaged(true);
        down.current = true;
        moved.current = false;
        if (e.pointerType !== "mouse") e.currentTarget.setPointerCapture?.(e.pointerId);
        if (!pinned) onActive(at(e));
      }}
      onPointerMove={(e) => {
        if (down.current) moved.current = true;
        if (!pinned && (down.current || e.pointerType === "mouse")) onActive(at(e));
      }}
      onPointerUp={(e) => {
        down.current = false;
        /* a press without a drag pins the pill where it is, or lets go of it */
        if (!moved.current) {
          if (pinned) setPinned(false);
          else {
            onActive(at(e));
            setPinned(true);
          }
          return;
        }
        if (e.pointerType !== "mouse" && !pinned) onActive(null);
      }}
      onPointerCancel={() => {
        down.current = false;
        if (!pinned) onActive(null);
      }}
      onPointerLeave={(e) => {
        if (document.activeElement !== e.currentTarget) setEngaged(false);
        if (e.pointerType === "mouse" && !pinned) {
          down.current = false;
          onActive(null);
        }
      }}
      onBlur={() => (setPinned(false), setEngaged(false), onActive(null))}
      onKeyDown={(e) => {
        if (e.key === "Escape" && (active != null || pinned)) {
          e.stopPropagation();
          setPinned(false);
          onActive(null);
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (pinned) setPinned(false);
          else {
            if (active == null) onActive(rest);
            setPinned(true);
          }
          return;
        }
        const cur = active ?? rest;
        const to = e.key === "ArrowLeft" ? cur - (e.shiftKey ? step : 1) : e.key === "ArrowRight" ? cur + (e.shiftKey ? step : 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
        if (to == null) return;
        e.preventDefault();
        onActive(Math.max(0, Math.min(last, to)));
      }}
      className={cn("relative cursor-crosshair touch-pan-y rounded-[10px] outline-hidden select-none focus-visible:shadow-[0_0_0_2px_var(--ns-signal)] data-pinned:cursor-default", className)}
      style={{ height }}
    >
      <span id={hintId} className="sr-only">
        {hint ?? `Arrow keys read each point, Shift moves further; Enter pins its figures; Esc lets go.`}
      </span>
      {/* the pill's words, said politely as they change */}
      <span role="status" aria-live="polite" className="sr-only">
        {active != null ? valueText : ""}
      </span>
      <SurfaceContext.Provider value={ctx}>{children}</SurfaceContext.Provider>
    </div>
  );
}

/** A bar's outline: rounded at its top (4px, less on a thin or short bar), square on the baseline. */
function barPath(x: number, y: number, w: number, h: number, r = 4): string {
  if (h <= 0 || w <= 0) return "";
  const k = Math.max(0, Math.min(r, w / 2, h));
  return `M${f1(x)} ${f1(y + h)}V${f1(y + k)}A${f1(k)} ${f1(k)} 0 0 1 ${f1(x + k)} ${f1(y)}H${f1(x + w - k)}A${f1(k)} ${f1(k)} 0 0 1 ${f1(x + w)} ${f1(y + k)}V${f1(y + h)}Z`;
}

/**
 * The violet glow's parts, defined once per chart (LANGUAGE.md §9): a resting fill that fades from its top to 60% at
 * its base, the focus fill (lilac at the top into the series hue at the base), and the one blur the glow is drawn
 * with. `color` is the hue they take: the series by default, a meaning colour (a state, a stage) for its own chart.
 */
function ChartFinish({ id, color = "var(--ns-series)", lilac = color === "var(--ns-series)" ? "var(--ns-series-lilac)" : color }: { id: string; color?: string | undefined; lilac?: string | undefined }) {
  return (
    <defs>
      <linearGradient id={`${id}t`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" style={{ stopColor: color, stopOpacity: 1 }} />
        <stop offset="1" style={{ stopColor: color, stopOpacity: 0.6 }} />
      </linearGradient>
      <linearGradient id={`${id}f`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" style={{ stopColor: lilac }} />
        <stop offset="1" style={{ stopColor: color }} />
      </linearGradient>
      <filter id={`${id}g`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
    </defs>
  );
}

/**
 * The value of the chart's one focus mark, in a small ink pill above it (never in the series colour). While you read
 * this chart (`reading`) the dark pill says it instead, so this one steps aside.
 */
function FocusValue({ x, y, value, reading }: { x: number; y: number; value: React.ReactNode; reading?: boolean | undefined }) {
  const { engaged } = React.useContext(SurfaceContext);
  const hidden = reading && engaged;
  return (
    <span data-slot="chart-focus-value" data-ns-glide="" className="absolute top-0 left-0 -ml-6 flex w-12 justify-center [transition:opacity_150ms_var(--ns-ease)]" style={{ transform: `translate3d(${f1(x)}px,${f1(y)}px,0)`, opacity: hidden ? 0 : 1 }}>
      <b className="rounded-[6px] bg-[var(--ns-ink)] px-1.5 py-[3px] text-[length:var(--ns-text-meta)] leading-none font-[number:var(--ns-weight-strong)] text-[var(--ns-canvas)] tabular-nums">{value}</b>
    </span>
  );
}

/**
 * Bars in the one hue, a count per period (a week, a cycle, a number of days), in the violet glow: each bar is a
 * soft tint of the series that fades toward its base, rounded at its top and square on the baseline, 2px apart, its
 * figure written above it in ink. One bar is the focus: the one you're reading (pointer, keys or a linked chart), at
 * rest the latest complete period. It fills from lilac at its top into the series hue, its figure in an ink pill, and
 * at rest a soft glow sits under it (one blur per chart, never redrawn during a scrub); the change of focus eases in
 * 150ms. `kind` quietens a bar ("quiet"), strengthens one
 * ("sampled": what a forecast drew from) or draws it hollow ("partial": a period so far, a dashed series outline).
 * On a page's first arrival in a session the bars rise from the baseline one after another; a change of data grows
 * or shrinks them from where they stand, their figures rolling with them. `marks` stand just after a bar (the
 * median, the 85th: `at` is that bar's index), ink hairlines, solid or dashed.
 */
type ChartBar = { label: string; value: number; tip: string; axis?: string | undefined; kind?: "sampled" | "partial" | "quiet" | undefined };
/* the resting strengths, as a share of the theme's tint (light 30%, dark 38%) */
const BAR_TINT = { rest: "var(--ns-series-tint)", sampled: "calc(var(--ns-series-tint) * 1.9)", quiet: "calc(var(--ns-series-tint) * 0.6)" } as const;
function ChartBars({ bars, label, height = 150, unit, marks = [], dayOf, span = 7, rest: restAt, className }: { bars: ChartBar[]; label: string; height?: number | undefined; unit: (n: number) => string; /** the bar the focus rests on (default: the latest complete period; a histogram rests on its typical bar) */ rest?: number | undefined; marks?: { at: number; label: string; dashed?: boolean | undefined }[] | undefined; /** inside a ChartLink: the first day each bar covers (relative to today), `span` days long */ dayOf?: ((i: number) => number) | undefined; span?: number | undefined; className?: string | undefined }) {
  const [box, W] = useChartWidth<HTMLDivElement>(520);
  const [active, setActive] = useChartActive(bars.length, dayOf, span);
  const [table, setTable] = React.useState(false);
  const id = `cb${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const n = bars.length;
  const gap = 2;
  const bw = Math.max(3, (W - gap * (n - 1)) / Math.max(1, n));
  const top = Math.max(1, ...bars.map((b) => b.value)) * 1.08;
  const PT = 26;
  const x = (i: number) => i * (bw + gap) + bw / 2;
  const at = active == null ? null : bars[active];
  const every = Math.max(1, Math.ceil((n * 34) / Math.max(1, W)));
  const entering = useEntrance("bars");
  /* the values travel, not the pixels: a change of data grows or shrinks each bar from where it stands */
  const [run, scale] = useMorph([bars.map((b, i) => [i, b.value] as Pt), [[0, top]]], MORPH_MS, entering ? [bars.map((_, i) => [i, 0] as Pt), [[0, top]]] : null, 45);
  const v = (i: number) => Math.max(0, run?.[i]?.[1] ?? bars[i]?.value ?? 0);
  const h = (val: number) => (val / Math.max(1e-6, scale?.[0]?.[1] ?? top)) * (height - PT);
  /* a zero draws nothing (no stub that reads as a little); its 0 is written instead */
  const bh = (i: number) => (v(i) > 0.05 ? Math.max(2, h(v(i))) : 0);
  /* the focus: the bar you're reading, or at rest the latest complete period */
  const rest = restAt != null && bars[restAt] ? restAt : bars.reduce((r, b, i) => (b.kind === "partial" ? r : i), -1);
  const focus = active ?? (rest >= 0 ? rest : null);
  /* the glow is drawn only once the bars have settled and only at rest: never re-blurred frame by frame while they
     move, or at every step of a scrub (the lilac focus fill follows the reader; the glow waits where it rests) */
  const settled = bars.every((b, i) => Math.abs(v(i) - b.value) < 1e-3);
  const shape = (i: number) => barPath(i * (bw + gap), height - bh(i), bw, bh(i));
  return (
    <div ref={box} data-slot="chart-bars" className={cn("min-w-0", className)}>
      <ChartSurface label={label} valueText={at ? `${at.tip}: ${unit(at.value)}` : `${n} bars; the last, ${bars.at(-1)?.tip ?? ""}: ${unit(bars.at(-1)?.value ?? 0)}`} count={n} active={active} rest={n - 1} onActive={setActive} height={height} padX={[bw / 2, bw / 2]} step={4}>
        <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} aria-hidden className="absolute inset-0 block overflow-visible">
          <ChartFinish id={id} />
          {focus != null && active == null && settled && bh(focus) > 0 && <path data-slot="chart-glow" d={shape(focus)} fill="var(--ns-series)" filter={`url(#${id}g)`} style={{ opacity: "var(--ns-glow)" }} />}
          {bars.map((b, i) => {
            const on = focus === i, d = shape(i);
            if (!d) return null;
            return (
              <g key={i} data-bar={on ? "focus" : b.kind === "partial" ? "partial" : "rest"}>
                {b.kind === "partial" ? (
                  <path d={d} fill="none" stroke="var(--ns-series)" strokeWidth={1.5} strokeDasharray="3 2" />
                ) : (
                  <path d={d} fill={`url(#${id}t)`} style={{ fillOpacity: BAR_TINT[b.kind ?? "rest"] }} />
                )}
              </g>
            );
          })}
          {/* the one focus fill, over its bar: it fades in over 150ms where the focus lands (still with less motion) */}
          {focus != null && shape(focus) && <path key={focus} data-slot="chart-focus" d={shape(focus)} fill={`url(#${id}f)`} data-ns-still="" className="[animation:ns-fade_150ms_var(--ns-ease)_both]" />}
          <line x1={0} x2={W} y1={height - 0.5} y2={height - 0.5} stroke="var(--ns-line)" />
        </svg>
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {bars.map((b, i) =>
            i !== focus && (b.value || b.kind !== "partial") ? (
              <span key={i} className="absolute top-0 left-0 w-8 -ml-4 text-center text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-ink-2)] tabular-nums" style={{ transform: `translate3d(${f1(x(i))}px,${f1(height - h(v(i)) - 16)}px,0)` }}>
                {Number.isInteger(b.value) ? Math.round(v(i)) : b.value}
              </span>
            ) : null,
          )}
          {focus != null && bars[focus] && <FocusValue x={x(focus)} y={height - h(v(focus)) - 24} value={Number.isInteger(bars[focus].value) ? Math.round(v(focus)) : bars[focus].value} reading={active != null} />}
          {marks.map((m) => {
            const mx = Math.min(W - 1, x(m.at) + bw / 2 + gap / 2);
            return (
              <span key={m.label} className="absolute top-[6px] bottom-0 left-0 w-0 border-l border-[var(--ns-ink)] opacity-55" style={{ transform: `translate3d(${f1(mx - 0.5)}px,0,0)`, borderLeftStyle: m.dashed ? "dashed" : "solid" }} />
            );
          })}
        </div>
        <ChartPill x={active == null ? 0 : x(active)} y={active == null ? 0 : height - h(v(active)) - 10} width={W} on={active != null} value={at ? unit(at.value) : ""} detail={at?.tip} />
      </ChartSurface>
      <div aria-hidden className="relative mt-1.5 h-4">
        {bars.map((b, i) => {
          const t = b.axis ?? "";
          if (!t || (i % every && i !== n - 1)) return null;
          return (
            <span key={i} className={cn("absolute top-0 left-0 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none whitespace-nowrap", active === i ? "text-[var(--ns-ink)]" : "text-[var(--ns-ink-3)]")} style={{ transform: `translate3d(${f1(Math.max(0, Math.min(W - t.length * 7.25, x(i) - (t.length * 7.25) / 2)))}px,0,0)` }}>
              {t}
            </span>
          );
        })}
      </div>
      <ChartTableToggle open={table} onToggle={() => setTable(!table)} className="mt-1 flex" />
      <ChartTable caption={label} head={["Period", "Count"]} rows={bars.map((b) => [b.tip, b.value])} open={table} active={active} onPick={setActive} />
    </div>
  );
}

/** The one figure a chart answers, large, with its label small above it; it rolls only when the reader changes it. */
function ChartHero({ label, value, detail, delta, instant, className }: { label: React.ReactNode; value: string; detail?: React.ReactNode; /** a ChartDelta beside the figure */ delta?: React.ReactNode; instant?: boolean | undefined; className?: string | undefined }) {
  return (
    <div data-slot="chart-hero" className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">{label}</span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <RollingNumber value={value} instant={instant} className="font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-hero)] leading-[1.05] font-[number:var(--ns-weight-strong)] tracking-[-0.03em] text-[var(--ns-ink)]" />
        {delta}
      </span>
      {detail != null && <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">{detail}</span>}
    </div>
  );
}

/** A smaller figure beside the hero (the 85% date, the target): label above, value below. */
function ChartFact({ label, value, instant, tone }: { label: React.ReactNode; value: string; instant?: boolean | undefined; tone?: "bad" | undefined }) {
  return (
    <div data-slot="chart-fact" className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">{label}</span>
      <RollingNumber value={value} instant={instant} className={cn("font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-strong)] leading-[1.2] font-[number:var(--ns-weight-strong)]", tone === "bad" ? "text-[var(--ns-bad-ink)]" : "text-[var(--ns-ink)]")} />
    </div>
  );
}

/** What each mark means, with its figure written beside it. */
function ChartKey({ items, className }: { items: { mark: React.ReactNode; label: React.ReactNode; value?: React.ReactNode }[]; className?: string | undefined }) {
  return (
    <div data-slot="chart-key" className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)]", className)}>
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {it.mark != null && <span aria-hidden className="inline-grid size-3 place-items-center">{it.mark}</span>}
          {it.label}
          {it.value != null && <b className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] tabular-nums">{it.value}</b>}
        </span>
      ))}
    </div>
  );
}

/** A swatch of the series hue for a key: a step of the band, or the line itself. */
function SeriesSwatch({ step, line }: { step?: number | undefined; line?: "solid" | "dashed" | "quiet" | undefined }) {
  if (line)
    return (
      <svg width="14" height="8" aria-hidden>
        <line x1="1" x2="13" y1="4" y2="4" stroke={line === "quiet" ? "var(--ns-ink-3)" : "var(--ns-series)"} strokeWidth={line === "quiet" ? 1.5 : 2} strokeLinecap="round" strokeDasharray={line === "dashed" ? "1 3.5" : line === "quiet" ? "4 3" : undefined} />
      </svg>
    );
  return <i className="block size-2.5 rounded-[3px] bg-[var(--ns-series)]" style={{ opacity: step ?? 1 }} />;
}

/**
 * Every point of a chart: for a screen reader always, and on screen when the reader asks (ChartTableToggle). The
 * table and the picture are one selection: pressing a row reads that point on the chart, and the point you're on is
 * the row that's marked. `index` maps each row to its stop when the table shows fewer rows than the chart has.
 */
function ChartTable({ caption, head, rows, open, active, onPick, index }: { caption: string; head: string[]; rows: (string | number)[][]; open?: boolean | undefined; active?: number | null | undefined; onPick?: ((i: number) => void) | undefined; index?: number[] | undefined }) {
  const stop = (r: number) => index?.[r] ?? r;
  const table = (
    <table className={open ? "w-full border-collapse text-[length:var(--ns-text-small)] tabular-nums" : undefined}>
      <caption className={open ? "sr-only" : undefined}>{caption}</caption>
      <thead>
        <tr className={open ? "border-b border-[var(--ns-line)] text-left text-[var(--ns-ink-3)]" : undefined}>
          {head.map((h, j) => (
            <th key={h} scope="col" className={open ? cn("py-1.5 pr-3 font-[number:var(--ns-weight-medium)]", j && "text-right") : undefined}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={i}
            aria-selected={open && onPick ? active === stop(i) : undefined}
            onClick={open && onPick ? () => onPick(stop(i)) : undefined}
            className={open ? cn("border-b border-[var(--ns-line-soft)] [transition:background-color_var(--ns-time-color)]", onPick && "cursor-pointer hover:bg-[var(--ns-hover)]", active === stop(i) && "bg-[var(--ns-selected)]") : undefined}
          >
            {r.map((c, j) => (
              <td key={j} className={open ? cn("py-1.5 pr-3", j && "text-right") : undefined}>
                {j === 0 && open && onPick ? (
                  <button type="button" onClick={(e) => (e.stopPropagation(), onPick(stop(i)))} className="cursor-pointer rounded-[4px] text-left outline-hidden focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]">
                    {c}
                  </button>
                ) : (
                  c
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  /* hidden, the table sits in a box clipped to nothing: a table never shrinks below its content, so it can't take
     the hiding itself */
  if (!open) return <div className="sr-only">{table}</div>;
  /* without row buttons the box itself takes focus, so its scroll is reachable by keyboard */
  return (
    <div data-slot="chart-table" tabIndex={onPick ? undefined : 0} role={onPick ? undefined : "region"} aria-label={onPick ? undefined : caption} className="max-h-[260px] overflow-auto overscroll-contain rounded-[10px] px-3 py-1 shadow-[inset_0_0_0_1px_var(--ns-line-soft)] outline-hidden focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]">
      {table}
    </div>
  );
}
/** The quiet switch between a chart's picture and its table. */
function ChartTableToggle({ open, onToggle, className }: { open: boolean; onToggle: () => void; className?: string | undefined }) {
  return (
    <button type="button" aria-pressed={open} onClick={onToggle} className={cn("cursor-pointer self-end rounded-[6px] px-1.5 py-0.5 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] outline-hidden hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] aria-pressed:text-[var(--ns-ink)]", className)}>
      {open ? "Hide the table" : "Show as a table"}
    </button>
  );
}

/**
 * View detail: every chart card's way to the rows behind it, said in words rather than left to clicking marks. With
 * `expanded` it opens the rows in place (aria-expanded, a chevron that turns); without, it goes to the filtered list
 * (an arrow). It sits in the card's header, after its title.
 */
function ViewDetail({ onClick, expanded, controls, label = "View detail", className }: { onClick: () => void; expanded?: boolean | undefined; controls?: string | undefined; label?: string | undefined; className?: string | undefined }) {
  const toggle = expanded !== undefined;
  return (
    <button
      type="button"
      data-slot="view-detail"
      onClick={onClick}
      aria-expanded={toggle ? expanded : undefined}
      aria-controls={toggle ? controls : undefined}
      className={cn("inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-[var(--ns-radius)] px-2 text-[length:var(--ns-text-small)] whitespace-nowrap text-[var(--ns-ink-2)] outline-hidden hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] pointer-coarse:h-9", className)}
    >
      {toggle && expanded ? "Hide detail" : label}
      <svg aria-hidden viewBox="0 0 16 16" className={cn("size-3.5 [transition:transform_var(--ns-time-color)_var(--ns-ease)]", toggle && expanded && "rotate-180")} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        {toggle ? <path d="M4 6l4 4 4-4" /> : <path d="M5 11l6-6M6 5h5v5" />}
      </svg>
    </button>
  );
}

/** A sentence in place of a chart that has nothing to draw yet: what would fill it. */
function ChartEmpty({ children, height }: { children: React.ReactNode; height?: number | undefined }) {
  return (
    <div data-slot="chart-empty" className="grid place-items-center rounded-[10px] px-6 text-center text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)] shadow-[inset_0_0_0_1px_var(--ns-line-soft)]" style={{ minHeight: height ?? 160 }}>
      <p className="m-0 max-w-[44ch]">{children}</p>
    </div>
  );
}

/** The chart family's own frame: the parts above, as one export a block reaches through. */
function Chart({ children, className }: { children: React.ReactNode; className?: string | undefined }) {
  return (
    <div data-slot="chart" className={cn("flex min-w-0 flex-col", className)}>
      {children}
    </div>
  );
}

export {
  Chart,
  ChartLink,
  ChartTableToggle,
  ViewDetail,
  useChartActive,
  useMorph,
  useEntrance,
  gapShapes,
  GapShape,
  GapKey,
  ChartDelta,
  deltaOf,
  nsEase,
  MORPH_MS,
  ChartAxis,
  ChartBars,
  ChartFinish,
  FocusValue,
  barPath,
  ChartEmpty,
  ChartFact,
  ChartGrid,
  ChartGuide,
  ChartHalo,
  ChartHero,
  ChartKey,
  ChartPill,
  ChartSurface,
  ChartTable,
  ChartYLabels,
  InkArea,
  InkLine,
  SERIES_STEPS,
  SeriesSwatch,
  areaPath,
  niceTicks,
  smoothPath,
  stepPath,
  useChartWidth,
  useInkDraw,
  type ChartBar,
  type Pt,
};
