// Notchset week-bars 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChartGuide, ChartPill, ChartSurface, ChartTable, ChartTableToggle, barPath, useChartWidth } from "@/components/ui/notchset/chart";

/*
 * Week bars: a value by day as rounded bars in the series' soft tint, the value written inside each bar's top, today
 * lit in the lilac focus and the period's average as a dashed ink line. Still on arrival; scrub or use the arrow keys
 * to read a day, and the table carries every day. A day with nothing recorded is a dashed stub, never a zero.
 *
 *   <WeekBars label="Sleep this week" bars={[{ label: "Mon", value: 7.07, text: "7:04" }, …]} avg={6.85} avgText="6 h 51" />
 */
type WeekBar = { label: string; value: number | null; text?: string | undefined };
type WeekBarsProps = {
  bars: WeekBar[];
  /** what and when, for the chart's name */
  label: string;
  /** the period's average, drawn dashed */
  avg?: number | null | undefined;
  avgText?: string | undefined;
  /** the bar that's today (default: the last) */
  today?: number | undefined;
  height?: number | undefined;
  /** the floor the bars stand on (sleep reads from 4 h, not 0) */
  floor?: number | undefined;
  /** a goal to clear, drawn as a quiet solid line with its words in a gutter at its right end ("70% goal") */
  goal?: number | undefined;
  goalText?: string | undefined;
  /** the ceiling of the scale (time in range reads to 100%); left out, the tallest bar */
  ceiling?: number | undefined;
  /** write every nth day's label under the bars (a month or a year of bars); the table keeps them all */
  labelEvery?: number | undefined;
  className?: string | undefined;
};

function WeekBars({ bars, label, avg, avgText, goal, goalText, ceiling, today = bars.length - 1, height = 168, floor = 0, labelEvery = 1, className }: WeekBarsProps) {
  const [box, W] = useChartWidth<HTMLDivElement>(420);
  const [active, setActive] = React.useState<number | null>(null);
  /* each chart its own gradient, so two on a page don't share one */
  const gid = `wb-today-${React.useId().replace(/:/g, "")}`;
  const [table, setTable] = React.useState(false);
  const n = Math.max(1, bars.length);
  /* the goal and average words sit in a gutter at the right end of their lines, never over a bar */
  const words = [goal != null ? goalText : undefined, avg != null && avgText ? `avg ${avgText}` : undefined].filter((t): t is string => !!t);
  const G = words.length ? Math.min(150, Math.max(...words.map((t) => t.length)) * 6.6 + 16) : 0;
  const P = Math.max(120, W - G);
  /* a week keeps wide gaps; a month or a year of bars shares the width, a third of each step for the gap */
  const gap = n > 14 ? Math.max(1, (P / n) * 0.3) : Math.max(6, Math.min(14, P / n / 6));
  const bw = (P - gap * (n - 1)) / n;
  /* a sparse axis keeps its labels at least 64px apart, whatever the width */
  const every = labelEvery > 1 ? Math.max(labelEvery, Math.ceil(64 / (bw + gap))) : 1;
  const vals = bars.map((b) => b.value).filter((v): v is number => v != null);
  const top = ceiling ?? Math.max(floor + 1, ...vals, avg ?? 0) * 1.04;
  const y = (v: number) => height - ((v - floor) / (top - floor)) * height;
  const x = (i: number) => i * (bw + gap);
  const text = (b: WeekBar) => (b.value == null ? "nothing recorded" : (b.text ?? String(b.value)));
  const at = active == null ? null : bars[active];
  return (
    <div data-slot="week-bars" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div ref={box} className="relative min-w-0">
        <ChartSurface
          label={label}
          valueText={at ? `${at.label}: ${text(at)}` : `${bars[today]?.label ?? ""}: ${bars[today] ? text(bars[today]) : ""}`}
          count={n}
          active={active}
          rest={today}
          onActive={setActive}
          height={height}
          padX={[bw / 2, W - P + bw / 2]}
          step={1}
          hint="Arrow keys move a day; Enter pins; Esc lets go."
        >
          <svg aria-hidden width={W} height={height} className="absolute inset-0 block overflow-visible">
            <defs>
              <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--ns-series-lilac)" />
                <stop offset="1" stopColor="var(--ns-series)" />
              </linearGradient>
            </defs>
            {bars.map((b, i) => {
              if (b.value == null) return <rect key={i} x={x(i) + 0.5} y={height - 6} width={bw - 1} height={5} rx={2.5} fill="none" stroke="var(--ns-ink-3)" strokeDasharray="2 3" />;
              const h = Math.max(4, height - y(b.value));
              const lit = i === today;
              return <path key={i} d={barPath(x(i), height - h, bw, h, 7)} fill={lit ? `url(#${gid})` : "var(--ns-series)"} fillOpacity={lit ? 1 : active === i ? 0.42 : 0.26} style={{ transition: "fill-opacity var(--ns-time-color)" }} />;
            })}
            {goal != null && <line x1={0} x2={W} y1={Math.round(y(goal)) + 0.5} y2={Math.round(y(goal)) + 0.5} stroke="var(--ns-ink-3)" strokeWidth={1} />}
            {avg != null && <line x1={0} x2={W} y1={Math.round(y(avg)) + 0.5} y2={Math.round(y(avg)) + 0.5} stroke="var(--ns-ink-2)" strokeWidth={1} strokeDasharray="3 4" />}
          </svg>
          {bars.map((b, i) =>
            b.value == null || height - y(b.value) < 26 || bw < 30 ? null : (
              <span key={i} aria-hidden className={cn("absolute font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none tabular-nums", i === today ? "text-[var(--ns-panel)]" : "text-[var(--ns-ink)]")} style={{ left: x(i), width: bw, top: y(b.value) + 8, textAlign: "center" }}>
                {b.text ?? b.value}
              </span>
            ),
          )}
          {goal != null && goalText && (
            <span aria-hidden data-slot="week-bars-goal" className="absolute right-0 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-ink-2)]" style={{ top: avg != null && avgText && y(goal) > y(avg) && y(goal) - y(avg) < 16 ? y(goal) + 4 : y(goal) - 14 }}>
              {goalText}
            </span>
          )}
          {avg != null && avgText && (
            <span aria-hidden data-slot="week-bars-avg" className="absolute right-0 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-ink-2)]" style={{ top: goal != null && goalText && y(avg) > y(goal) && y(avg) - y(goal) < 16 ? y(avg) + 4 : y(avg) - 14 }}>
              avg {avgText}
            </span>
          )}
          <ChartGuide x={active == null ? 0 : x(active) + bw / 2} on={false} />
          <ChartPill x={active == null ? 0 : x(active) + bw / 2} y={at?.value != null ? y(at.value) : height - 8} width={W} on={at != null} value={at ? text(at) : ""} detail={at?.label} />
        </ChartSurface>
        <div aria-hidden className="mt-2 grid text-center text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, columnGap: gap, paddingRight: W - P }}>
          {bars.map((b, i) => (
            <span key={i} className={cn(labelEvery > 1 ? cn("flex overflow-visible whitespace-nowrap", i === n - 1 ? "justify-end" : "justify-center") : "truncate", i === today && "font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]")}>
              {/* a sparse axis: every nth label back from the last, none so near the start that it would spill off */}
              {every === 1 || ((n - 1 - i) % every === 0 && (i === n - 1 || i >= 3)) ? b.label : ""}
            </span>
          ))}
        </div>
      </div>
      <ChartTableToggle open={table} onToggle={() => setTable(!table)} />
      <ChartTable caption={label} head={["Day", "Value"]} rows={bars.map((b) => [b.label, text(b)])} open={table} active={active} onPick={setActive} />
    </div>
  );
}

export { WeekBars, type WeekBar, type WeekBarsProps };
