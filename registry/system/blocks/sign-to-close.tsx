// Notchset sign-to-close 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/notchset/button";
import { CompanyMark } from "@/components/ui/notchset/company-mark";
import { StatusPill } from "@/components/ui/notchset/status-pill";

/*
 * Sign to close: a small order form that ends in a signature. Draw on the line with a finger, pen or mouse (Undo
 * takes the last stroke back, Clear starts over), or type your name and it's set in a script face, so the keyboard
 * signs too. Sign records it: the deal's pill flips to Won and the Signature traces the card's edge once, the one
 * moment the region marks. When the host refuses, the ink stays, the pill doesn't move and the reason is said with
 * Retry.
 *
 *   <SignToClose company="Stripe" color="#635bff" title="Expansion · EU region" stage={{ label: "Proposal", color: "#7c3aed" }}
 *     lines={[{ label: "Platform · 120 seats", amount: 129600 }, { label: "Onboarding", amount: 4400, once: true }]}
 *     signer="Ana Ruiz" format={money} onSign={(sig) => save(sig)} />
 *
 * Lines recur yearly unless marked `once`. With no one-time line the total is the yearly figure ("Total, per year");
 * with one, the form says what recurs, what is charged once and the first year's total, and the signed line says
 * the first year is what the quarter books, so a one-time fee is never shown as yearly value.
 */
type Line = { label: string; amount: number; /** charged once, not every year */ once?: boolean | undefined };
type Signature = { kind: "drawn"; strokes: [number, number][][] } | { kind: "typed"; name: string };
type SignToCloseProps = {
  company: string;
  color: string;
  title: string;
  /** the stage the deal sits in until it's signed */
  stage: { label: string; color: string };
  lines: Line[];
  /** who signs; the typed path starts from this name */
  signer: string;
  format: (v: number) => string;
  /** the host's save; reject (or resolve false) to refuse it */
  onSign?: ((sig: Signature) => Promise<boolean | void> | boolean | void) | undefined;
  /** which deal this is; given another, the form starts open and the first deal's answer lands nowhere (left out, key the form by the deal) */
  dealId?: string | undefined;
  /** a demo's "Sign again", which clears the signature and reopens the deal */
  replay?: boolean | undefined;
  className?: string | undefined;
};

const PAD_H = 96;

/** a stroke as a smooth path: straight to the first midpoint, then quadratic curves through each point */
function path(s: [number, number][]) {
  if (s.length === 1) return `M${s[0]![0]} ${s[0]![1]}l0.1 0`;
  let d = `M${s[0]![0]} ${s[0]![1]}`;
  for (let i = 1; i < s.length - 1; i++) {
    const [x, y] = s[i]!, [nx, ny] = s[i + 1]!;
    d += `Q${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
  }
  const [lx, ly] = s[s.length - 1]!;
  return `${d}L${lx} ${ly}`;
}

function SignToClose({ company, color, title, stage, lines, signer, format, onSign, dealId, replay = false, className }: SignToCloseProps) {
  const [strokes, setStrokes] = React.useState<[number, number][][]>([]);
  const [typing, setTyping] = React.useState(false);
  const [typed, setTyped] = React.useState(signer);
  const [state, setState] = React.useState<"open" | "busy" | "won" | "failed">("open");
  const [traced, setTraced] = React.useState(0);
  /* a generation per deal: a save still on its way for the deal before lands nowhere */
  const [deal, setDeal] = React.useState(dealId);
  const generation = React.useRef(0);
  if (deal !== dealId) {
    setDeal(dealId);
    setStrokes([]);
    setTyping(false);
    setTyped(signer);
    setState("open");
    setTraced(0);
  }
  React.useEffect(() => {
    generation.current += 1;
  }, [dealId]);
  /* the one pointer drawing, if any: a second finger or pen draws nothing, and Clear, Undo, Type and Sign end the
     stroke in progress, so a later move can't add ink to a cleared pad or to a signature already sent */
  const pen = React.useRef<number | null>(null);
  const end = () => void (pen.current = null);
  const total = lines.reduce((a, l) => a + l.amount, 0);
  const once = lines.filter((l) => l.once).reduce((a, l) => a + l.amount, 0), yearly = total - once;
  const mixed = lines.some((l) => l.once);
  const won = state === "won";
  const ready = typing ? typed.trim().length > 1 : strokes.length > 0;
  const locked = won || state === "busy";

  const at = (e: React.PointerEvent<SVGSVGElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)];
  };
  const sign = async () => {
    if (!ready || locked) return;
    end();
    setState("busy");
    const mine = generation.current;
    let ok = true;
    try {
      ok = (await onSign?.(typing ? { kind: "typed", name: typed.trim() } : { kind: "drawn", strokes })) !== false;
    } catch {
      ok = false;
    }
    if (generation.current !== mine) return;
    setState(ok ? "won" : "failed");
    if (ok) setTraced((n) => n + 1);
  };
  const reset = () => {
    setStrokes([]);
    setState("open");
  };

  return (
    <div data-slot="sign-to-close" className={cn("relative flex w-full min-w-0 flex-col gap-4 rounded-[var(--ns-radius-xl)] bg-[var(--ns-panel)] p-5 shadow-[var(--ns-shadow-float)]", className)}>
      {traced > 0 && (
        <svg key={traced} aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <rect
            width="100%"
            height="100%"
            rx="16"
            pathLength={1}
            data-ns-moves=""
            className="fill-none stroke-[var(--ns-signal)] [stroke-dasharray:1] [stroke-width:2] opacity-0 [animation:ns-ring-trace_1100ms_var(--ns-ease-panel)_both]"
          />
        </svg>
      )}
      <div className="flex items-center gap-3">
        <CompanyMark name={company} color={color} size={28} className="shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[length:var(--ns-text-strong)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{company}</span>
          <span className="truncate text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">{title}</span>
        </div>
        <span key={won ? "won" : "open"} data-ns-moves="" className="[animation:ns-island-in_var(--ns-time-dialog)_var(--ns-ease)_both]">
          {won ? <StatusPill tone="ok">Won</StatusPill> : <StatusPill color={stage.color}>{stage.label}</StatusPill>}
        </span>
      </div>

      <dl className="flex flex-col text-[length:var(--ns-text-small)]">
        {lines.map((l) => (
          <div key={l.label} className="flex items-baseline gap-3 border-b border-[var(--ns-line-soft)] py-1.5">
            <dt className="min-w-0 flex-1 truncate text-[var(--ns-ink-2)]">{l.label}</dt>
            <dd className="tabular-nums text-[var(--ns-ink)]">
              {format(l.amount)}
              {l.once && <span className="text-[var(--ns-ink-3)]"> once</span>}
            </dd>
          </div>
        ))}
        {mixed &&
          ([["Recurring, per year", yearly], ["One-time", once]] as const).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-3 pt-1.5 text-[var(--ns-ink-2)]">
              <dt className="flex-1">{k}</dt>
              <dd className="tabular-nums">{format(v)}</dd>
            </div>
          ))}
        <div className="flex items-baseline gap-3 pt-2">
          <dt className="flex-1 font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{mixed ? "First year" : "Total, per year"}</dt>
          <dd className="font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-title)] font-[number:var(--ns-weight-medium)] tracking-[var(--ns-tracking-display)] tabular-nums text-[var(--ns-ink)]">{format(total)}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-1.5">
        <span className="truncate text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
          {won ? `Signed by ${typing ? typed.trim() : signer}, today` : `${signer} signs for ${company}`}
        </span>
        <div className="relative rounded-[var(--ns-radius-lg)] bg-[var(--ns-well)]" style={{ height: PAD_H }}>
          {typing ? (
            <input
              aria-label="Type your name to sign"
              value={typed}
              readOnly={locked}
              onChange={(e) => setTyped(e.target.value)}
              /* Enter that confirms an input method's candidate is the name still being written, not a signature */
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229 && void sign()}
              className="absolute inset-x-4 bottom-5 bg-transparent font-[family-name:var(--ns-font-script)] text-[34px] leading-none text-[var(--ns-ink)] outline-hidden"
            />
          ) : (
            <svg
              role="img"
              aria-label={strokes.length ? `Your signature, ${strokes.length} ${strokes.length === 1 ? "stroke" : "strokes"}` : "Signature pad. Draw here, or type your name instead"}
              className={cn("absolute inset-0 size-full touch-none", !locked && "cursor-crosshair")}
              onPointerDown={(e) => {
                if (locked || pen.current != null) return;
                e.currentTarget.setPointerCapture?.(e.pointerId);
                pen.current = e.pointerId;
                const p = at(e);
                setStrokes((s) => [...s, [p]]);
                if (state === "failed") setState("open");
              }}
              onPointerMove={(e) => {
                if (pen.current !== e.pointerId || locked) return;
                const p = at(e);
                setStrokes((s) => (s.length ? [...s.slice(0, -1), [...s[s.length - 1]!, p]] : s));
              }}
              onPointerUp={(e) => void (pen.current === e.pointerId && end())}
              onPointerCancel={(e) => void (pen.current === e.pointerId && end())}
              onLostPointerCapture={(e) => void (pen.current === e.pointerId && end())}
            >
              {strokes.map((s, i) => (
                <path key={i} d={path(s)} className="fill-none stroke-[var(--ns-ink)] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]" />
              ))}
            </svg>
          )}
          <span aria-hidden className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end gap-2 border-b border-dashed border-[var(--ns-line)] pb-0.5 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
            ×{!typing && !strokes.length && <span className="pb-px">Sign here</span>}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
          <span className="flex-1" />
          {!won && !typing && (
            <>
              <Button size="sm" variant="ghost" disabled={!strokes.length || locked} onClick={() => (end(), setStrokes((s) => s.slice(0, -1)))}>Undo</Button>
              <Button size="sm" variant="ghost" disabled={!strokes.length || locked} onClick={() => (end(), setStrokes([]))}>Clear</Button>
            </>
          )}
          {!won && (
            <Button size="sm" variant="ghost" disabled={locked} onClick={() => (end(), setTyping((t) => !t))}>
              {typing ? "Draw instead" : "Type instead"}
            </Button>
          )}
        </div>
      </div>

      <div aria-live="polite" className="flex min-h-[var(--ns-control)] items-center justify-end gap-3">
        {state === "failed" && (
          <span data-ns-moves="" className="min-w-0 flex-1 text-[length:var(--ns-text-small)] text-[var(--ns-bad-ink)] [animation:ns-island-in_var(--ns-time-dialog)_var(--ns-ease)_both]">
            Couldn&rsquo;t record the signature. Nothing was sent; your signature is kept.
          </span>
        )}
        {won ? (
          <>
            <span data-ns-moves="" className="min-w-0 flex-1 text-[length:var(--ns-text-small)] text-[var(--ns-ok-ink)] [animation:ns-island-in_var(--ns-time-dialog)_var(--ns-ease)_both]">
              {mixed ? `Won. ${format(total)} first-year value (${format(yearly)} a year, ${format(once)} once) added to the quarter.` : `Won. ${format(total)} a year added to the quarter.`}
            </span>
            {replay && <Button variant="ghost" onClick={reset}>Sign again</Button>}
          </>
        ) : (
          <Button variant="primary" disabled={!ready} busy={state === "busy"} onClick={() => void sign()}>
            {state === "busy" ? "Signing…" : state === "failed" ? "Retry" : "Sign and close"}
          </Button>
        )}
      </div>
    </div>
  );
}

export { SignToClose, type Signature, type SignToCloseProps };
