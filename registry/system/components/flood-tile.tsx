// Notchset flood-tile 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useAwake } from "@/lib/notchset/living";

/*
 * Flood tile: a page's one key figure on a soft wash of the Signature (Amethyst: periwinkle washing to a lilac mist;
 * Graphite: slate-steel washing to a silver mist), in one of two skins: Aurora by day (a diagonal ribbon of light
 * across the wash) and Glass by night (a frosted pane with light refracted behind it), with grain on top. The
 * label and the figure sit white on the deep corner; the fine line drawing of our own (the standing arc or the
 * ruler, drawn large at a hairline) and the caption sit in the low ink on the pale side, each passing AA where it
 * sits. Identity colour, never standing: the standing rides on it as a white status pill (`pill`). One per page at
 * most, and never on a page that already has the light field's hero reading (Today). With `drift`, the tile is the
 * page's one living light: its light drifts over about 52 s (the ribbon by day, a sheen across the pane by night),
 * moved by transform and opacity on a layer drawn once, paused while the tab is hidden or the tile is off screen
 * (living.ts) and still under less motion.
 *
 *   <FloodTile label="HRV · vs your usual" value="+6" unit="ms" pill={<StatusPill tone="ok">Above your usual</StatusPill>}
 *     figure={{ kind: "arc", value: 61, low: 47, high: 55 }} caption="Your usual 47–55 ms, last 21 nights" />
 */
type Figure = { kind: "arc" | "ruler" | "dial"; value: number; low: number; high: number };
type FloodTileProps = {
  /** what the figure is: "Sleep score · last night" */
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  /** the standing, as a StatusPill (drawn white on the tile) */
  pill?: React.ReactNode;
  /** the line drawing under the figure: the value against its range, as an arc or a ruler */
  figure?: Figure | undefined;
  /** one line under the drawing */
  caption?: React.ReactNode;
  /** the reading's context as facts, a plain label over its value ("Your range" over "47–55 ms"), at most three;
      preferred over a caption sentence */
  facts?: FloodFact[] | undefined;
  /** anything else the tile holds (counts, a link), in white */
  children?: React.ReactNode;
  /** the page's one living light: the tile's light drifts slowly (one per page, never beside another living part) */
  drift?: boolean | undefined;
  className?: string | undefined;
};

type FloodFact = { label: string; value: React.ReactNode };

const W = 520;

/** The tile's facts: label over value, split by hairlines, on one baseline. They sit low on the wash, where white
    fails AA, so both are the low ink (dark by day, white at night), the value in the medium weight. */
function Facts({ facts, center }: { facts: FloodFact[]; center?: boolean }) {
  return (
    <dl data-slot="flood-tile-facts" className={cn("m-0 flex flex-wrap gap-y-3", center && "justify-center")}>
      {facts.slice(0, 3).map((f, i) => (
        <div key={f.label} className={cn("flex min-w-0 flex-col gap-1", i > 0 ? "border-l border-[color-mix(in_oklab,var(--ns-flood-ink-low)_35%,transparent)] pl-4" : "", i < facts.length - 1 && "pr-4")}>
          <dt className="text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-flood-ink-low)]">{f.label}</dt>
          <dd className="m-0 text-[length:var(--ns-text-body)] leading-none font-[number:var(--ns-weight-medium)] whitespace-nowrap text-[var(--ns-flood-ink-low)] tabular-nums">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The standing pill on a flood: white, its word in the flood's deep tone, its dot keeping the standing's colour. */
const pillOnFlood =
  "[&_[data-slot=status-pill]]:bg-[var(--ns-flood-ink)] [&_[data-slot=status-pill]]:text-[var(--ns-flood-pill-ink)] [&_[data-slot=status-pill][data-tone=neutral]]:before:bg-[var(--ns-flood-pill-ink)] [&_[data-slot=status-pill][data-tone=signal]]:before:bg-[var(--ns-flood-deep)]";

/**
 * The flood as a surface for a host's own object that is the page's key figure (Plan's current capsule): the wash
 * alone (no deep corner), read in the low ink throughout, its inks and lines turned to that ink so every word passes
 * AA on it. Spread `style` and add `className`; put `<FloodGrain />` first inside.
 */
const floodSurface = {
  className: cn("relative isolate overflow-hidden text-[var(--ns-flood-ink-low)] shadow-[var(--ns-flood-shadow)]", pillOnFlood),
  style: {
    backgroundImage: "var(--ns-flood-wash)",
    "--ns-ink": "var(--ns-flood-ink-low)",
    "--ns-ink-2": "color-mix(in srgb, var(--ns-flood-ink-low) 94%, transparent)",
    "--ns-ink-3": "color-mix(in srgb, var(--ns-flood-ink-low) 94%, transparent)",
    "--ns-line": "color-mix(in srgb, var(--ns-flood-ink-low) 22%, transparent)",
    "--ns-line-soft": "color-mix(in srgb, var(--ns-flood-ink-low) 14%, transparent)",
    "--ns-hover": "color-mix(in srgb, var(--ns-flood-ink-low) 7%, transparent)",
    "--ns-signal": "var(--ns-flood-ink-low)",
    color: "var(--ns-flood-ink-low)",
  } as React.CSSProperties,
};
/**
 * The flood's skin under its content: by day Aurora's ribbon of light runs diagonally across the wash, low and to the
 * right of the deep corner; by night Glass's two soft lights sit behind a frosted pane. The theme turns each on.
 */
function FloodSkin({ drift = false }: { drift?: boolean | undefined }) {
  const layer = "pointer-events-none absolute -z-10 block";
  return (
    <>
      <span aria-hidden data-flood-skin="glass" className={cn(layer, "top-[-16%] left-[-6%] h-[90%] w-[70%] rounded-full blur-[40px] [background:var(--ns-flood-behind-1)]")} style={{ opacity: "calc(var(--ns-flood-glass) * 0.75)" }} />
      <span aria-hidden className={cn(layer, "right-[-10%] bottom-[-20%] h-[80%] w-[60%] rounded-full blur-[40px] [background:var(--ns-flood-behind-2)]")} style={{ opacity: "calc(var(--ns-flood-glass) * 0.7)" }} />
      <span aria-hidden className={cn(layer, "inset-0 rounded-[inherit] backdrop-blur-[26px] [background:var(--ns-flood-pane)] [box-shadow:var(--ns-flood-pane-edge)]")} style={{ opacity: "var(--ns-flood-glass)" }} />
      {/* the light that drifts sits above the pane, so the pane's blur never redraws: one layer, drawn once, moved */}
      <span aria-hidden data-flood-drift={drift || undefined} data-ns-still="" className={cn(layer, "inset-0", drift && "animate-[ns-flood-drift_52s_ease-in-out_infinite] will-change-transform")}>
        <span data-flood-skin="aurora" className={cn(layer, "top-[40%] left-[-8%] h-[58%] w-[130%] -rotate-[24deg] blur-[22px] [background:var(--ns-flood-ribbon)] [mask-image:radial-gradient(closest-side,#000_35%,transparent_100%)]")} style={{ opacity: "var(--ns-flood-aurora)" }} />
        <span className={cn(layer, "top-[62%] left-[12%] h-[14%] w-[100%] -rotate-[24deg] blur-[12px] [background:var(--ns-flood-ribbon-core)] [mask-image:radial-gradient(closest-side,#000_20%,transparent_100%)]")} style={{ opacity: "var(--ns-flood-aurora)" }} />
        {/* by night, a sheen across the glass, low and right of the figure */}
        {drift && <span className={cn(layer, "top-[30%] left-[20%] h-[80%] w-[90%] [background:radial-gradient(closest-side,var(--ns-flood-bloom),transparent)]")} style={{ opacity: "var(--ns-flood-glass)" }} />}
      </span>
    </>
  );
}

/** The grain over the flood, so the colour reads as a material. */
function FloodGrain() {
  return <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:var(--ns-flood-grain)]" />;
}

/** The standing arc drawn large: a shallow horizon of hairline ticks, the usual as a firmer stroke, the value a ring. */
function Arc({ value, low, high }: Figure) {
  const H = 120, R = 560, CY = R + 28;
  const span = high - low || 1;
  const lo = Math.min(low - span * 1.2, value - span * 0.4), hi = Math.max(high + span * 1.2, value + span * 0.4);
  const SWEEP = (26 * Math.PI) / 180;
  const ang = (v: number) => -Math.PI / 2 - SWEEP + ((v - lo) / (hi - lo)) * SWEEP * 2;
  const pt = (a: number, r = R) => [W / 2 + Math.cos(a) * r, CY + Math.sin(a) * r] as const;
  const path = (a: number, b: number) => {
    const [x1, y1] = pt(a), [x2, y2] = pt(b);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const [bx, by] = pt(ang(value));
  const N = 48;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" aria-hidden>
      {Array.from({ length: N + 1 }, (_, i) => {
        const a = -Math.PI / 2 - SWEEP + (i / N) * SWEEP * 2;
        const [x1, y1] = pt(a, R + 6), [x2, y2] = pt(a, R + (i % 6 === 0 ? 16 : 11));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={i % 6 === 0 ? 0.6 : 0.32} strokeWidth={0.75} />;
      })}
      <path d={path(-Math.PI / 2 - SWEEP, -Math.PI / 2 + SWEEP)} fill="none" stroke="currentColor" strokeOpacity={0.45} strokeWidth={0.75} />
      <path d={path(ang(low), ang(high))} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={bx} cy={by} r={7} fill="none" stroke="currentColor" strokeWidth={1} />
      <circle cx={bx} cy={by} r={2.5} fill="currentColor" />
    </svg>
  );
}

/** The ruler drawn large: fine ticks across the tile, the range as a firmer bar, the value a tall mark. */
function RulerLine({ value, low, high }: Figure) {
  const H = 44, N = 80;
  const span = high - low || 1;
  const lo = Math.min(low - span * 0.9, value - span * 0.3), hi = Math.max(high + span * 0.9, value + span * 0.3);
  const x = (v: number) => ((v - lo) / (hi - lo)) * W;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" aria-hidden>
      {Array.from({ length: N + 1 }, (_, i) => (
        <line key={i} x1={(i / N) * W} x2={(i / N) * W} y1={8} y2={i % 10 === 0 ? 22 : 16} stroke="currentColor" strokeOpacity={i % 10 === 0 ? 0.6 : 0.3} strokeWidth={0.75} />
      ))}
      <line x1={x(low)} x2={x(high)} y1={30} y2={30} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={x(value)} x2={x(value)} y1={2} y2={38} stroke="currentColor" strokeWidth={1} />
      <circle cx={x(value)} cy={30} r={3} fill="currentColor" />
    </svg>
  );
}

/**
 * The standing dial (a body page's lead reading): a near-full ring of fine ticks, the usual band as a brighter
 * segment, the reading's arc in a gradient within the Signature (never a standing colour), and a glowing bead at the
 * value; the figure and its pill sit in the centre. The bead moves only on change, with a spring, and holds still
 * under reduced motion.
 */
function Dial({ value, low, high, children }: Figure & { children: React.ReactNode }) {
  const S = 300, C = S / 2, R = 122, START = 120, SWEEP = 300;
  const span = high - low || 1;
  const lo = Math.min(low - span * 1.4, value - span * 0.4), hi = Math.max(high + span * 1.4, value + span * 0.4);
  const deg = (v: number) => START + ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * SWEEP;
  const pt = (d: number, r = R) => [C + Math.cos((d * Math.PI) / 180) * r, C + Math.sin((d * Math.PI) / 180) * r] as const;
  const arc = (a: number, b: number, r = R) => {
    const [x1, y1] = pt(a, r), [x2, y2] = pt(b, r);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const id = `dial${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const N = 60;
  const at = deg(value);
  return (
    <div data-slot="flood-dial" className="relative mx-auto aspect-square w-full max-w-[300px]">
      <svg viewBox={`0 0 ${S} ${S}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={`${id}g`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--ns-flood-deep)" />
            <stop offset="1" stopColor="var(--ns-flood-arc)" />
          </linearGradient>
          <filter id={`${id}b`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {/* the ruler, bent into a ring: 0.5px ticks, every fifth longer */}
        {Array.from({ length: N + 1 }, (_, i) => {
          const d = START + (i / N) * SWEEP;
          const [x1, y1] = pt(d, R + 12), [x2, y2] = pt(d, R + (i % 5 === 0 ? 22 : 17));
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={i % 5 === 0 ? 0.55 : 0.32} strokeWidth={0.5} />;
        })}
        <path d={arc(START, START + SWEEP)} fill="none" stroke="currentColor" strokeOpacity={0.14} strokeWidth={6} strokeLinecap="round" />
        <path d={arc(START, at)} fill="none" stroke={`url(#${id}g)`} strokeWidth={6} strokeLinecap="round" />
        {/* your usual: the brighter segment */}
        <path d={arc(deg(low), deg(high), R + 7)} fill="none" stroke="var(--ns-flood-ink)" strokeOpacity={0.95} strokeWidth={2} strokeLinecap="round" />
        <g data-ns-still="" className="origin-center [transition:transform_700ms_cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:[transition:none] [[data-motion=reduced]_&]:[transition:none]" style={{ transformOrigin: `${C}px ${C}px`, transform: `rotate(${at - START}deg)` }}>
          {(() => {
            const [bx, by] = pt(START);
            return (
              <>
                <circle cx={bx} cy={by} r={10} fill="var(--ns-flood-ink)" opacity={0.7} filter={`url(#${id}b)`} />
                <circle cx={bx} cy={by} r={6.5} fill="var(--ns-flood-ink)" />
                <circle cx={bx} cy={by} r={2.5} fill="var(--ns-flood-deep)" />
              </>
            );
          })()}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">{children}</div>
    </div>
  );
}

function FloodTile({ label, value, unit, pill, figure, caption, facts, children, drift, className }: FloodTileProps) {
  const ref = React.useRef<HTMLElement>(null);
  useAwake(ref, !!drift);
  return (
    <section ref={ref} data-slot="flood-tile" data-drift={drift || undefined} data-figure={figure?.kind} className={cn("relative isolate flex min-w-0 flex-col gap-5 overflow-hidden rounded-[var(--ns-radius-card)] p-7 shadow-[var(--ns-flood-shadow)] max-[600px]:p-5", pillOnFlood, className)} style={{ backgroundImage: figure?.kind === "dial" ? "radial-gradient(42% 38% at 50% 50%, var(--ns-flood-dial-bloom), transparent 80%), var(--ns-flood-image)" : "var(--ns-flood-image)" }}>
      <FloodSkin drift={drift} />
      <FloodGrain />
      {figure?.kind === "dial" ? (
        <>
          <span className="text-[length:var(--ns-text-small)] text-[var(--ns-flood-ink)]">{label}</span>
          <div className="text-[var(--ns-flood-ink-low)]">
            <Dial {...figure}>
              <span className="flex items-end gap-1.5">
                <span data-slot="flood-tile-value" className="font-[family-name:var(--ns-font-display)] text-[clamp(52px,5vw,72px)] leading-[0.85] font-[number:var(--ns-weight-light)] tracking-[-0.05em] tabular-nums">
                  {value}
                </span>
                {unit != null && <span className="pb-1 text-[length:var(--ns-text-body)]">{unit}</span>}
              </span>
              {pill}
            </Dial>
          </div>
          {facts?.length ? <Facts facts={facts} center /> : caption != null && <span className="text-center text-[length:var(--ns-text-small)] text-[var(--ns-flood-ink-low)]">{caption}</span>}
          {children}
        </>
      ) : (
        <>
      {/* the deep corner: white type, AA there */}
      <div className="flex flex-col gap-5 text-[var(--ns-flood-ink)]">
        <span className="text-[length:var(--ns-text-small)]">{label}</span>
        <span className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <span data-slot="flood-tile-value" className="font-[family-name:var(--ns-font-display)] text-[clamp(64px,6.4vw,96px)] leading-[0.82] font-[number:var(--ns-weight-light)] tracking-[-0.05em] tabular-nums">
            {value}
          </span>
          {/* 24px, so the unit reads as large text beside the figure (3:1) where the wash starts to lighten */}
          {unit != null && <span className="pb-1 text-[24px] leading-none font-[number:var(--ns-weight-light)]">{unit}</span>}
        </span>
        {pill && <span className="flex flex-wrap items-center gap-2">{pill}</span>}
      </div>
      {/* the pale side: the drawing and the caption in the low ink */}
      {(figure || caption != null || facts?.length || children) && (
        <div className="mt-auto flex flex-col gap-3 pt-3 text-[var(--ns-flood-ink-low)]">
          {figure && (figure.kind === "arc" ? <Arc {...figure} /> : figure.kind === "ruler" ? <RulerLine {...figure} /> : null)}
          {facts?.length ? <Facts facts={facts} /> : caption != null && <span className="text-[length:var(--ns-text-small)]">{caption}</span>}
          {children}
        </div>
      )}
        </>
      )}
    </section>
  );
}

export { type FloodFact, FloodGrain, FloodTile, floodSurface, type FloodTileProps };
