// Notchset hero-orb 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Orb, type OrbState } from "@/components/ui/notchset/orb";
import { SegmentedControl } from "@/components/ui/notchset/segmented-control";

/*
 * Hero orb: the assistant's lamp at hero size, for a landing page. It plays a conversation by itself as soon as it
 * is seen (Ready, Listening to a voice, Thinking in the notch rhythm, Speaking, Done), its levels following a voice
 * envelope through a spring, so the light leans and settles with weight rather than tracking a timeline. The first
 * touch, click or key hands it over: the states are then yours to pick, and four knobs (Glow, Grain, Warmth,
 * Response) tune the same parameters the app's orb takes. Sound is never made. Off screen or in a hidden tab it
 * stops; with less motion it shows each state's still and doesn't play itself.
 *
 * The marketing build of a pair: the app's Orb is the one a template uses (no self-play, no knobs). Same renderer.
 */
type HeroOrbProps = {
  /** play the conversation until the first touch */
  autoplay?: boolean | undefined;
  /** show the four knobs */
  knobs?: boolean | undefined;
  size?: number | undefined;
  /** the caption, six words or fewer */
  caption?: string | undefined;
  className?: string | undefined;
};

const SCRIPT: { state: OrbState; ms: number }[] = [
  { state: "idle", ms: 2200 },
  { state: "listening", ms: 3400 },
  { state: "thinking", ms: 2600 },
  { state: "speaking", ms: 3800 },
  { state: "done", ms: 2000 },
];
const OPTIONS = SCRIPT.map((s) => ({ value: s.state, label: { idle: "Ready", listening: "Listen", thinking: "Think", speaking: "Speak", done: "Done" }[s.state] }));

/* a voice, roughly: syllables (~5 a second) inside phrases (~0.4 a second), with a little roughness */
function envelope(t: number) {
  const syll = Math.max(0, Math.sin(t * 2 * Math.PI * 4.6) * 0.5 + Math.sin(t * 2 * Math.PI * 7.1 + 1) * 0.3);
  const phrase = Math.max(0, Math.sin(t * 2 * Math.PI * 0.42) + 0.35);
  return Math.min(1, syll * phrase * 0.9 + 0.04);
}

function Knob({ label, value, onChange, min = 0, max = 1.5 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const id = React.useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)]">
        {label}
        <span className="font-[family-name:var(--ns-font-mono)] text-[var(--ns-ink-3)] tabular-nums">{value.toFixed(2)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-[var(--ns-control-sm)] w-full cursor-pointer accent-[var(--ns-signal)] outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)]"
      />
    </div>
  );
}

function HeroOrb({ autoplay = true, knobs = true, size = 200, caption = "A lamp that listens", className }: HeroOrbProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<OrbState>("idle");
  const [mine, setMine] = React.useState(!autoplay);
  const [lv, setLv] = React.useState({ input: 0, output: 0 });
  const [glow, setGlow] = React.useState(1);
  const [grain, setGrain] = React.useState(1);
  const [warmth, setWarmth] = React.useState(0.5);
  const [response, setResponse] = React.useState(1);
  const [seen, setSeen] = React.useState(false);
  const [less, setLess] = React.useState(false);
  /* without an IntersectionObserver (an old browser, a test) it counts as seen */
  const visible = seen || typeof IntersectionObserver === "undefined";
  /* the script restarts from the state it was in */
  const at = React.useRef(state);
  React.useEffect(() => {
    at.current = state;
  }, [state]);

  React.useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setLess(q.matches || document.documentElement.dataset.motion === "reduced");
    read();
    q.addEventListener("change", read);
    return () => q.removeEventListener("change", read);
  }, []);
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => setSeen(es.some((e) => e.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* the self-play: the script's states in turn; any input ends it for good */
  React.useEffect(() => {
    if (mine || less || !visible) return;
    let i = SCRIPT.findIndex((s) => s.state === at.current);
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      i = (i + 1) % SCRIPT.length;
      setState(SCRIPT[i]!.state);
      t = setTimeout(next, SCRIPT[i]!.ms);
    };
    t = setTimeout(next, SCRIPT[Math.max(0, i)]!.ms);
    return () => clearTimeout(t);
  }, [mine, less, visible]);

  const voiced = !less && visible && (state === "listening" || state === "speaking");
  /* the levels: a voice envelope through a damped spring, by elapsed time (the same at 60 and 120 Hz) */
  React.useEffect(() => {
    if (!voiced) return;
    let raf = 0, last = performance.now(), x = 0, v = 0;
    const t0 = last;
    const k = 120 * response, c = 2 * Math.sqrt(k) * 0.55;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) {
        const target = envelope((now - t0) / 1000 + (state === "speaking" ? 2 : 0));
        v += (k * (target - x) - c * v) * dt;
        x += v * dt;
        const l = Math.max(0, Math.min(1, x));
        setLv(state === "listening" ? { input: l, output: 0 } : { input: 0, output: l });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [state, voiced, response]);

  const handOver = () => {
    if (!mine) setMine(true);
  };

  return (
    <div
      ref={root}
      data-slot="hero-orb"
      onPointerDown={handOver}
      onKeyDown={handOver}
      className={cn("flex min-w-0 flex-col items-center gap-6 rounded-[var(--ns-radius-xl)] bg-[var(--ns-panel)] px-[var(--ns-space-6)] pt-[var(--ns-space-8)] pb-[var(--ns-space-6)] shadow-[inset_0_0_0_1px_var(--ns-line-soft)] max-[600px]:px-[var(--ns-space-4)]", className)}
    >
      <p className="m-0 font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-title)] font-[number:var(--ns-weight-medium)] tracking-[var(--ns-tracking-display)] text-[var(--ns-ink)]">{caption}</p>
      {/* room round the lamp: its halo and settled ring reach past the sphere, and the tile never cuts them */}
      <div className="flex w-full justify-center px-[var(--ns-space-8)] py-[var(--ns-space-4)]">
        <Orb state={state} size={size} input={voiced ? lv.input : 0} output={voiced ? lv.output : 0} glow={glow} grain={grain} warmth={warmth} hint={mine ? "Pick a state, or tune the light" : "Playing by itself · touch to take over"} />
      </div>
      <SegmentedControl
        label="State"
        value={state}
        onValueChange={(v) => {
          handOver();
          setState(v);
        }}
        options={OPTIONS}
        className="max-w-full overflow-x-auto"
      />
      {knobs && (
        <div className="grid w-full max-w-[420px] grid-cols-2 gap-x-6 gap-y-3">
          <Knob label="Glow" value={glow} onChange={(v) => (handOver(), setGlow(v))} />
          <Knob label="Grain" value={grain} onChange={(v) => (handOver(), setGrain(v))} />
          <Knob label="Warmth" value={warmth} max={1} onChange={(v) => (handOver(), setWarmth(v))} />
          <Knob label="Response" value={response} min={0.3} max={2} onChange={(v) => (handOver(), setResponse(v))} />
        </div>
      )}
    </div>
  );
}

export { HeroOrb, type HeroOrbProps };
