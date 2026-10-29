// Notchset range-bar 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { springStep, useFrame, useLessMotion, type SpringState } from "@/lib/notchset/physics";
import { RollingNumber } from "@/components/ui/notchset/rolling-number";
import { StatusPill } from "@/components/ui/notchset/status-pill";
import { flagWord, formatReading, gradeOf, gradeTone, gradeWord, rangeName, rangeText, standingOf, standingTone, standingWord, type ValueFlag, type ValueRange } from "@/lib/notchset/standing";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/*
 * Range bar: where one value stands, never a bare number. The range is a neutral band with its two limits written
 * (an open end fades out: "< 100" has no floor), an optimal range inside it is a soft tint named with its source,
 * the value is the series dot with its halo, the previous value an ink tick joined to it by a dotted line, and the
 * word for where it stands sits beside it: three standings against a lab's range, Optimal (inside the optimal range,
 * or the lab's where no optimal one is named), Normal (inside the lab's, outside the optimal) and Out of range; Your
 * usual for a baseline. Out of range is said in
 * the warn tone; only the lab's critical flag or a value that may be wrong is said in the bad tone, and nothing is
 * concluded from a value that may be wrong (its dot is hollow).
 *
 *   <RangeBar name="Vitamin D" value={41} unit="ng/mL" range={{ low: 30, high: 100, kind: "lab", source: "Northside Lab" }}
 *     optimal={{ low: 50, high: 80, kind: "optimal", source: "Endocrine Society 2024" }} previous={{ value: 23, label: "14 Mar" }} measured="Lab · 16 Oct" />
 *
 * Three sizes: `full` (a record: the value at the display size, the bar, every limit and source written), `card`
 * (the value's bar with its limits, for a card) and `row` (the bar alone, for a list row; it still says everything to
 * a screen reader). The dot springs to its place only when the value changes after it's on screen (a correction, a
 * new panel), never on arrival; with less motion it lands at once.
 */
type RangeBarProps = {
  /** what's measured: "Vitamin D" */
  name: string;
  /** the value; null when there's no result yet */
  value: number | null;
  unit: string;
  /** the range it's read against: the lab's printed reference range, or your baseline */
  range: ValueRange;
  /** an optimal range inside it, with its source */
  optimal?: ValueRange | undefined;
  /** the previous value, drawn as an ink tick with the way it moved */
  previous?: { value: number; label: string } | undefined;
  flag?: ValueFlag;
  /** when and where it was measured: "Lab · 16 Oct", "Ring · synced 7:02" */
  measured?: string | undefined;
  size?: "full" | "card" | "row" | undefined;
  /** how a value is written (default: one decimal under 10) */
  format?: ((n: number) => string) | undefined;
  /** the sentence of meaning under a full bar */
  children?: React.ReactNode;
  className?: string | undefined;
};

/** The stretch of the axis a bar draws: every limit, the value and the previous one, with room at an open end. */
export function rangeDomain(range: Pick<ValueRange, "low" | "high">, ...more: (number | null | undefined)[]): [number, number] {
  const pts = [range.low, range.high, ...more].filter((n): n is number => n != null && Number.isFinite(n));
  if (!pts.length) return [0, 1];
  let lo = Math.min(...pts), hi = Math.max(...pts);
  const span = hi - lo || Math.abs(hi) || 1;
  lo = range.low == null ? Math.min(lo, 0) : lo - span * 0.28;
  hi = range.high == null ? hi + span * 0.45 : hi + span * 0.28;
  if (Math.min(...pts) >= 0) lo = Math.max(0, lo);
  return [lo, hi];
}

function RangeBar({ name, value, unit, range, optimal, previous, flag, measured, size = "full", format = (n) => formatReading(n), children, className }: RangeBarProps) {
  /* a value that may be wrong never stretches the scale: it sits past the edge, and the scale stays the range's */
  const [lo, hi] = rangeDomain(range, flag === "may-be-wrong" ? null : value, previous?.value, optimal?.low, optimal?.high);
  const pct = (v: number) => Math.max(1.5, Math.min(98.5, ((v - lo) / (hi - lo || 1)) * 100));
  const standing = standingOf(value, range);
  /* three standings against a lab's range (Optimal, Normal, Out of range); a baseline says "Your usual" */
  const grade = gradeOf(value, range, optimal);
  const tone = range.kind === "lab" ? gradeTone(grade, flag) : standingTone(standing, flag, range.kind);
  const word = flagWord(flag) ?? (range.kind === "lab" ? gradeWord(grade) : standingWord(standing, range.kind));
  const target = value == null ? null : pct(value);
  const unitText = unit ? ` ${unit}` : "";
  const said = [
    `${name} ${value == null ? "no result yet" : `${format(value)}${unitText}`}`,
    value == null ? null : word,
    `${rangeName(range.kind)} ${rangeText(range, format)}${unitText}${range.kind === "lab" ? `, from ${range.source}` : ""}`,
    optimal ? `optimal ${rangeText(optimal, format)}${unitText}, from ${optimal.source}` : null,
    previous ? `previous ${format(previous.value)} on ${previous.label}` : null,
    measured ? `measured ${measured}` : null,
  ].filter(Boolean).join("; ");

  /* the dot springs to a new value you caused (a correction, a new panel); on arrival it is simply there */
  const less = useLessMotion();
  const dot = React.useRef<HTMLElement>(null);
  const spring = React.useRef<SpringState>({ x: target ?? 0, v: 0 });
  const [moving, setMoving] = React.useState(false);
  const shown = React.useRef(target);
  /* before the new value paints, the dot is put back where it was, so the spring carries it from there */
  useIsomorphicLayoutEffect(() => {
    if (target == null || shown.current === target) return;
    const from = shown.current;
    shown.current = target;
    if (less || from == null) {
      spring.current = { x: target, v: 0 };
      return;
    }
    if (dot.current) dot.current.style.left = `${spring.current.x}%`;
    queueMicrotask(() => setMoving(true));
  }, [target, less]);
  useFrame((dt) => {
    if (target == null) return;
    const s = (spring.current = springStep(spring.current, target, 170, 0.62, dt));
    if (dot.current) dot.current.style.left = `${s.x}%`;
    if (Math.abs(s.x - target) < 0.02 && Math.abs(s.v) < 0.2) {
      spring.current = { x: target, v: 0 };
      if (dot.current) dot.current.style.left = `${target}%`;
      setMoving(false);
    }
  }, moving && !less);

  const bandFrom = range.low == null ? 0 : pct(range.low);
  const bandTo = range.high == null ? 100 : pct(range.high);
  const row = size === "row";
  const trackH = row ? "h-[6px]" : "h-[10px]";
  const bar = (
    <div data-slot="range-bar-track" role="img" aria-label={said} className={cn("relative w-full", row ? "h-[14px]" : "h-[22px]")}>
      <i aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--ns-line)]" />
      <i
        aria-hidden
        data-slot="range-bar-band"
        className={cn("absolute top-1/2 -translate-y-1/2 rounded-[var(--ns-radius-full)] bg-[var(--ns-band)]", trackH)}
        style={{
          left: `${bandFrom}%`,
          width: `${bandTo - bandFrom}%`,
          /* an open end fades away: there is no limit on that side */
          maskImage: range.low == null ? "linear-gradient(to right, transparent, #000 38%)" : range.high == null ? "linear-gradient(to left, transparent, #000 38%)" : undefined,
        }}
      />
      {optimal && (
        <i
          aria-hidden
          data-slot="range-bar-optimal"
          className={cn("absolute top-1/2 -translate-y-1/2 rounded-[var(--ns-radius-full)] bg-[var(--ns-band-optimal)]", trackH)}
          style={{ left: `${optimal.low == null ? bandFrom : pct(optimal.low)}%`, width: `${(optimal.high == null ? bandTo : pct(optimal.high)) - (optimal.low == null ? bandFrom : pct(optimal.low))}%` }}
        />
      )}
      {!row &&
        [range.low, range.high].map((l, i) =>
          l == null ? null : <i key={i} aria-hidden className="absolute top-1/2 h-[16px] w-px -translate-x-1/2 -translate-y-1/2 bg-[var(--ns-band-edge)]" style={{ left: `${pct(l)}%` }} />,
        )}
      {previous && value != null && (
        <>
          <i
            aria-hidden
            data-slot="range-bar-move"
            className="absolute top-1/2 h-0 -translate-y-1/2 border-t border-dotted border-[var(--ns-ink-3)]"
            style={{ left: `${Math.min(pct(previous.value), target!)}%`, width: `${Math.abs(target! - pct(previous.value))}%` }}
          />
          <i aria-hidden data-slot="range-bar-previous" className={cn("absolute top-1/2 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ns-ink-3)]", row ? "h-[10px]" : "h-[14px]")} style={{ left: `${pct(previous.value)}%` }} />
        </>
      )}
      {target != null && (
        <i
          ref={dot}
          aria-hidden
          data-slot="range-bar-value"
          data-flag={flag}
          className={cn(
            "absolute top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full",
            row ? "size-[10px]" : "size-[12px]",
            flag === "may-be-wrong"
              ? "bg-[var(--ns-panel)] shadow-[inset_0_0_0_2px_var(--ns-bad),0_0_0_2px_var(--ns-panel)]"
              : row
                ? /* a row is one of many: its dot is cut from the panel, with no glow (one glow per screen region) */
                  "bg-[var(--ns-series)] shadow-[0_0_0_2px_var(--ns-panel)]"
                : "bg-[var(--ns-series)] shadow-[0_0_0_2.5px_var(--ns-panel),0_0_0_7px_color-mix(in_oklab,var(--ns-series)_16%,transparent),0_0_14px_5px_color-mix(in_oklab,var(--ns-series)_var(--ns-glow),transparent)]",
          )}
          style={{ left: `${target}%` }}
        >
          {/* on a record's bar the value is written over its dot, so the scale reads at a glance */}
          {size === "full" && value != null && (
            <span className="absolute bottom-[calc(100%+7px)] left-1/2 -translate-x-1/2 text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)] whitespace-nowrap text-[var(--ns-ink)] not-italic tabular-nums">{format(value)}</span>
          )}
        </i>
      )}
    </div>
  );

  if (row) return <div data-slot="range-bar" data-standing={standing} data-grade={grade} data-size="row" className={cn("min-w-[72px]", className)}>{bar}</div>;

  const limits = (
    <div aria-hidden className="relative h-4 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-4 text-[var(--ns-ink-3)] tabular-nums">
      {[range.low, range.high].map((l, i) => {
        if (l == null) return null;
        const at = pct(l);
        return (
          <span key={i} className="absolute top-0 whitespace-nowrap" style={at > 80 ? { right: `${100 - at}%`, transform: "translateX(50%)" } : { left: `${at}%`, transform: "translateX(-50%)" }}>
            {format(l)}
          </span>
        );
      })}
    </div>
  );

  if (size === "card")
    return (
      <div data-slot="range-bar" data-standing={standing} data-grade={grade} data-size="card" className={cn("flex min-w-0 flex-col gap-0.5", className)}>
        {value == null && <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">No result yet · {rangeName(range.kind)} {rangeText(range, format)}{unitText}</span>}
        {bar}
        {limits}
      </div>
    );

  return (
    <div data-slot="range-bar" data-standing={standing} data-grade={grade} data-size="full" className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {value == null ? (
          <span className="font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-record)] leading-none font-[number:var(--ns-weight-medium)] tracking-[var(--ns-tracking-display)] text-[var(--ns-ink-3)]">--</span>
        ) : (
          <RollingNumber value={format(value)} className="font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-record)] leading-none font-[number:var(--ns-weight-medium)] tracking-[var(--ns-tracking-display)] text-[var(--ns-ink)]" />
        )}
        <span className="text-[length:var(--ns-text-strong)] text-[var(--ns-ink-2)]">{unit}</span>
        {value != null && (
          <StatusPill tone={tone} className="ml-1 self-center">
            {word}
          </StatusPill>
        )}
      </div>
      {children != null && <p className="m-0 max-w-[60ch] text-[length:var(--ns-text-body)] leading-[var(--ns-leading)] text-[var(--ns-ink-2)]">{children}</p>}
      <div className="flex flex-col gap-1 pt-1">
        {optimal &&
          (() => {
            /* the optimal band's name sits over its start, or over its end when the value's own label is there; with
               the value at both, it is left to the list below, so two labels never sit on each other */
            const from = Math.min(70, optimal.low == null ? bandFrom : pct(optimal.low));
            const to = optimal.high == null ? bandTo : pct(optimal.high);
            const at = value == null || flag === "may-be-wrong" ? null : pct(value);
            const clear = (a: number, b: number) => at == null || at < a - 4 || at > b + 4;
            const style = clear(from, from + 22) ? { left: `${from}%` } : clear(to - 22, to) ? { right: `${Math.max(0, 100 - to)}%` } : null;
            return (
              <span aria-hidden className="relative h-4 text-[length:var(--ns-text-meta)] leading-4 text-[var(--ns-ok-ink)]">
                {style && (
                  <span className="absolute whitespace-nowrap" style={style}>
                    Optimal {rangeText(optimal, format)}
                  </span>
                )}
              </span>
            );
          })()}
        {bar}
        {limits}
      </div>
      <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[length:var(--ns-text-small)]">
        <dt className="text-[var(--ns-ink-3)]">{rangeName(range.kind)}</dt>
        <dd className="m-0 text-[var(--ns-ink-2)]">
          {rangeText(range, format)}
          {unitText} · {range.source}
        </dd>
        {optimal && (
          <>
            <dt className="text-[var(--ns-ink-3)]">Optimal</dt>
            <dd className="m-0 text-[var(--ns-ink-2)]">
              {rangeText(optimal, format)}
              {unitText} · {optimal.source}
            </dd>
          </>
        )}
        {previous && (
          <>
            <dt className="text-[var(--ns-ink-3)]">Previous</dt>
            <dd className="m-0 text-[var(--ns-ink-2)] tabular-nums">
              {format(previous.value)}
              {unitText} · {previous.label}
            </dd>
          </>
        )}
        {measured && (
          <>
            <dt className="text-[var(--ns-ink-3)]">Measured</dt>
            <dd className="m-0 text-[var(--ns-ink-2)]">{measured}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

export { RangeBar, type RangeBarProps };
