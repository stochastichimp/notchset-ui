// Notchset stress-strip 2.0.0 · https://notchset.dev/changelog
"use client";
import { cn } from "@/lib/utils";

/*
 * Stress strip: a waking day on one row, every 5 minutes as one of four states. Load rises above a hairline (stressed
 * tall in the full series hue, engaged short and lighter), restoring dips below it in grey, and calm is the hairline
 * itself, so the shape reads before the colours do. A gap where nothing was read stays empty. Under it, the minutes
 * in each state, label left and value right. The states come from the caller (heart rate and HRV, or a wearable's
 * own stress samples); the strip only draws them.
 *
 *   <StressStrip label="Through the day, yesterday" start={84} slots={["calm", "calm", "engaged", "stressed", null]} />
 */
type StressState = "calm" | "engaged" | "stressed" | "restoring";
type StressStripProps = {
  /** one state per step from `start`, null where nothing was read */
  slots: (StressState | null)[];
  /** the first slot's index in the day (5-minute slots from midnight: 84 is 07:00) */
  start: number;
  /** minutes per slot */
  step?: number | undefined;
  label: string;
  /** the strip stops at now (today), said at its right end */
  live?: boolean | undefined;
  className?: string | undefined;
};

const STATES: { key: StressState; label: string }[] = [
  { key: "stressed", label: "Stressed" },
  { key: "engaged", label: "Engaged" },
  { key: "calm", label: "Calm" },
  { key: "restoring", label: "Restoring" },
];
const FILL: Record<StressState, string> = {
  stressed: "var(--ns-series)",
  engaged: "color-mix(in oklab, var(--ns-series) 42%, var(--ns-canvas))",
  calm: "transparent",
  restoring: "color-mix(in oklab, var(--ns-ink) 26%, var(--ns-canvas))",
};
/* height above (+) or below (−) the hairline, in px */
const RISE: Record<StressState, number> = { stressed: 18, engaged: 8, calm: 0, restoring: -10 };

const clock = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const dur = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}`);

function StressStrip({ slots, start, step = 5, label, live, className }: StressStripProps) {
  const n = Math.max(1, slots.length);
  /* contiguous runs, so each stretch is one shape with soft ends */
  const runs: { state: StressState; from: number; to: number }[] = [];
  slots.forEach((s, i) => {
    if (!s) return;
    const last = runs.at(-1);
    if (last && last.state === s && last.to === i) last.to = i + 1;
    else runs.push({ state: s, from: i, to: i + 1 });
  });
  const minutes = Object.fromEntries(STATES.map((s) => [s.key, slots.filter((x) => x === s.key).length * step])) as Record<StressState, number>;
  const t0 = start * step;
  const t1 = (start + n) * step;
  /* hour ticks every 3 hours inside the strip, kept clear of its ends */
  const ticks: number[] = [];
  for (let h = Math.ceil(t0 / 180) * 180; h < t1; h += 180) if (h - t0 > 50 && t1 - h > 50) ticks.push(h);
  const at = (m: number) => `${((m - t0) / (t1 - t0)) * 100}%`;
  const said = STATES.filter((s) => minutes[s.key] > 0).map((s) => `${s.label.toLowerCase()} ${dur(minutes[s.key])}`).join(", ");
  return (
    <div data-slot="stress-strip" className={cn("flex min-w-0 flex-col gap-4", className)}>
      <div role="img" aria-label={`${label}, ${clock(t0)} to ${clock(t1)}: ${said || "nothing read"}.`} className="relative h-[44px]">
        <i aria-hidden className="absolute inset-x-0 top-[26px] block h-px bg-[var(--ns-line)]" />
        {runs
          .filter((r) => r.state !== "calm")
          .map((r) => {
            const h = RISE[r.state];
            return (
              <i
                key={`${r.from}-${r.state}`}
                aria-hidden
                className="absolute block rounded-[2px]"
                style={{ left: `${(r.from / n) * 100}%`, width: `max(2px, calc(${((r.to - r.from) / n) * 100}% - 1px))`, top: h > 0 ? 26 - h : 27, height: Math.abs(h), background: FILL[r.state] }}
              />
            );
          })}
      </div>
      <div aria-hidden className="relative -mt-2 h-4 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">
        <span className="absolute left-0">{clock(t0)}</span>
        {ticks.map((m) => (
          <span key={m} className="absolute -translate-x-1/2 max-[480px]:hidden" style={{ left: at(m) }}>
            {clock(m)}
          </span>
        ))}
        <span className="absolute right-0">{live ? `now ${clock(t1)}` : clock(t1)}</span>
      </div>
      <dl className="m-0 grid grid-cols-4 gap-x-6 max-[600px]:grid-cols-2 max-[600px]:gap-y-1">
        {STATES.map((s) => (
          <div key={s.key} className="flex items-baseline justify-between gap-3 border-t-[0.5px] border-[var(--ns-line)] py-2">
            <dt className="flex items-center gap-2 text-[var(--ns-ink-2)]">
              <i aria-hidden className={cn("block h-2.5 w-2.5 rounded-[2px]", s.key === "calm" && "h-px shadow-[inset_0_0_0_1px_var(--ns-ink-3)]")} style={{ background: s.key === "calm" ? "var(--ns-ink-3)" : FILL[s.key] }} />
              {s.label}
            </dt>
            <dd className="m-0 tabular-nums">{minutes[s.key] ? dur(minutes[s.key]) : "—"}</dd>
          </div>
        ))}
      </dl>
      <ol className="sr-only">
        {runs.map((r) => (
          <li key={`${r.from}-l`}>{`${clock(t0 + r.from * step)} to ${clock(t0 + r.to * step)}: ${r.state}`}</li>
        ))}
      </ol>
    </div>
  );
}

export { StressStrip, type StressStripProps, type StressState };
