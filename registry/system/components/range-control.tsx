// Notchset range-control 2.0.0 · https://notchset.dev/changelog
"use client";
import { cn } from "@/lib/utils";
import { RollingNumber } from "@/components/ui/notchset/rolling-number";
import { SegmentedControl } from "@/components/ui/notchset/segmented-control";

/*
 * Range control: every trend's Day · Week · Month · 6M · Year · YTD, with the period's headline above it, "Avg 6 h 51
 * · this week, +9 min against last week". The figure rolls only when the period changes (RollingNumber, still with
 * less motion); the delta is plain words. A period the data can't show is left out, never shown empty.
 *
 *   <RangeControl value={p} onValueChange={setP} options={["day","week","month","6m","year","ytd"]} figure="6 h 51" words="this week" delta="+9 min against last week" />
 *
 * The host computes the figures (Health's engine does it with periodStats); the piece says them and switches.
 */
type RangePeriod = "day" | "week" | "month" | "6m" | "year" | "ytd";
const LABELS: Record<RangePeriod, string> = { day: "Day", week: "Week", month: "Month", "6m": "6M", year: "Year", ytd: "YTD" };

type RangeControlProps = {
  value: RangePeriod;
  onValueChange: (p: RangePeriod) => void;
  /** the periods this metric can show, in order */
  options?: RangePeriod[] | undefined;
  /** the period's figure, "6 h 51" */
  figure: string;
  /** its unit, small beside it */
  unit?: string | undefined;
  /** the label before it, "Avg" */
  lead?: string | undefined;
  /** "this week" */
  words: string;
  /** "+9 min against last week", or why there's none */
  delta?: string | undefined;
  /** which way the delta reads: ok (better), bad (worse) or neutral */
  tone?: "ok" | "bad" | "neutral" | undefined;
  /** names the switch for a screen reader */
  label?: string | undefined;
  className?: string | undefined;
};

function RangeControl({ value, onValueChange, options = ["day", "week", "month", "6m", "year", "ytd"], figure, unit, lead = "Avg", words, delta, tone = "neutral", label = "Time range", className }: RangeControlProps) {
  return (
    <div data-slot="range-control" className={cn("flex min-w-0 flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <p aria-live="polite" className="m-0 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">{lead}</span>
        <RollingNumber value={figure} className="font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-hero)] leading-none font-[number:var(--ns-weight-strong)] tracking-[-0.03em] text-[var(--ns-ink)]" />
        {unit && <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">{unit}</span>}
        <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">
          · {words}
          {delta && (
            <>
              ,{" "}
              <span data-tone={tone} className={cn(tone === "ok" ? "text-[var(--ns-ok-ink)]" : tone === "bad" ? "text-[var(--ns-warn-ink)]" : "text-[var(--ns-ink-2)]")}>
                {delta}
              </span>
            </>
          )}
        </span>
      </p>
      <SegmentedControl size="sm" label={label} value={value} onValueChange={onValueChange} options={options.map((p) => ({ value: p, label: LABELS[p] }))} />
    </div>
  );
}

export { RangeControl, type RangeControlProps, type RangePeriod };
