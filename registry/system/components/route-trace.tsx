// Notchset route-trace 2.0.0 · https://notchset.dev/changelog
"use client";
import { cn } from "@/lib/utils";

/*
 * Route trace: a walk or run drawn as a quiet line on the page's own paper, from the GPS points a wearable or phone
 * supplied. No map tiles and no provider key: the points are projected flat (fine at a park's scale), fitted to the
 * box and drawn in the series hue over a soft halo, with a hollow dot at the start, a filled one at the finish and a
 * small mark at each whole kilometre. A buyer who wants streets under it adds tiles behind this same drawing.
 *
 *   <RouteTrace label="Walk route, 3.1 km" points={[[51.526, -0.152], [51.527, -0.151], [51.526, -0.150]]} />
 */
type RouteTraceProps = {
  /** [lat, lng] in the order recorded */
  points: readonly (readonly [number, number])[];
  label: string;
  /** mark each whole kilometre */
  kmMarks?: boolean | undefined;
  height?: number | undefined;
  className?: string | undefined;
};

const R = 6371000;
const rad = Math.PI / 180;
const metres = (a: readonly [number, number], b: readonly [number, number]) => {
  const x = Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

function RouteTrace({ points, label, kmMarks = true, height = 320, className }: RouteTraceProps) {
  if (points.length < 2) return null;
  const lat0 = points.reduce((a, p) => a + p[0], 0) / points.length;
  const k = Math.cos(lat0 * rad);
  /* flat metres east (x) and north (y), y flipped for the screen */
  const xy = points.map((p) => [p[1] * k * 111320, -p[0] * 111320] as const);
  const xs = xy.map((p) => p[0]);
  const ys = xy.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const span = Math.max(x1 - x0, y1 - y0, 1);
  const pad = span * 0.08;
  const vb = `${x0 - pad} ${y0 - pad} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad}`;
  const d = xy.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  const marks: { at: readonly [number, number]; km: number }[] = [];
  if (kmMarks) {
    let run = 0;
    for (let i = 1; i < points.length; i++) {
      const before = run;
      run += metres(points[i - 1]!, points[i]!);
      const whole = Math.floor(run / 1000);
      if (whole > Math.floor(before / 1000)) marks.push({ at: xy[i]!, km: whole });
    }
  }
  const dot = span / 90;
  return (
    <figure data-slot="route-trace" className={cn("m-0 flex min-w-0 flex-col", className)}>
      <svg role="img" aria-label={label} viewBox={vb} preserveAspectRatio="xMidYMid meet" className="block w-full" style={{ height }}>
        <path d={d} fill="none" stroke="color-mix(in oklab, var(--ns-series) 16%, transparent)" strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d={d} fill="none" stroke="var(--ns-series)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {marks.map((m) => (
            <g key={m.km}>
              <circle cx={m.at[0]} cy={m.at[1]} r={dot * 0.9} fill="var(--ns-canvas)" stroke="var(--ns-series)" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
              <text x={m.at[0] + dot * 2.2} y={m.at[1] + dot * 1.1} fontSize={dot * 3.6} fill="var(--ns-ink-2)" stroke="var(--ns-canvas)" strokeWidth={dot * 0.9} paintOrder="stroke" style={{ fontFamily: "var(--ns-font-mono)" }}>
                {`${m.km} km`}
              </text>
            </g>
          ))}
        <circle cx={xy[0]![0]} cy={xy[0]![1]} r={dot * 1.6} fill="var(--ns-canvas)" stroke="var(--ns-ink)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        <circle cx={xy.at(-1)![0]} cy={xy.at(-1)![1]} r={dot * 1.1} fill="var(--ns-ink)" />
      </svg>
    </figure>
  );
}

export { RouteTrace, type RouteTraceProps };
