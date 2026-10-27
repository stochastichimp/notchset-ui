// Notchset results-strip 2.0.0 · https://notchset.dev/changelog
"use client";
/*
 * Physics: what every showcase piece moves by (SHOWCASE-RULES.md, "Real physics"), so a spring settles the same at 60
 * and at 120 Hz and only one piece on a screen is ever running. Plain hooks and functions, no markup.
 *
 * - Time-based: a frame gets the seconds since the last one (capped, so a hidden tab never lands as one huge step),
 *   and simulations that collide take fixed steps of 1/120 s from an accumulator.
 * - One running loop per viewport: the latest piece that asked and is on screen moves; every other one shows its
 *   still until it is the latest again.
 * - Less motion, from the app (data-motion="reduced") or the device, which always wins: a piece shows its still.
 * - Self-play hands over for good at the first pointer press, key or wheel inside the piece.
 */
import * as React from "react";

/** Less motion, asked by the device or by the app on the root. */
export function lessMotion(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.dataset.motion === "reduced" || (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/** Less motion, kept current as the device's setting or the root's data-motion changes. */
export function useLessMotion(): boolean {
  /* read at once in the browser, so a piece never starts in its still and then jumps; true on a server */
  const [less, setLess] = React.useState(() => lessMotion());
  React.useEffect(() => {
    const read = () => setLess(lessMotion());
    read();
    const q = typeof matchMedia !== "undefined" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
    q?.addEventListener("change", read);
    const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(read) : null;
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => {
      q?.removeEventListener("change", read);
      mo?.disconnect();
    };
  }, []);
  return less;
}

/** Whether the element is on screen (without an IntersectionObserver, as in a test, it counts as seen). */
export function useSeen(el: React.RefObject<Element | null>): boolean {
  const [seen, setSeen] = React.useState(typeof IntersectionObserver === "undefined");
  React.useEffect(() => {
    const node = el.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => setSeen(es.some((e) => e.isIntersecting)), { threshold: 0.15 });
    io.observe(node);
    const vis = () => document.hidden && setSeen(false);
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [el]);
  return seen;
}

/* ---------- one running loop per viewport ---------- */
const askers: string[] = [];
const listeners = new Set<() => void>();
let ownerNow: string | null = null;
function publish() {
  ownerNow = askers[askers.length - 1] ?? null;
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * Whether this piece may run its loop now: it asks while `wants` (on screen, motion allowed, something to play), and
 * the latest that asked runs; when it stops asking, the one before it takes over.
 */
export function useLoopTurn(wants: boolean): boolean {
  const id = React.useId();
  React.useEffect(() => {
    if (!wants) return;
    askers.push(id);
    publish();
    return () => {
      const i = askers.lastIndexOf(id);
      if (i >= 0) askers.splice(i, 1);
      publish();
    };
  }, [id, wants]);
  const owner = React.useSyncExternalStore(subscribe, () => ownerNow, () => null);
  return wants && owner === id;
}

/** Calls `frame(dt, now)` every animation frame while `on`, with dt in seconds (at most 1/20 s); paused in a hidden tab. */
export function useFrame(frame: (dt: number, now: number) => void, on: boolean): void {
  const cb = React.useRef(frame);
  React.useEffect(() => {
    cb.current = frame;
  });
  React.useEffect(() => {
    if (!on) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (!document.hidden) cb.current(dt, now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);
}

/** A damped spring's state: where it is and how fast it is going. */
export type SpringState = { x: number; v: number };

/**
 * One step of a damped spring toward `target` (semi-implicit Euler, stable at a frame's dt): `stiffness` pulls, and
 * `damping` is the share of critical damping (1 settles without overshoot, under 1 overshoots and rings).
 */
export function springStep(s: SpringState, target: number, stiffness: number, damping: number, dt: number): SpringState {
  const c = 2 * Math.sqrt(stiffness) * damping;
  const v = s.v + (stiffness * (target - s.x) - c * s.v) * dt;
  return { x: s.x + v * dt, v };
}

/** Whether a spring has come to rest at its target. */
export function springAtRest(s: SpringState, target: number, eps = 0.0005): boolean {
  return Math.abs(s.x - target) < eps && Math.abs(s.v) < eps * 10;
}

/** Runs `step(h)` in fixed steps of `h` seconds for the time that passed; returns the time left over for next frame. */
export function fixedSteps(carry: number, dt: number, step: (h: number) => void, h = 1 / 120, max = 12): number {
  let acc = carry + dt, n = 0;
  while (acc >= h && n < max) {
    step(h);
    acc -= h;
    n++;
  }
  return n >= max ? 0 : acc;
}

/**
 * Self-play until the first touch: `mine` turns true for good at the first pointer press, key or wheel inside the
 * root, so every queued step can be dropped and the visitor holds it from there. Bind `handOver` to the root's events.
 */
export function useHandover(start = false): [boolean, () => void] {
  const [mine, setMine] = React.useState(start);
  const handOver = React.useCallback(() => setMine(true), []);
  return [mine, handOver];
}

/** A ghost cursor's script: where it is (0–1 of the stage) at each moment (ms), and whether it presses. */
export type GhostKey = { t: number; x: number; y: number; down?: boolean | undefined };

/** Where the ghost is at `t` ms: eased between its keys (a hand's narration, not physics), pressing as its key says. */
export function ghostAt(script: GhostKey[], t: number): { x: number; y: number; down: boolean; done: boolean } {
  const last = script[script.length - 1]!;
  if (t >= last.t) return { x: last.x, y: last.y, down: !!last.down, done: true };
  let i = 0;
  while (i < script.length - 1 && script[i + 1]!.t <= t) i++;
  const a = script[i]!, b = script[i + 1] ?? a;
  const u = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
  const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, down: !!a.down, done: false };
}

/** A colour role read from the page (for a canvas, which can't read a CSS variable), as an [r, g, b, a] in 0–255. */
export function readColor(el: Element, role: string): [number, number, number, number] {
  const probe = document.createElement("i");
  probe.style.cssText = `position:absolute;visibility:hidden;color:var(${role})`;
  el.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  /* whatever space the browser serialises it in (rgb, color(srgb …), oklab …), a pixel says it in sRGB */
  try {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const g = cv.getContext("2d", { willReadFrequently: true });
    if (g) {
      g.clearRect(0, 0, 1, 1);
      g.fillStyle = c;
      g.fillRect(0, 0, 1, 1);
      const d = g.getImageData(0, 0, 1, 1).data;
      return [d[0]!, d[1]!, d[2]!, d[3]!];
    }
  } catch {}
  const m = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
  return [m[0] ?? 0, m[1] ?? 0, m[2] ?? 0, (m[3] ?? 1) * 255];
}

/** Mixes two [r, g, b, a] colours by t (0–1). */
export function mixColor(a: readonly number[], b: readonly number[], t: number): string {
  const k = Math.max(0, Math.min(1, t));
  const ch = (i: number) => a[i]! + (b[i]! - a[i]!) * k;
  return `rgba(${Math.round(ch(0))},${Math.round(ch(1))},${Math.round(ch(2))},${(ch(3) / 255).toFixed(3)})`;
}

/** The width an element is given, kept current (a callback ref, so a replaced element is followed). */
export function useWidth<T extends HTMLElement>(fallback = 520): [React.RefCallback<T>, number] {
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
  return [setEl, w];
}

/**
 * A copy of a simulation's state for drawing: the frame loop changes the live state (a ref) in place, and the piece
 * draws from the copy it last painted, so rendering never reads a ref. Plain objects, arrays and typed arrays.
 */
export function snapshot<T>(x: T): T {
  if (Array.isArray(x)) return x.map(snapshot) as T;
  if (ArrayBuffer.isView(x)) return (x as unknown as Float32Array).slice() as unknown as T;
  if (x && typeof x === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x)) out[k] = snapshot(v);
    return out as T;
  }
  return x;
}
