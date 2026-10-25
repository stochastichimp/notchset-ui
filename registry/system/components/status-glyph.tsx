// Notchset status-glyph 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Status glyph: where a task is, by shape, so colour stays free for exceptions. A ring for to do, half filled for in
 * progress, three quarters for in review, a dashed ring for backlog (not yet planned), a slash for cancelled, all in ink; done fills the ring with the ok colour
 * and a tick, the one coloured state. Given onComplete it is the button that finishes the task: hovering shows the
 * tick it would draw, and the fill pops once when it lands with one soft glow pulse in the done colour (about half
 * a second, once; with less motion neither runs and the filled state simply shows). Its label says what it is and
 * does.
 *
 *   <StatusGlyph status="doing" label="Snap stops to the road network" onComplete={() => complete(id)} />
 */
type TaskStatus = "backlog" | "todo" | "doing" | "review" | "done" | "cancelled";
type StatusGlyphProps = {
  status: TaskStatus;
  /** the task's title (or what the glyph stands for), read with the state */
  label: string;
  /** makes it the button that marks the task done */
  onComplete?: (() => void) | undefined;
  /** the words for each state; defaults to Backlog, To do, In progress, In review, Done, Cancelled */
  words?: Partial<Record<TaskStatus, string>> | undefined;
  size?: number | undefined;
  className?: string | undefined;
};

/* less motion, from the page's own setting (data-motion) or the device's */
const lessMotion = () => typeof document === "undefined" || document.documentElement.dataset.motion === "reduced" || (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);

const WORDS: Record<TaskStatus, string> = { backlog: "Backlog", todo: "To do", doing: "In progress", review: "In review", done: "Done", cancelled: "Cancelled" };

function Glyph({ status, size }: { status: TaskStatus; size: number }) {
  const done = status === "done";
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} aria-hidden className="block overflow-visible">
      <circle cx="7" cy="7" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray={status === "backlog" ? "2.1 2.4" : undefined} className={cn("[transition:opacity_var(--ns-time-color)]", done && "opacity-0")} />
      {status === "doing" && <path d="M7 3.25A3.75 3.75 0 0 1 7 10.75Z" fill="currentColor" />}
      {status === "review" && <path d="M7 7V3.25A3.75 3.75 0 1 1 3.25 7Z" fill="currentColor" />}
      {status === "cancelled" && <path d="M4.6 9.4 9.4 4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
      <circle cx="7" cy="7" r="6.5" fill="var(--ns-ok)" className={cn("origin-center [transition:opacity_var(--ns-time-color),scale_var(--ns-time-color)_var(--ns-ease)]", done ? "opacity-100" : "scale-75 opacity-0")} />
      <path
        d="M4.4 7.2 6.2 8.9 9.6 5.4"
        fill="none"
        stroke={done ? "var(--ns-panel)" : "currentColor"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("[transition:opacity_var(--ns-time-color)]", done ? "opacity-100" : "opacity-0 group-hover/glyph:opacity-45 group-focus-visible/glyph:opacity-45")}
      />
    </svg>
  );
}

function StatusGlyph({ status, label, onComplete, words, size = 14, className }: StatusGlyphProps) {
  const w = { ...WORDS, ...words }[status];
  /* the fill pops once, when it becomes done while on screen */
  const was = React.useRef(status);
  const [pop, setPop] = React.useState(0);
  React.useEffect(() => {
    if (status === "done" && was.current !== "done" && !lessMotion()) setPop((n) => n + 1);
    was.current = status;
  }, [status]);
  const tone = status === "cancelled" || status === "backlog" ? "text-[var(--ns-ink-3)]" : "text-[var(--ns-ink-2)]";
  const body = (
    <span key={pop} data-ns-still="" data-pulse={pop > 0 ? "" : undefined} className={cn("grid place-items-center rounded-full", pop > 0 && "[--ns-pulse:var(--ns-ok)] [animation:ns-pop_320ms_var(--ns-ease-pop),ns-glow-pulse_520ms_var(--ns-ease)]")}>
      <Glyph status={status} size={size} />
    </span>
  );
  if (onComplete && status !== "done" && status !== "cancelled")
    return (
      <button
        type="button"
        data-slot="status-glyph"
        data-status={status}
        aria-label={`Mark done: ${label}`}
        title={`${w} · mark done`}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className={cn("group/glyph -m-1.5 grid shrink-0 cursor-pointer place-items-center rounded-full p-1.5 outline-hidden hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] pointer-coarse:-m-3 pointer-coarse:p-3", tone, className)}
      >
        {body}
      </button>
    );
  return (
    <span data-slot="status-glyph" data-status={status} role="img" aria-label={`${w}: ${label}`} className={cn("grid shrink-0 place-items-center", tone, className)}>
      {body}
    </span>
  );
}

export { StatusGlyph, type StatusGlyphProps, type TaskStatus };
