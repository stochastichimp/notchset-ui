// Notchset live-activity-bar 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/notchset/button";
import { Reveal } from "@/components/ui/notchset/reveal";

/*
 * Live activity bar: the next thing on your day, held at the bottom of the screen just above a tab bar. It rises
 * once when it arrives, counts down live ("in 8 min", then seconds in the last minute), and at the start turns
 * into "Now" with one calm pulse. Press it to open a small card (who, where, Join); dismiss it and it folds away.
 * Nothing laps at rest: the only motion is the arrival, the minute changing and the one pulse at the start.
 *
 *   <LiveActivityBar title="Discovery call" subtitle="Raycast" startsAt="2026-10-20T10:00:00" where="Google Meet"
 *     people="Priya, Sam Okafor" onJoin={join} onDismiss={hide} />
 *
 * `now` makes the clock controlled (a demo, a test): pass the current time in ms and the bar shows it; leave it
 * out and the bar keeps its own clock. Screen readers hear the time at sensible moments (10, 5 and 1 minute, and
 * the start), never every second.
 */
type LiveActivityBarProps = {
  title: string;
  subtitle?: string | undefined;
  startsAt: string | number | Date;
  /** the current time in ms, for a controlled clock; omit to let the bar tick by itself */
  now?: number | undefined;
  /** where it happens ("Google Meet", "Room 4") */
  where?: string | undefined;
  /** who is in it, in words */
  people?: React.ReactNode;
  joinLabel?: string | undefined;
  onJoin?: (() => void) | undefined;
  onDismiss?: (() => void) | undefined;
  className?: string | undefined;
};

/** How long a started event keeps saying "Now" before it reads as running. */
const NOW_FOR = 5 * 60e3;

function when(ms: number) {
  if (ms <= 0) return ms > -NOW_FOR ? "Now" : "Started";
  if (ms < 60e3) return `in ${Math.ceil(ms / 1000)}s`;
  const m = Math.ceil(ms / 60e3);
  return m < 60 ? `in ${m} min` : `in ${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}`.trim();
}
/** What a screen reader hears, only when it changes: a few moments, not a ticker. */
function spoken(ms: number) {
  if (ms <= 0) return "Starting now";
  const m = Math.ceil(ms / 60e3);
  return [10, 5, 1].includes(m) ? `${m} ${m === 1 ? "minute" : "minutes"} to go` : "";
}

const NEVER_CHANGES = () => () => {};
/**
 * False while the page is built, true once the browser has it. A page can be rendered an hour before it is
 * read, and in another zone, so nothing taken from this machine's clock or locale is written into the HTML:
 * the first render in the browser repeats what the server sent, and the real time arrives right after.
 */
function useMounted() {
  return React.useSyncExternalStore(NEVER_CHANGES, () => true, () => false);
}

/** The time now, or null until the browser has the page. A caller that passes `now` sets it for both. */
function useClock(controlled: number | undefined, target: number, mounted: boolean) {
  const [own, setOwn] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (controlled != null) return;
    /* one tick at a time: every second in the last minute and a half, otherwise every ten, so nothing renders
       more than it must */
    const id = setTimeout(() => setOwn(Date.now()), target - own < 90e3 ? 1000 : 10e3);
    return () => clearTimeout(id);
  }, [controlled, target, own]);
  if (controlled != null) return controlled;
  return mounted ? own : null;
}

function LiveActivityBar({ title, subtitle, startsAt, now, where, people, joinLabel = "Join", onJoin, onDismiss, className }: LiveActivityBarProps) {
  const target = new Date(startsAt).getTime();
  const mounted = useMounted();
  const t = useClock(now, target, mounted);
  const left = t === null ? null : target - t;
  const label = left === null ? "" : when(left);
  const live = left !== null && left <= 0 && left > -NOW_FOR;
  const [open, setOpen] = React.useState(false);
  const [gone, setGone] = React.useState(false);
  const cardId = React.useId();
  /* what a screen reader hears changes only at the moments worth saying */
  const say = left === null ? "" : spoken(left);
  const [heard, setHeard] = React.useState("");
  if (say && say !== heard) setHeard(say);
  const dismiss = () => {
    setGone(true);
    setOpen(false);
    onDismiss?.();
  };
  if (gone) return null;
  return (
    <div
      data-slot="live-activity-bar"
      data-live={live || undefined}
      data-ns-moves=""
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-[var(--ns-radius-lg)] bg-[var(--ns-ink)] text-[var(--ns-canvas)] shadow-[var(--ns-shadow-float)] [animation:ns-toast-in_var(--ns-time-toast)_var(--ns-ease)]",
        className,
      )}
    >
      <div className="flex min-h-11 items-center gap-1 pr-1.5 pl-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={cardId}
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-[calc(var(--ns-radius-lg)-4px)] py-2 pr-2 pl-2.5 text-left outline-hidden focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ns-canvas)]"
        >
          {/* the live mark: a quiet dot that takes the signal colour once, when the event starts */}
          <span
            aria-hidden
            data-ns-still=""
            className={cn(
              "size-2 shrink-0 rounded-full bg-[color-mix(in_oklab,var(--ns-canvas)_55%,transparent)] [transition:background-color_var(--ns-time-color)]",
              live && "bg-[var(--ns-ok)] [animation:ns-live-pulse_1.2s_var(--ns-ease)_1]",
            )}
          />
          <span className="flex min-w-0 flex-1 items-baseline gap-1.5 text-[length:var(--ns-text-small)]">
            <b className="truncate font-[number:var(--ns-weight-medium)]">{title}</b>
            {subtitle && <span className="truncate text-[color-mix(in_oklab,var(--ns-canvas)_68%,transparent)]">· {subtitle}</span>}
          </span>
          {/* The countdown is read from the clock, so a page built now and opened later renders two different
              words here, on purpose: React is told to keep the one the reader's own clock gives. */}
          <span className={cn("shrink-0 text-[length:var(--ns-text-small)] tabular-nums", live ? "font-[number:var(--ns-weight-medium)]" : "text-[color-mix(in_oklab,var(--ns-canvas)_78%,transparent)]")}>{label}</span>
          <ChevronUp aria-hidden className={cn("size-3.5 shrink-0 opacity-60 [transition:rotate_var(--ns-time-menu)_var(--ns-ease)]", !open && "rotate-180")} />
        </button>
        {onJoin && (
          <button
            type="button"
            onClick={onJoin}
            className="h-8 shrink-0 cursor-pointer rounded-[calc(var(--ns-radius-lg)-6px)] bg-[var(--ns-canvas)] px-3 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] outline-hidden [transition:filter_var(--ns-time-color)] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-canvas)]"
          >
            {joinLabel}
          </button>
        )}
      </div>
      <Reveal open={open}>
        <div id={cardId} className="flex items-end gap-3 border-t border-[color-mix(in_oklab,var(--ns-canvas)_14%,transparent)] px-3.5 pt-2.5 pb-3 text-[length:var(--ns-text-small)]">
          <dl className="m-0 grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
            {where && (
              <>
                <dt className="text-[color-mix(in_oklab,var(--ns-canvas)_60%,transparent)]">Where</dt>
                <dd className="m-0 truncate">{where}</dd>
              </>
            )}
            {people && (
              <>
                <dt className="text-[color-mix(in_oklab,var(--ns-canvas)_60%,transparent)]">Who</dt>
                <dd className="m-0 truncate">{people}</dd>
              </>
            )}
            <dt className="text-[color-mix(in_oklab,var(--ns-canvas)_60%,transparent)]">Starts</dt>
            {/* The zone and locale are the reader's, which the machine building the page cannot know, so the
                time waits for the browser even when the caller sets `now`. */}
            <dd className="m-0 tabular-nums">{mounted ? new Date(target).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}</dd>
          </dl>
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={dismiss} className="text-[color-mix(in_oklab,var(--ns-canvas)_72%,transparent)] hover:not-disabled:bg-[color-mix(in_oklab,var(--ns-canvas)_12%,transparent)] hover:not-disabled:text-[var(--ns-canvas)]">
              <X aria-hidden />
              Dismiss
            </Button>
          )}
        </div>
      </Reveal>
      <span role="status" aria-live="polite" className="sr-only">
        {heard ? `${title}: ${heard}` : ""}
      </span>
    </div>
  );
}

export { LiveActivityBar, type LiveActivityBarProps };
