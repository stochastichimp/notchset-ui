// Notchset goal-cumulative 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChartHalo, ChartTable, ChartTableToggle, InkLine, useChartWidth } from "@/components/ui/notchset/chart";

/*
 * Goal cumulative: a running total through a period against its goal line. This period climbs as the luminous line
 * with a soft fill under it and a dot per step; the period before is a dashed ghost; the goal is one dashed ink line
 * named at its end. The latest point is haloed and says its total, and "goal met" once it is.
 *
 *   <GoalCumulative label="Intensity minutes, this week" goal={150} labels={["Mon", …, "Sun"]}
 *     values={[22, 48, 48, 85, 110, 141, 152]} ghost={[15, 30, …, 128]} unit="min" />
 */
type GoalCumulativeProps = {
  /** the running total at each step; null for steps still to come */
  values: (number | null)[];
  labels: string[];
  goal: number;
  /** the period before, step for step */
  ghost?: number[] | undefined;
  unit?: string | undefined;
  label: string;
  nowName?: string | undefined;
  ghostName?: string | undefined;
  height?: number | undefined;
  className?: string | undefined;
};

const smooth = (pts: [number, number][]) => pts.reduce((d, [x, y], i) => d + `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`, "");

function GoalCumulative({ values, labels, goal, ghost, unit = "", label, nowName = "This week", ghostName = "Last week", height = 250, className }: GoalCumulativeProps) {
  const [box, W] = useChartWidth<HTMLDivElement>(720);
  const [table, setTable] = React.useState(false);
  const fill = `gc${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const known = values.flatMap((v, i) => (v == null ? [] : [[i, v] as const]));
  const top = Math.max(goal, ...(ghost ?? []), ...known.map(([, v]) => v)) * 1.12;
  const R = W < 520 ? 16 : 112;
  const T = 16,
    B = height - 28;
  const X = (i: number) => 28 + (i / Math.max(1, labels.length - 1)) * (W - 28 - R);
  const Y = (v: number) => B - (v / top) * (B - T);
  const pts = known.map(([i, v]) => [X(i), Y(v)] as [number, number]);
  const line = smooth(pts);
  const last = known.at(-1);
  const met = !!last && last[1] >= goal;
  const fmt = (v: number) => `${v}${unit ? ` ${unit}` : ""}`;
  const ticks = [0, Math.round(goal / 3 / 10) * 10, Math.round((goal * 2) / 3 / 10) * 10];
  const summary = `${label}: ${last ? `${fmt(last[1])} so far` : "nothing yet"} against a goal of ${fmt(goal)}${met ? ", goal met" : ""}${ghost ? `, ${ghostName.toLowerCase()} ended at ${fmt(ghost.at(-1)!)}` : ""}.`;
  return (
    <div data-slot="goal-cumulative" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div ref={box} role="img" aria-label={summary} className="relative min-w-0" style={{ height }}>
        <svg width={W} height={height} className="block overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--ns-series)" stopOpacity={0.2} />
              <stop offset="1" stopColor="var(--ns-series)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line key={t} x1={28} x2={X(labels.length - 1)} y1={Y(t)} y2={Y(t)} stroke="var(--ns-line)" strokeWidth={0.5} />
          ))}
          <line x1={28} x2={X(labels.length - 1) + 14} y1={Y(goal)} y2={Y(goal)} stroke="var(--ns-ink)" strokeOpacity={0.55} strokeDasharray="5 4" />
          {ghost && <InkLine d={smooth(ghost.map((v, i) => [X(i), Y(v)]))} tone="quiet" dashed width={1.25} glow={false} />}
          {pts.length > 1 && <path d={`${line}L${pts.at(-1)![0].toFixed(1)} ${B}L${pts[0]![0].toFixed(1)} ${B}Z`} fill={`url(#${fill})`} />}
          <InkLine d={line} width={2.25} core="var(--ns-series-core)" />
          {pts.slice(0, -1).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.5} fill="var(--ns-series)" />
          ))}
        </svg>
        {last && <ChartHalo x={pts.at(-1)![0]} y={pts.at(-1)![1]} />}
        <div aria-hidden className="font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-ink-3)]">
          {ticks.map((t) => (
            <span key={t} className="absolute left-0" style={{ top: Y(t) - 6 }}>
              {t}
            </span>
          ))}
          <span className={cn("absolute whitespace-nowrap text-[var(--ns-ink-2)]", R < 100 && "-translate-x-full")} style={R < 100 ? { left: W, top: Y(goal) - 18 } : { left: X(labels.length - 1) + 20, top: Y(goal) - 6 }}>
            {`${goal} goal`}
          </span>
          {ghost && R >= 100 && Math.abs(Y(ghost.at(-1)!) - Y(goal)) > 14 && (
            <span className="absolute whitespace-nowrap" style={{ left: X(labels.length - 1) + 20, top: Y(ghost.at(-1)!) - 6 }}>
              {`${ghostName.toLowerCase()} ${ghost.at(-1)}`}
            </span>
          )}
          {last && (
            <span data-slot="goal-cumulative-now" className={cn("absolute rounded-full bg-[var(--ns-ink)] px-2 py-1 whitespace-nowrap text-[var(--ns-canvas)]", pts.at(-1)![0] > 140 && "-translate-x-full")} style={{ left: pts.at(-1)![0] > 140 ? pts.at(-1)![0] - 14 : pts.at(-1)![0] + 14, top: pts.at(-1)![1] - 30 }}>
              {`${last[1]}${met ? " · goal met" : ""}`}
            </span>
          )}
          {labels.map((l, i) => (
            <span key={l + i} className={cn("absolute -translate-x-1/2", last && i === last[0] && "font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]")} style={{ left: X(i), top: B + 14 }}>
              {l}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        <span className="flex items-center gap-1.5">
          <i aria-hidden className="block h-[2px] w-3 rounded-full bg-[var(--ns-series)]" />
          {nowName}
        </span>
        {ghost && (
          <span className="flex items-center gap-1.5">
            <i aria-hidden className="block w-3 border-t-[1.5px] border-dotted border-[var(--ns-ink-3)]" />
            {ghostName}
          </span>
        )}
        <ChartTableToggle open={table} onToggle={() => setTable(!table)} className="ml-auto" />
      </div>
      <ChartTable open={table} caption={label} head={["Day", nowName, ...(ghost ? [ghostName] : [])]} rows={labels.map((l, i) => [l, values[i] == null ? "—" : fmt(values[i]!), ...(ghost ? [fmt(ghost[i]!)] : [])])} />
    </div>
  );
}

export { GoalCumulative, type GoalCumulativeProps };
