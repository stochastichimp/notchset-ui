// Notchset line-figure 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useLessMotion } from "@/lib/notchset/physics";

/*
 * Line figure: a hairline drawing that means something, in ink at about 70% and 1px, with its construction lines dotted
 * at 0.5px. It draws itself in once when it comes into view (each stroke along its length, about 1.2 s), then holds
 * still: no loop. With less motion it is simply there. Three figures ship (a receipt, an approval, containment); a
 * host draws its own by passing shapes. `still` draws it as it is, with no draw-in, its strokes held at 1px at any
 * size: for a small figure beside a title, where a figure waiting to draw reads as an empty box.
 *
 *   <LineFigure figure="receipt" label="Sources narrowing to one answer" />
 *   <LineFigure figure="approval" still className="w-20" />
 *   <LineFigure shapes={[{ kind: "circle", cx: 100, cy: 80, r: 40 }, { kind: "line", x1: 40, y1: 80, x2: 160, y2: 80, dotted: true }]} />
 */

type Common = { dotted?: boolean | undefined };
export type LineShape =
  | (Common & { kind: "circle"; cx: number; cy: number; r: number })
  | (Common & { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number })
  | (Common & { kind: "line"; x1: number; y1: number; x2: number; y2: number })
  | (Common & { kind: "path"; d: string })
  | { kind: "dot"; cx: number; cy: number };

const dot = (cx: number, cy: number): LineShape => ({ kind: "dot", cx, cy });
const line = (x1: number, y1: number, x2: number, y2: number, dotted = false): LineShape => ({ kind: "line", x1, y1, x2, y2, dotted });

/** The figures that ship, each on a 200 by 160 grid. */
export const LINE_FIGURES = {
  /** nested circles converging on one point: sources narrowing to an answer */
  receipt: [
    line(100, 10, 100, 150, true),
    line(30, 140, 170, 140, true),
    ...[62, 48, 34, 20].map((r): LineShape => ({ kind: "circle", cx: 100, cy: 140 - r, r })),
    dot(100, 140),
  ],
  /** two cones meeting at a point on dotted axes: a request meets an approval */
  approval: [
    line(10, 80, 190, 80, true),
    line(100, 18, 100, 142, true),
    { kind: "ellipse", cx: 38, cy: 80, rx: 11, ry: 40 },
    line(38, 40, 100, 80),
    line(38, 120, 100, 80),
    { kind: "ellipse", cx: 162, cy: 80, rx: 11, ry: 40 },
    line(162, 40, 100, 80),
    line(162, 120, 100, 80),
    dot(100, 80),
  ],
  /** a wireframe cube with dotted diagonals: contained */
  contained: [
    { kind: "path", d: "M60 58 H128 V126 H60 Z" },
    { kind: "path", d: "M88 30 H156 V98 H88 Z" },
    line(60, 58, 88, 30),
    line(128, 58, 156, 30),
    line(128, 126, 156, 98),
    line(60, 126, 88, 98),
    line(60, 58, 156, 98, true),
    line(60, 126, 156, 30, true),
    line(128, 58, 88, 98, true),
    line(128, 126, 88, 30, true),
  ],
} satisfies Record<string, LineShape[]>;
export type LineFigureName = keyof typeof LINE_FIGURES;

type LineFigureProps = {
  /** one of the figures that ship */
  figure?: LineFigureName | undefined;
  /** your own figure, on a 200 by 160 grid, instead */
  shapes?: LineShape[] | undefined;
  /** what it shows, for a screen reader; without one it is decoration */
  label?: string | undefined;
  /** drawn as it is, no draw-in, strokes 1px at any size (a small figure beside a title) */
  still?: boolean | undefined;
  className?: string | undefined;
};

function LineFigure({ figure = "receipt", shapes, label, still = false, className }: LineFigureProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const less = useLessMotion() || still;
  /* drawn: "rest" until it is seen (the server and a first paint show it whole), then "ready" (hidden), then "drawn" */
  const [phase, setPhase] = React.useState<"rest" | "ready" | "drawn">("rest");
  /* once drawn, the dashes that drew it are taken off (a dashed circle keeps a hairline gap where it starts) */
  React.useEffect(() => {
    if (phase !== "drawn") return;
    const t = setTimeout(() => setPhase("rest"), 1800);
    return () => clearTimeout(t);
  }, [phase]);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || less || typeof IntersectionObserver === "undefined") return;
    const box = el.getBoundingClientRect();
    /* already on screen when it mounts: it stays as it is, nothing redraws in front of you */
    if (box.top < innerHeight && box.bottom > 0) return;
    setPhase("ready");
    let raf = 0;
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      raf = requestAnimationFrame(() => (raf = requestAnimationFrame(() => setPhase("drawn"))));
    }, { threshold: 0.4 });
    io.observe(el);
    return () => (io.disconnect(), cancelAnimationFrame(raf));
  }, [less]);
  const list = shapes ?? LINE_FIGURES[figure];
  /* less motion shows it whole at once, whatever it was waiting to draw */
  const view = less ? "rest" : phase;
  const hidden = view === "ready";
  let i = 0;
  return (
    <svg
      ref={ref}
      data-slot="line-figure"
      data-phase={view}
      viewBox="0 0 200 160"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("block h-auto w-full max-w-[240px] text-[color-mix(in_oklab,var(--ns-ink)_70%,transparent)]", className)}
      fill="none"
      stroke="currentColor"
    >
      {list.map((s, k) => {
        if (s.kind === "dot") return <circle key={k} cx={s.cx} cy={s.cy} r={still ? 4 : 2.2} fill="currentColor" stroke="none" style={{ opacity: hidden ? 0 : 1, transition: "opacity 400ms ease 1000ms" }} />;
        const dotted = !!s.dotted;
        const delay = dotted ? 0 : (i++ * 90);
        /* a solid stroke draws along its length; a construction line fades in under it */
        const style: React.CSSProperties = dotted
          ? { opacity: hidden ? 0 : 1, transition: "opacity 600ms ease" }
          : view === "rest"
            ? {}
            : { strokeDasharray: 1, strokeDashoffset: hidden ? 1 : 0, transition: `stroke-dashoffset 1200ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms` };
        const props = { strokeWidth: dotted ? (still ? 0.75 : 0.5) : 1, vectorEffect: still ? "non-scaling-stroke" : undefined, strokeDasharray: dotted ? "1 2.5" : undefined, pathLength: dotted || view === "rest" ? undefined : 1, style };
        if (s.kind === "circle") return <circle key={k} cx={s.cx} cy={s.cy} r={s.r} {...props} />;
        if (s.kind === "ellipse") return <ellipse key={k} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...props} />;
        if (s.kind === "line") return <line key={k} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} {...props} />;
        return <path key={k} d={s.d} {...props} />;
      })}
    </svg>
  );
}

export { LineFigure, type LineFigureProps };
