// Notchset night-ribbon 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChartTable, ChartTableToggle, useChartWidth } from "@/components/ui/notchset/chart";

/*
 * Night ribbon: a night's stages stacked by depth (Awake on top, then REM, Light and Deep) as rounded capsules in the
 * stages' own tints, joined by soft risers, so the night reads as one ribbon. The longest deep stretch glows and
 * carries its pill ("Deep · 55 min"). The axis says only bedtime, two or three hours and wake; the table carries
 * every stretch.
 *
 *   <NightRibbon bed="23:10" stretches={[{ stage: "awake", from: 0, to: 14 }, …]} label="Last night's stages" />
 *
 * Minutes count from bedtime.
 */
type NightRibbonStage = "awake" | "rem" | "light" | "deep";
type NightRibbonStretch = { stage: NightRibbonStage; from: number; to: number };
type NightRibbonProps = {
  bed: string;
  stretches: NightRibbonStretch[];
  label: string;
  height?: number | undefined;
  className?: string | undefined;
};

const LANES: { stage: NightRibbonStage; name: string; color: string }[] = [
  { stage: "awake", name: "Awake", color: "var(--ns-sleep-awake)" },
  { stage: "rem", name: "REM", color: "var(--ns-sleep-rem)" },
  { stage: "light", name: "Light", color: "var(--ns-sleep-light)" },
  { stage: "deep", name: "Deep", color: "var(--ns-sleep-deep)" },
];
const lane = (s: NightRibbonStage) => LANES.findIndex((l) => l.stage === s);

function clock(bed: string, m: number) {
  const [h, mm] = bed.split(":").map(Number);
  const t = (((h! * 60 + mm! + m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
const dur = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`);

function NightRibbon({ bed, stretches, label, height = 200, className }: NightRibbonProps) {
  const id = React.useId().replace(/:/g, "");
  const [box, W] = useChartWidth<HTMLDivElement>(720);
  const [table, setTable] = React.useState(false);
  const end = stretches[stretches.length - 1]?.to ?? 1;
  const wide = W > 520;
  const GX = wide ? 56 : 0;
  const AX = 22;
  const lh = (height - AX) / 4;
  const X = (m: number) => GX + (m / end) * (W - GX);
  const Y = (s: NightRibbonStage) => lane(s) * lh;
  /* a capsule no taller than the night is wide allows: a phone gets slim bars, never upright blobs */
  const bar = Math.min(lh - 12, Math.max(14, W / 24));
  const by = (st: NightRibbonStage) => Y(st) + (lh - bar) / 2;
  const deep = stretches.filter((x) => x.stage === "deep").reduce<NightRibbonStretch | undefined>((a, x) => (!a || x.to - x.from > a.to - a.from ? x : a), undefined);
  /* the axis: bedtime, the whole hours between (two or three of them) and wake */
  const [bh, bm] = bed.split(":").map(Number);
  const every = wide ? 2 : 3;
  const ticks: number[] = [];
  for (let m = (60 - bm!) % 60; m < end - 50; m += 60) if (m > 50 && ((bh! + Math.round((bm! + m) / 60)) % 24) % every === 1) ticks.push(m);
  const summary = `${label}: in bed ${bed}, up ${clock(bed, end)}${deep ? `; the longest deep stretch ${dur(deep.to - deep.from)} from ${clock(bed, deep.from)}` : ""}`;
  return (
    <div data-slot="night-ribbon" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div ref={box} className="relative min-w-0">
        <svg role="img" aria-label={summary} width={W} height={height} className="block overflow-visible">
          <defs>
            <filter id={`${id}g`} x="-30%" y="-80%" width="160%" height="260%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <linearGradient id={`${id}v`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--ns-sleep-rem)" stopOpacity={0.6} />
              <stop offset="1" stopColor="var(--ns-sleep-deep)" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          {LANES.map((l, k) => (
            <g key={l.stage}>
              {wide && (
                <text x={0} y={k * lh + lh / 2 + 4} className="fill-[var(--ns-ink-3)] text-[length:var(--ns-text-meta)]">
                  {l.name}
                </text>
              )}
              <line x1={GX} x2={W} y1={k * lh + lh / 2} y2={k * lh + lh / 2} stroke="var(--ns-line-soft)" strokeWidth={1} />
            </g>
          ))}
          {/* the risers: each stretch joined to the next */}
          {stretches.slice(0, -1).map((x, i) => {
            const n = stretches[i + 1]!;
            const y1 = Y(x.stage) + lh / 2, y2 = Y(n.stage) + lh / 2;
            return <rect key={`r${i}`} x={X(x.to) - 1} y={Math.min(y1, y2)} width={2} height={Math.abs(y2 - y1)} rx={1} fill={`url(#${id}v)`} />;
          })}
          {deep && <rect x={X(deep.from)} y={by("deep")} width={X(deep.to) - X(deep.from)} height={bar} rx={bar / 2} fill="var(--ns-glow)" opacity={0.55} filter={`url(#${id}g)`} />}
          {stretches.map((x, i) => (
            <rect key={i} x={X(x.from) + 0.5} y={by(x.stage)} width={Math.max(3, X(x.to) - X(x.from) - 1)} height={bar} rx={Math.min(bar / 2, 9)} fill={LANES[lane(x.stage)]!.color} />
          ))}
          {[0, ...ticks, end].map((m, i, a) => (
            <text key={m} x={X(m)} y={height - 4} textAnchor={i === 0 ? "start" : i === a.length - 1 ? "end" : "middle"} className="fill-[var(--ns-ink-3)] font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)]">
              {i === 0 && wide ? `In bed ${bed}` : i === a.length - 1 && wide ? `Woke ${clock(bed, m)}` : clock(bed, m)}
            </text>
          ))}
        </svg>
        {deep && (
          <span aria-hidden className="absolute -translate-x-1/2 rounded-full bg-[var(--ns-ink)] px-2 py-[3px] font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none whitespace-nowrap text-[var(--ns-canvas)]" style={{ left: Math.min(W - 50, Math.max(50, (X(deep.from) + X(deep.to)) / 2)), top: by("deep") - 16 }}>
            Deep · {dur(deep.to - deep.from)}
          </span>
        )}
      </div>
      <ChartTableToggle open={table} onToggle={() => setTable(!table)} />
      <ChartTable caption={label} head={["From", "To", "Stage", "Length"]} rows={stretches.map((x) => [clock(bed, x.from), clock(bed, x.to), LANES[lane(x.stage)]!.name, dur(x.to - x.from)])} open={table} />
    </div>
  );
}

export { NightRibbon, type NightRibbonProps, type NightRibbonStage, type NightRibbonStretch };
