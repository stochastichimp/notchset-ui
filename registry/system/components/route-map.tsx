// Notchset route-map 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { BEAT_HALO, beatPeriod, beatStyle, useAwake } from "@/lib/notchset/living";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/*
 * Route map: a walk or run on a map. The GPS points are projected in Web Mercator and the zoom picked so the route's
 * bounds fit the box with padding; under it go the tiles of any XYZ raster provider you pass (`tiles`, with its
 * attribution; MapTiler, Stadia, Mapbox or your own), or a vector basemap you ship (`basemap`, drawn in the page's own
 * roles, so it follows day and night), or nothing (the page's paper). No map library and no network of its own.
 * On the line: a start dot, a finish flag, direction chevrons, a mark at each whole kilometre, and a record badge
 * only where you pass one. A live route ends in where you are: a soft halo, a cone the way you're heading and the dot.
 * A street-map basemap draws roads by class (arterials widest, streets, dashed paths), casings first so crossings
 * join, faint buildings, parks, water with a shore, names that follow their road and a few place dots. The line is the signal over a canvas casing, so it reads first on any ground.
 *
 *   <RouteMap label="Walk, 3.1 km" points={pts} tiles={{ tiles: "https://tiles.example/{z}/{x}/{y}.png", attribution: "© OpenStreetMap" }} />
 */
export type MapTiles = { tiles: string; attribution: string; maxZoom?: number | undefined };
export type VectorBasemap = {
  /** [lat, lng] of the basemap's local origin; the layers are in metres from it, x east and y south */
  origin: readonly [number, number];
  /** city blocks as plain shapes (an older, simpler basemap); a street map passes buildings and streets instead */
  blocks?: string | undefined;
  /** faint building footprints */
  buildings?: string | undefined;
  parks: string;
  water: string;
  /** the main roads, drawn widest */
  arterials: string;
  /** ordinary streets, narrower, with the same casing */
  streets?: string | undefined;
  /** footpaths, a fine dashed line */
  paths: string;
  /** names: parks and water lie flat to the map, a road's name follows its road (`angle`) */
  labels: readonly { text: string; x: number; y: number; angle: number; kind: "park" | "water" | "road" }[];
  /** a few places, a dot and a tiny name */
  places?: readonly { text: string; x: number; y: number; kind: "cafe" | "station" }[] | undefined;
  attribution: string;
};
type LatLng = readonly [number, number];
type RouteMapProps = {
  points: readonly LatLng[];
  label: string;
  tiles?: MapTiles | undefined;
  basemap?: VectorBasemap | undefined;
  kmMarks?: boolean | undefined;
  /** the stretch a record was set on (point indexes) and its words, "Fastest 2 km" */
  record?: { from: number; to: number; label: string } | null | undefined;
  /** a live route: no finish flag, the last point drawn as the current position */
  live?: boolean | undefined;
  /** a live route's heart rate (bpm): the position's halo beats at it (living.ts); left out (or paused), it rests */
  beat?: number | null | undefined;
  /** px; left out, it follows the width (four fifths of it, 300 to 460) */
  height?: number | undefined;
  /** take the height of the box it sits in (a live screen's map), instead of `height` */
  fill?: boolean | undefined;
  className?: string | undefined;
};

/* the map's roles, all derived from the page's own so day and night follow: the ground the canvas, roads one step
   lighter than it (white by day, slate at night) inside a casing one step darker, buildings a breath of ink, parks a
   soft green and water a muted blue mixed into the ground (with a lighter shore), the line the signal over a canvas
   casing */
const ROLES = {
  "--rm-ground": "color-mix(in oklab, var(--ns-ink) 3%, var(--ns-canvas))",
  "--rm-block": "color-mix(in oklab, var(--ns-ink) 10%, var(--ns-canvas))",
  "--rm-building": "color-mix(in oklab, var(--ns-ink) 7%, var(--rm-ground))",
  "--rm-park": "color-mix(in oklab, var(--ns-ok) 16%, var(--rm-ground))",
  "--rm-water": "color-mix(in oklab, var(--ns-cat-1) 24%, var(--rm-ground))",
  "--rm-shore": "color-mix(in oklab, var(--ns-cat-1) 11%, var(--rm-ground))",
  "--rm-road": "oklch(from var(--ns-canvas) calc(l + 0.075) calc(c * 0.6) h)",
  "--rm-road-casing": "oklch(from var(--ns-canvas) calc(l - 0.075) c h)",
  "--rm-path": "color-mix(in oklab, var(--ns-ink) 30%, var(--rm-park))",
  "--rm-label-park": "color-mix(in oklab, var(--ns-ok) 45%, var(--ns-ink-2))",
  "--rm-label-water": "color-mix(in oklab, var(--ns-cat-1) 45%, var(--ns-ink-2))",
  "--rm-label-road": "var(--ns-ink-2)",
  "--rm-place": "var(--ns-ink-3)",
  "--rm-halo": "var(--rm-ground)",
  "--rm-casing": "var(--ns-canvas)",
  "--rm-line": "var(--ns-signal)",
} as React.CSSProperties;

const TILE = 256;
const EARTH = 40075016.686;
/** Web Mercator: [lat, lng] to world pixels at zoom 0 (0 to 256 on each axis). */
export function mercator([lat, lng]: LatLng): [number, number] {
  const s = Math.sin((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180);
  return [((lng + 180) / 360) * TILE, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE];
}
/** The zoom (fractional, at most maxZoom) at which the points' bounds fit a w×h box inside `pad` on every side, and its centre. */
export function fitView(points: readonly LatLng[], w: number, h: number, pad: number, maxZoom = 19) {
  const ps = points.map(mercator);
  const xs = ps.map((p) => p[0]),
    ys = ps.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const fit = Math.min((w - 2 * pad) / Math.max(x1 - x0, 1e-9), (h - 2 * pad) / Math.max(y1 - y0, 1e-9));
  const zoom = Math.min(maxZoom, Math.log2(Math.max(fit, 1)));
  return { zoom, center: [(x0 + x1) / 2, (y0 + y1) / 2] as [number, number] };
}
/** Screen [x, y] of a point in a w×h view at `zoom` around `center` (world px at zoom 0). */
export const toScreen = (p: LatLng, v: { zoom: number; center: [number, number] }, w: number, h: number): [number, number] => {
  const [x, y] = mercator(p),
    k = 2 ** v.zoom;
  return [w / 2 + (x - v.center[0]) * k, h / 2 + (y - v.center[1]) * k];
};
/** The XYZ tiles covering the view at the nearest whole zoom, each with its screen box. */
export function tilesFor(v: { zoom: number; center: [number, number] }, w: number, h: number, maxZoom = 19) {
  const z = Math.max(0, Math.min(maxZoom, Math.round(v.zoom)));
  const n = 2 ** z,
    k = 2 ** v.zoom,
    size = (TILE / n) * k;
  const left = v.center[0] - w / 2 / k,
    top = v.center[1] - h / 2 / k;
  const out: { z: number; x: number; y: number; left: number; top: number; size: number }[] = [];
  for (let tx = Math.floor((left * n) / TILE); tx <= Math.floor(((left + w / k) * n) / TILE); tx++)
    for (let ty = Math.floor((top * n) / TILE); ty <= Math.floor(((top + h / k) * n) / TILE); ty++) {
      if (ty < 0 || ty >= n) continue;
      out.push({ z, x: ((tx % n) + n) % n, y: ty, left: ((tx * TILE) / n - left) * k, top: ((ty * TILE) / n - top) * k, size });
    }
  return out;
}
const tileUrl = (t: string, z: number, x: number, y: number) => t.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y)).replace("{s}", "a");

const R = 6371000;
const rad = Math.PI / 180;
const metres = (a: LatLng, b: LatLng) => {
  const x = Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

/* The ref is a callback, so the measuring follows the element itself: a map that first renders empty and then gets points measures the box it now draws. */
function useSize(fallback: number) {
  const [el, setEl] = React.useState<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState<[number, number]>([fallback, 0]);
  useIsomorphicLayoutEffect(() => {
    if (!el) return;
    const read = () => setSize([Math.round(el.clientWidth) || fallback, Math.round(el.clientHeight)]);
    const ro = new ResizeObserver(read);
    ro.observe(el);
    read();
    return () => ro.disconnect();
  }, [el, fallback]);
  return [setEl, size] as const;
}

function RouteMap({ points, label, tiles, basemap, kmMarks = true, record, live, beat, height, fill, className }: RouteMapProps) {
  const [ref, [w, fh]] = useSize(640);
  const beatRef = React.useRef<HTMLSpanElement>(null);
  useAwake(beatRef, !!live && beatPeriod(beat) != null);
  const h = fill ? Math.max(200, fh) : (height ?? Math.round(Math.max(300, Math.min(460, w * 0.8))));
  if (points.length < 1) return null;
  const maxZoom = tiles?.maxZoom ?? 19;
  /* a live route keeps about 600 m around where you are: the start isn't a close-up, and a walk's first half
     kilometre reads at the length the readout says against the blocks around it */
  const last = points.at(-1)!;
  const around: LatLng[] = live || points.length < 2 ? [[last[0] - 0.0027, last[1] - 0.0043], [last[0] + 0.0027, last[1] + 0.0043]] : [];
  const view = fitView([...points, ...around], w, h, Math.min(56, w * 0.12), maxZoom);
  const xy = points.map((p) => toScreen(p, view, w, h));
  const d = xy.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  /* whole kilometres, and a chevron every ~110 px of line, pointing the way it was walked */
  const kms: { at: [number, number]; km: number }[] = [];
  const chevrons: { at: [number, number]; deg: number }[] = [];
  let run = 0,
    px = 0;
  for (let i = 1; i < points.length; i++) {
    const before = run;
    run += metres(points[i - 1]!, points[i]!);
    if (kmMarks && Math.floor(run / 1000) > Math.floor(before / 1000)) kms.push({ at: xy[i]!, km: Math.floor(run / 1000) });
    const [a, b] = [xy[i - 1]!, xy[i]!];
    px += Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (px > 110 && i < points.length - 3) {
      px = 0;
      const c = xy[Math.min(i + 2, xy.length - 1)]!;
      chevrons.push({ at: b, deg: (Math.atan2(c[1] - a[1], c[0] - a[0]) * 180) / Math.PI });
    }
  }
  const start = xy[0]!,
    end = xy.at(-1)!;
  /* the heading: from the last point a few metres back to the latest, degrees clockwise from north (screen up) */
  const back = live ? [...xy].reverse().find((p) => Math.hypot(p[0] - end[0], p[1] - end[1]) > 6) : undefined;
  const heading = back ? (Math.atan2(end[0] - back[0], back[1] - end[1]) * 180) / Math.PI : null;
  const beating = !!live && beatPeriod(beat) != null;
  const rec = record ? xy[Math.round((record.from + record.to) / 2)] : null;
  const recD = record ? xy.slice(record.from, record.to + 1).map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("") : "";
  /* the vector basemap: metres from its origin, scaled to this zoom */
  const base = basemap
    ? (() => {
        const o = toScreen(basemap.origin, view, w, h);
        const k = (TILE * 2 ** view.zoom) / (EARTH * Math.cos(basemap.origin[0] * rad));
        return { o, k };
      })()
    : null;
  const attribution = tiles?.attribution ?? basemap?.attribution;
  /* the boxes a map label keeps clear of: the kilometre marks and the two ends, then each label as it's placed */
  const placed: [number, number, number, number][] = [...kms.map((m): [number, number, number, number] => [m.at[0], m.at[1], 9, 9]), [start[0], start[1], 10, 10], [end[0], end[1], 10, 10]];
  const shown = new Set<string>();
  /* road widths in px: their real width at this zoom, never thinner than a hairline street or wider than a boulevard */
  const road = base ? { arterial: Math.max(3, Math.min(13, 20 * base.k)), street: Math.max(1.6, Math.min(8, 10 * base.k)) } : { arterial: 0, street: 0 };
  return (
    <figure data-slot="route-map" className={cn("relative m-0 min-w-0 overflow-hidden", fill && "h-full", className)} style={{ height: fill ? undefined : h, ...ROLES }}>
      <div ref={ref} className="absolute inset-0">
        <svg role="img" aria-label={label} width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
          <rect width={w} height={h} fill={basemap || tiles ? "var(--rm-ground)" : "transparent"} />
          {tiles && tilesFor(view, w, h, maxZoom).map((t) => <image key={`${t.z}/${t.x}/${t.y}/${t.left}`} href={tileUrl(tiles.tiles, t.z, t.x, t.y)} x={t.left} y={t.top} width={t.size + 0.5} height={t.size + 0.5} preserveAspectRatio="none" />)}
          {base && basemap && (
            <g aria-hidden>
              <g transform={`translate(${base.o[0]} ${base.o[1]}) scale(${base.k})`}>
                <path d={basemap.parks} fill="var(--rm-park)" />
                <path d={basemap.water} fill="var(--rm-water)" stroke="var(--rm-shore)" strokeWidth={5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                {basemap.blocks && <path d={basemap.blocks} fill="var(--rm-block)" />}
                {basemap.buildings && <path d={basemap.buildings} fill="var(--rm-building)" />}
                <path d={basemap.paths} fill="none" stroke="var(--rm-path)" strokeWidth={1.1} strokeDasharray="3 2.5" vectorEffect="non-scaling-stroke" />
                {/* roads by class: every casing first, then every fill, so crossings join like a real map's */}
                {basemap.streets && <path d={basemap.streets} fill="none" stroke="var(--rm-road-casing)" strokeWidth={road.street + 1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
                <path d={basemap.arterials} fill="none" stroke="var(--rm-road-casing)" strokeWidth={road.arterial + 2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                {basemap.streets && <path d={basemap.streets} fill="none" stroke="var(--rm-road)" strokeWidth={road.street} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
                <path d={basemap.arterials} fill="none" stroke="var(--rm-road)" strokeWidth={road.arterial} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </g>
              {basemap.places?.map((p) => {
                const x = base.o[0] + p.x * base.k,
                  y = base.o[1] + p.y * base.k;
                if (x < 8 || x > w - 90 || y < 10 || y > h - 24) return null;
                placed.push([x + 30, y, 36, 7]);
                return (
                  <g key={p.text}>
                    {p.kind === "station" ? <rect x={x - 3.5} y={y - 3.5} width={7} height={7} rx={1.5} fill="var(--rm-place)" stroke="var(--rm-casing)" strokeWidth={1.5} /> : <circle cx={x} cy={y} r={3.5} fill="var(--rm-place)" stroke="var(--rm-casing)" strokeWidth={1.5} />}
                    <text x={x + 7} y={y} dominantBaseline="middle" fontSize={10} fill="var(--ns-ink-2)" stroke="var(--rm-halo)" strokeWidth={2.5} paintOrder="stroke">
                      {p.text}
                    </text>
                  </g>
                );
              })}
              {basemap.labels.map((l) => {
                const x = base.o[0] + l.x * base.k,
                  y = base.o[1] + l.y * base.k;
                /* a label shows only whole inside the box and clear of the ones before it */
                const half = l.text.length * 3.6;
                if (x < half + 8 || x > w - half - 8 || y < half * 0.55 + 12 || y > h - half * 0.55 - 12) return null;
                /* the label's upright box (what a reader's eye, and the overlap check, sees) */
                const a = (l.angle * Math.PI) / 180;
                const hx = half * Math.abs(Math.cos(a)) + 7 * Math.abs(Math.sin(a)),
                  hy = half * Math.abs(Math.sin(a)) + 7 * Math.abs(Math.cos(a));
                if (shown.has(l.text) || placed.some(([px, py, qx, qy]) => Math.abs(px - x) < hx + qx + 6 && Math.abs(py - y) < hy + qy + 6)) return null;
                placed.push([x, y, hx, hy]);
                shown.add(l.text);
                return (
                  <text key={`${l.text}-${l.x}`} x={x} y={y} transform={`rotate(${l.angle} ${x} ${y})`} textAnchor="middle" dominantBaseline="middle" fontSize={l.kind === "road" ? 10.5 : 12} letterSpacing={l.kind === "road" ? "0.02em" : undefined} fill={l.kind === "road" ? "var(--rm-label-road)" : l.kind === "water" ? "var(--rm-label-water)" : "var(--rm-label-park)"} stroke="var(--rm-halo)" strokeWidth={3} paintOrder="stroke" fontStyle={l.kind === "water" ? "italic" : undefined}>
                    {l.text}
                  </text>
                );
              })}
            </g>
          )}
          <path d={d} fill="none" stroke="var(--rm-casing)" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
          <path d={d} fill="none" stroke="var(--rm-line)" strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
          {record && <path d={recD} fill="none" stroke="var(--rm-line)" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />}
          {chevrons.map((c, i) => (
            <path key={i} d="M-2.5 -3 L1.5 0 L-2.5 3" transform={`translate(${c.at[0]} ${c.at[1]}) rotate(${c.deg})`} fill="none" stroke="var(--rm-casing)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {kms.map((m) => (
            <g key={m.km}>
              <circle cx={m.at[0]} cy={m.at[1]} r={8} fill="var(--rm-casing)" stroke="var(--rm-line)" strokeWidth={1.5} />
              <text x={m.at[0]} y={m.at[1] + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--ns-ink)" style={{ fontFamily: "var(--ns-font-mono)" }}>
                {m.km}
              </text>
            </g>
          ))}
          {!live && (
            <g transform={`translate(${end[0]} ${end[1]})`}>
              <line x1={0} y1={0} x2={0} y2={-20} stroke="var(--ns-ink)" strokeWidth={1.5} strokeLinecap="round" />
              <rect x={0} y={-20} width={13} height={9} fill="var(--rm-casing)" stroke="var(--ns-ink)" strokeWidth={1} />
              <path d="M0 -20h3.25v4.5H0zM6.5 -20h3.25v4.5H6.5zM3.25 -15.5h3.25v4.5H3.25zM9.75 -15.5H13v4.5H9.75z" fill="var(--ns-ink)" />
              <circle r={2.5} fill="var(--ns-ink)" />
            </g>
          )}
          <circle cx={start[0]} cy={start[1]} r={6.5} fill="var(--rm-line)" stroke="var(--rm-casing)" strokeWidth={2.5} />
          {live && (
            /* where you are: a soft halo, a cone the way you're heading, and the dot */
            <g data-slot="route-map-here" transform={`translate(${end[0]} ${end[1]})`}>
              {!beating && <circle r={16} fill="color-mix(in oklab, var(--rm-line) 16%, transparent)" />}
              {heading != null && <path d="M0 0 L-9 -22 A24 24 0 0 1 9 -22 Z" transform={`rotate(${heading})`} fill="color-mix(in oklab, var(--rm-line) 30%, transparent)" />}
              <circle r={7} fill="var(--rm-line)" stroke="var(--rm-casing)" strokeWidth={3} />
            </g>
          )}
        </svg>
        {beating && (
          /* the halo beats at the heart rate: an HTML layer over the map, so only the compositor moves it */
          <span ref={beatRef} aria-hidden data-slot="route-map-beat" className="pointer-events-none absolute size-8 -translate-x-1/2 -translate-y-1/2" style={{ left: end[0], top: end[1] }}>
            <span data-ns-still="" className={cn("absolute inset-0 rounded-full [background:radial-gradient(closest-side,transparent_52%,color-mix(in_oklab,var(--rm-line)_26%,transparent)_70%,color-mix(in_oklab,var(--rm-line)_8%,transparent))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--rm-line)_40%,transparent)]", BEAT_HALO)} style={beatStyle(beat)} />
          </span>
        )}
        {rec && record && (
          <span data-slot="route-map-record" className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-[calc(100%+12px)] items-center gap-1.5 rounded-full bg-[var(--rm-casing)] px-2.5 py-1 text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)] whitespace-nowrap text-[var(--ns-ink)] shadow-[var(--ns-shadow-float)]" style={{ left: Math.max(70, Math.min(w - 70, rec[0])), top: Math.max(40, rec[1]) }}>
            <svg aria-hidden viewBox="0 0 12 12" className="size-3 text-[var(--rm-line)]">
              <circle cx={6} cy={7} r={4} fill="currentColor" />
              <path d="M3.5 0.5h5l-1.2 3h-2.6z" fill="currentColor" opacity={0.6} />
            </svg>
            {record.label}
          </span>
        )}
        {attribution && <span className="absolute right-1.5 bottom-1 rounded-[4px] bg-[color-mix(in_oklab,var(--ns-canvas)_80%,transparent)] px-1.5 py-0.5 text-[10px] leading-none text-[var(--ns-ink-3)]">{attribution}</span>}
      </div>
    </figure>
  );
}

export { RouteMap, type RouteMapProps };
