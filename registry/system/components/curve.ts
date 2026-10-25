// Notchset sparkline 2.1.0 · https://notchset.dev/changelog
/*
 * The chart family's geometry (components/chart.tsx): a smooth path that never overshoots its points, a step path,
 * the area under a line and round grid values. Plain functions, shared by every chart and the sparkline.
 */
export type Pt = [number, number];

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

/** A smooth path through the points: monotone cubic, so it never overshoots a point (a total never seems to dip). */
export function smoothPath(pts: Pt[]): string {
  const n = pts.length;
  if (!n) return "";
  if (n === 1) return `M${f1(pts[0]![0])} ${f1(pts[0]![1])}`;
  if (n === 2) return `M${f1(pts[0]![0])} ${f1(pts[0]![1])}L${f1(pts[1]![0])} ${f1(pts[1]![1])}`;
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i]![0]);
  const s = pts.slice(1).map((p, i) => (dx[i] ? (p[1] - pts[i]![1]) / dx[i]! : 0));
  const m = pts.map((_, i) => (i === 0 ? s[0]! : i === n - 1 ? s[n - 2]! : s[i - 1]! * s[i]! <= 0 ? 0 : (s[i - 1]! + s[i]!) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (!s[i]) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i]! / s[i]!, b = m[i + 1]! / s[i]!, h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * s[i]!;
      m[i + 1] = t * b * s[i]!;
    }
  }
  let d = `M${f1(pts[0]![0])} ${f1(pts[0]![1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]!, [x1, y1] = pts[i + 1]!, h = (x1 - x0) / 3;
    d += `C${f1(x0 + h)} ${f1(y0 + m[i]! * h)} ${f1(x1 - h)} ${f1(y1 - m[i + 1]! * h)} ${f1(x1)} ${f1(y1)}`;
  }
  return d;
}

/** A step path (a count that jumps: scope added on a day), across then up. */
export function stepPath(pts: Pt[]): string {
  return pts.map(([x, y], i) => (i ? `H${f1(x)}V${f1(y)}` : `M${f1(x)} ${f1(y)}`)).join("");
}

/** The area under a path down to the baseline: the path, then down and back along the base. */
export function areaPath(line: string, pts: Pt[], baseY: number): string {
  if (pts.length < 2) return "";
  return `${line}L${f1(pts.at(-1)![0])} ${f1(baseY)}L${f1(pts[0]![0])} ${f1(baseY)}Z`;
}

/** Up to `count` round values between lo and hi for the grid (1, 2, 2.5 or 5 times a power of ten apart). */
export function niceTicks(lo: number, hi: number, count = 3): number[] {
  const span = hi - lo;
  if (!(span > 0)) return [];
  const raw = span / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((x) => x >= raw) ?? mag * 10;
  const out: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9 && out.length < count + 1; t += step) if (t > lo + 1e-9) out.push(Math.round(t * 1e6) / 1e6);
  return out;
}
