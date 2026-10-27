// Notchset route-map 2.0.0 · https://notchset.dev/changelog
"use client";
/*
 * Living light: the few things in an app that move at rest, and the rules they share (LANGUAGE.md, "Motion that
 * lives"). Motion that lives is earned by data (a heartbeat at the live heart rate) or by the page's one light (the
 * flood tile's drift, the light field), never more than one per page, and a moment that lands (new results) plays
 * once. Plain hooks and functions, no markup; the keyframes live in foundation.css and move transform and opacity
 * only, so the compositor runs them without layout or paint.
 *
 * - Asleep when no one can see it: `useAwake` marks the element `data-ns-asleep` while the tab is hidden or the
 *   element is off screen, and foundation.css pauses every animation under that mark.
 * - Still under less motion: the moving parts carry `data-ns-still`, so the app's switch and the device's both
 *   hold them (foundation.css).
 */
import * as React from "react";

/** The slowest and fastest heart rates a pulse follows: a beat outside them is drawn at the edge. */
export const BEAT_BPM = [40, 190] as const;

/**
 * One heartbeat in seconds at a heart rate (60 / bpm), clamped to 40–190 bpm and rounded to 2 bpm so a reading
 * that wobbles by one doesn't restart the beat. No heart rate, no beat (null).
 */
export function beatPeriod(bpm: number | null | undefined): number | null {
  if (bpm == null || !Number.isFinite(bpm) || bpm <= 0) return null;
  const b = Math.max(BEAT_BPM[0], Math.min(BEAT_BPM[1], Math.round(bpm / 2) * 2));
  return Math.round((60 / b) * 1000) / 1000;
}

/* the heartbeat's classes, written whole so Tailwind keeps their keyframes; the period comes from beatStyle */
/** a halo that swells and fades once a beat (the live position) */
export const BEAT_HALO = "animate-[ns-beat_var(--ns-beat)_cubic-bezier(0.2,0.7,0.3,1)_infinite] [transform-origin:center]";
/** a mark that brightens once a beat (the current zone in a heart-rate band) */
export const BEAT_SOFT = "animate-[ns-beat-soft_var(--ns-beat)_cubic-bezier(0.2,0.7,0.3,1)_infinite] [transform-origin:center]";

/** The heartbeat's period for BEAT_HALO or BEAT_SOFT (`--ns-beat`), or none when there's no beat. */
export function beatStyle(bpm: number | null | undefined): React.CSSProperties | undefined {
  const s = beatPeriod(bpm);
  return s == null ? undefined : ({ "--ns-beat": `${s}s` } as React.CSSProperties);
}

/**
 * Marks the element `data-ns-asleep` while the tab is hidden or the element is off screen, so its animations pause
 * (foundation.css). `seenAt` is how much of it must show to count as seen (0, any of it; the prismatic sweep waits
 * for most of its card). Without an IntersectionObserver (a test) it counts as on screen. It changes the attribute
 * only, so scrolling never re-renders the part.
 */
export function useAwake(el: React.RefObject<Element | null>, on = true, seenAt = 0): void {
  React.useEffect(() => {
    const node = el.current;
    if (!node || !on) return;
    let seen = true;
    const apply = () => {
      const a = seen && !document.hidden;
      node.toggleAttribute("data-ns-asleep", !a);
    };
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (es) => {
              seen = es.some((e) => e.isIntersecting && (!seenAt || e.intersectionRatio >= seenAt));
              apply();
            },
            { threshold: seenAt ? [0, seenAt] : 0 },
          );
    io?.observe(node);
    document.addEventListener("visibilitychange", apply);
    apply();
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", apply);
      node.removeAttribute("data-ns-asleep");
    };
  }, [el, on, seenAt]);
}

/** How long a moment that lands plays (the prismatic edge's one sweep), in ms. */
export const ARRIVAL_MS = 1200;

const readSeen = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const writeSeen = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};

/**
 * A moment that lands once: `[playing, done]`. Playing turns on when `key` (what arrived, a result set's id) is new,
 * and off when the part calls `done` (its animation ended, or there was none to play). New means it changed while
 * the part is mounted, or it differs from the one this device last saw (kept under `remember`, when given). A first
 * sight with nothing remembered, a re-render and a remount of the same key never play it.
 */
export function useArrival(key: string | null | undefined, remember?: string | undefined): readonly [boolean, () => void] {
  const [playing, setPlaying] = React.useState(false);
  const last = React.useRef<string | null | undefined>(undefined);
  React.useEffect(() => {
    if (key == null) return;
    const before = last.current === undefined ? (remember ? readSeen(remember) : null) : last.current;
    last.current = key;
    if (remember) writeSeen(remember, key);
    if (before != null && before !== key) setPlaying(true);
  }, [key, remember]);
  const done = React.useCallback(() => setPlaying(false), []);
  return [playing, done] as const;
}
