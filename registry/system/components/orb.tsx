// Notchset orb 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Orb: the assistant's lamp. A sphere of frosted glass lit from inside, one warm key light on its skin, a dawn rim
 * from below and a static grain, drawn for each theme and Signature (the --ns-orb-* roles), never inverted. It says
 * what the assistant is doing, always with a word under it (or the host's own words beside it):
 *
 *   Ready      the light drifts slowly round the centre (a turn takes 19 s and more); the lamp breathes.
 *   Listening  the rim facing your voice brightens with the input level (the edge is you); the key light leans to it.
 *   Thinking   four points of light move a quarter-turn and rest a beat: the notch, Notchset's own rhythm.
 *   Speaking   the body warms and swells with the output level (the body is it); the rim stays quiet.
 *   Done       one soft ring goes out, once, then it rests. Never green.
 *
 * Built from CSS layers that move only by transform and opacity, by time and never by frame, with no network
 * assets. One running loop per viewport: only the orb that asked last and is on screen moves; every other orb shows
 * its still (the useOrbLoop store below). Less motion (the device's setting or data-motion="reduced") gives one still
 * composition per state, so the state still reads without movement.
 *
 *   <Orb state="thinking" size={120} />                       // a first-run orb, its word under it
 *   <Orb state="listening" input={level} size={32} word="none" /> // in a voice strip whose words sit beside it
 */
type OrbState = "idle" | "listening" | "thinking" | "speaking" | "done";
type OrbProps = {
  state?: OrbState | undefined;
  /** its diameter in px */
  size?: number | undefined;
  /** the input level while listening, 0 to 1 (your voice: it lights the edge) */
  input?: number | undefined;
  /** the output level while speaking, 0 to 1 (its voice: it swells the body); without one the body swells on its own */
  output?: number | undefined;
  /** where your voice comes from, so the lit edge faces it */
  inputFrom?: "below" | "above" | undefined;
  /** the word under it; "none" only where the host says the state in its own words beside it */
  word?: "under" | "none" | undefined;
  /** its own words per state */
  words?: Partial<Record<OrbState, string>> | undefined;
  /** one quieter line under the word */
  hint?: React.ReactNode;
  /** asks for the viewport's one running loop; false keeps it still (an avatar, a thumbnail) */
  live?: boolean | undefined;
  /** how strongly it glows, 0 to 1.5 (1 is the theme's own) */
  glow?: number | undefined;
  /** how much grain the glass has, 0 to 1.5 */
  grain?: number | undefined;
  /** how warm its light runs, 0 to 1 */
  warmth?: number | undefined;
  className?: string | undefined;
};

const WORDS: Record<OrbState, string> = { idle: "Ready", listening: "Listening", thinking: "Thinking", speaking: "Speaking", done: "Done" };

/* each state's composition: the weight of each light (deep, core, body, lift, cool, warm), how far they sit from
   the centre, the halo, the notch's four points, the lit edge, the body's scale and where the key light leans */
type Comp = { w: [number, number, number, number, number, number]; spread: number; halo: number; notch: number; arc: number; scale: number; key: [number, number] };
const COMP: Record<OrbState, Comp> = {
  idle: { w: [0.85, 0.9, 0.75, 0.55, 0.25, 0.35], spread: 26, halo: 0.55, notch: 0, arc: 0, scale: 1, key: [-14, -12] },
  listening: { w: [0.45, 0.8, 1, 0.85, 0.5, 0.3], spread: 22, halo: 0.8, notch: 0, arc: 0.45, scale: 1.02, key: [-10, -4] },
  thinking: { w: [1, 1, 0.55, 0.25, 0.9, 0.08], spread: 30, halo: 0.45, notch: 1, arc: 0, scale: 0.975, key: [-14, -14] },
  speaking: { w: [0.55, 0.8, 0.7, 0.9, 0.25, 0.95], spread: 28, halo: 0.75, notch: 0, arc: 0, scale: 1.02, key: [-12, -10] },
  done: { w: [0.75, 0.95, 0.85, 0.6, 0.3, 0.4], spread: 25, halo: 0.42, notch: 0, arc: 0, scale: 0.995, key: [-14, -12] },
};
const LIGHTS = ["--ns-orb-deep", "--ns-orb-core", "--ns-orb-body", "--ns-orb-lift", "--ns-orb-cool", "--ns-orb-warm"] as const;
/* each light's own turn: a period and a direction, so they drift in polar space without ever lining up */
const TURN = [
  "[animation:ns-orb-turn_23s_linear_infinite]",
  "[animation:ns-orb-turn_19s_linear_infinite_reverse]",
  "[animation:ns-orb-turn_29s_linear_infinite]",
  "[animation:ns-orb-turn_17s_linear_infinite_reverse]",
  "[animation:ns-orb-turn_31s_linear_infinite]",
  "[animation:ns-orb-turn_21s_linear_infinite_reverse]",
] as const;
const PHASE = [0, 140, 250, 60, 200, 310];
/* the notch's four points, on a circle 34% out from the centre, at 22.5° and each quarter after (x, y in % of the orb) */
const NOTCH = [0, 1, 2, 3].map((k) => {
  const a = ((22.5 + 90 * k) * Math.PI) / 180;
  return [Math.round((50 + 34 * Math.sin(a)) * 10) / 10, Math.round((50 - 34 * Math.cos(a)) * 10) / 10] as const;
});
/* the grain: one static turbulence tile, inline, so the orb never fetches anything */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 2.2 -0.55'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/* ---------- one running loop per viewport ---------- */

const loop = { asks: [] as symbol[], subs: new Set<() => void>() };
const notifyLoop = () => loop.subs.forEach((f) => f());
const subscribeLoop = (f: () => void) => {
  loop.subs.add(f);
  return () => void loop.subs.delete(f);
};
/** True for the one orb whose loop runs: the latest that asked and is on screen. Still on the server. */
function useOrbLoop(want: boolean, el: React.RefObject<HTMLElement | null>) {
  const [token] = React.useState(() => Symbol("orb"));
  const [seen, setSeen] = React.useState(true);
  React.useEffect(() => {
    const node = el.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => setSeen(es.some((e) => e.isIntersecting)));
    io.observe(node);
    return () => io.disconnect();
  }, [el]);
  React.useEffect(() => {
    const t = token;
    if (!want || !seen) return;
    loop.asks.push(t);
    notifyLoop();
    return () => {
      loop.asks = loop.asks.filter((x) => x !== t);
      notifyLoop();
    };
  }, [want, seen, token]);
  return React.useSyncExternalStore(
    subscribeLoop,
    () => loop.asks[loop.asks.length - 1] === token,
    () => false,
  );
}

/** Less motion, by the device's setting or the app's data-motion="reduced": levels stop driving the orb. */
function useLessMotion() {
  return React.useSyncExternalStore(
    (f) => {
      if (typeof matchMedia === "undefined") return () => {};
      const q = matchMedia("(prefers-reduced-motion: reduce)");
      q.addEventListener("change", f);
      const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver(f);
      mo?.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
      return () => {
        q.removeEventListener("change", f);
        mo?.disconnect();
      };
    },
    () => (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) || document.documentElement.dataset.motion === "reduced",
    () => false,
  );
}

const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));

function Orb({
  state = "idle",
  size = 120,
  input,
  output,
  inputFrom = "below",
  word = "under",
  words,
  hint,
  live = true,
  glow = 1,
  grain = 1,
  warmth = 0.5,
  className,
}: OrbProps) {
  const stage = React.useRef<HTMLDivElement>(null);
  const running = useOrbLoop(live, stage);
  const less = useLessMotion();
  /* a new Done sends one ring; the key re-mounts it so it plays once per arrival, never on a re-render */
  const [pulse, setPulse] = React.useState(0);
  const prev = React.useRef(state);
  React.useEffect(() => {
    if (state === "done" && prev.current !== "done") setPulse((n) => n + 1);
    prev.current = state;
  }, [state]);

  const c = COMP[state];
  const lin = less || !running ? (state === "listening" ? 0.6 : 0) : clamp(input ?? (state === "listening" ? 0.35 : 0));
  const lout = less || !running ? (state === "speaking" ? 0.5 : 0) : clamp(output ?? 0);
  const warm = clamp(warmth);
  const w = c.w.map((x, i) => clamp(i === 5 ? x * (0.5 + warm) : i === 4 ? x * (1.5 - warm) : x));
  const scale = c.scale + (state === "speaking" ? lout * 0.05 : 0) + (state === "listening" ? lin * 0.015 : 0);
  const facing = inputFrom === "below" ? 180 : 0;
  const label = words?.[state] ?? WORDS[state];
  const swellOwn = state === "speaking" && output === undefined;

  const vars = {
    "--orb-spread": `${c.spread}%`,
    "--orb-halo": `${clamp(c.halo * glow + lin * 0.25 + lout * 0.2, 0, 1.4)}`,
    "--orb-arc": `${state === "listening" ? clamp(c.arc + lin * 0.55) : 0}`,
    "--orb-notch": `${c.notch}`,
    width: size,
    height: size,
  } as React.CSSProperties;

  return (
    <span
      data-slot="orb"
      data-state={state}
      data-live={running && !less ? "true" : "false"}
      className={cn("group/orb inline-flex shrink-0 flex-col items-center gap-[var(--ns-space-3)]", className)}
    >
      <span ref={stage} aria-hidden="true" className="pointer-events-none relative block shrink-0" style={vars}>
        {/* the light it throws on the surface under it */}
        <span
          className="absolute right-[14%] -bottom-[11%] left-[14%] h-[22%] rounded-full blur-[10px]"
          style={{ background: "radial-gradient(closest-side, var(--ns-orb-ground), transparent)" }}
        />
        {/* the one glow, at the state's strength */}
        <span
          data-ns-glide=""
          className="absolute -inset-[22%] rounded-full [transition:opacity_900ms_var(--ns-ease),scale_160ms_linear]"
          style={{ background: "radial-gradient(closest-side, var(--ns-orb-halo) 52%, transparent 100%)", opacity: "var(--orb-halo)", scale: `${1 + lin * 0.08}` }}
        />
        {/* Listening: the rim facing your voice, brighter as you speak */}
        <span
          data-ns-glide=""
          className="absolute -inset-[5%] rounded-full [transition:opacity_160ms_linear,scale_160ms_linear]"
          style={{
            opacity: "var(--orb-arc)",
            scale: `${1 + lin * 0.05}`,
            background: `conic-gradient(from ${facing - 80}deg, transparent 0deg, var(--ns-orb-rim) 45deg, var(--ns-orb-body) 80deg, var(--ns-orb-rim) 115deg, transparent 160deg)`,
            WebkitMask: "radial-gradient(closest-side, transparent 83%, #000 89%, #000 94%, transparent 100%)",
            mask: "radial-gradient(closest-side, transparent 83%, #000 89%, #000 94%, transparent 100%)",
          }}
        />
        {/* Done: one ring goes out, once, and a settled ring stays (the still's idea, carried into the moving build), so a
            frame of Done never reads as Ready */}
        {state === "done" && running && !less && (
          <span key={pulse} className="absolute -inset-[6%] rounded-full opacity-0 [animation:ns-orb-pulse_1.1s_var(--ns-ease)_1_both]" style={{ boxShadow: "0 0 0 1px var(--ns-orb-rim), 0 0 18px 2px var(--ns-orb-halo)" }} />
        )}
        <span
          data-ns-glide=""
          className="absolute -inset-[6%] rounded-full [transition:opacity_700ms_var(--ns-ease)_500ms]"
          style={{ opacity: state === "done" ? 0.45 : 0, boxShadow: "0 0 0 1px var(--ns-orb-rim), 0 0 14px 1px var(--ns-orb-halo)" }}
        />
        {/* the lamp: breathes at rest, swells when it speaks */}
        <span data-ns-still="" className="absolute inset-0 block group-data-[live=true]/orb:[animation:ns-orb-breathe_5.5s_ease-in-out_infinite]">
          <span
            data-ns-glide=""
            data-ns-still=""
            className={cn("absolute inset-0 block [transition:scale_140ms_linear]", swellOwn && "group-data-[live=true]/orb:[animation:ns-orb-swell_1.15s_ease-in-out_infinite]")}
            style={{ scale: `${scale}` }}
          >
            <span
              className="absolute inset-0 isolate block overflow-hidden rounded-full"
              style={{
                background: "radial-gradient(circle at 50% 28%, var(--ns-orb-skin-hi) 0%, var(--ns-orb-skin-mid) 52%, var(--ns-orb-skin-lo) 100%)",
                boxShadow: "inset 0 0 0 1px var(--ns-orb-edge)",
              }}
            >
              {LIGHTS.map((v, i) => (
                <span key={v} data-ns-still="" className={cn("absolute inset-0 block", TURN[i], "[animation-play-state:paused] group-data-[live=true]/orb:[animation-play-state:running]")} style={{ rotate: `${PHASE[i]}deg` }}>
                  <span
                    data-ns-glide=""
                    className="absolute top-[17%] left-[17%] block size-[66%] rounded-full [transition:opacity_900ms_var(--ns-ease),translate_900ms_var(--ns-ease)]"
                    style={{
                      opacity: w[i],
                      translate: `0 calc(var(--orb-spread) * ${i % 2 ? -1 : 1})`,
                      background: `radial-gradient(closest-side, var(${v}) 0%, color-mix(in oklab, var(${v}) 70%, transparent) 38%, color-mix(in oklab, var(${v}) 18%, transparent) 72%, transparent 100%)`,
                    }}
                  />
                </span>
              ))}
              {/* Thinking: four points of light on the rim's arc, a quarter-turn and a rest. Set at 22.5° off the axes, no
                  two ever sit level (two level points read as eyes: a lamp, never a face), and a quarter-turn lands
                  them on the same pose, so the rest always reads the same. */}
              <span
                data-ns-still=""
                data-ns-glide=""
                className="absolute inset-0 block [transition:opacity_600ms_var(--ns-ease)] group-data-[live=true]/orb:[animation:ns-orb-notch_1.6s_cubic-bezier(.7,0,.3,1)_infinite]"
                style={{ opacity: "var(--orb-notch)" }}
              >
                {NOTCH.map(([x, y], i) => (
                  <span
                    key={i}
                    className="absolute block size-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: `${x}%`, top: `${y}%`, background: "radial-gradient(closest-side, rgb(255 255 255 / 0.95), var(--ns-orb-cool) 30%, color-mix(in oklab, var(--ns-orb-cool) 25%, transparent) 62%, transparent)" }}
                  />
                ))}
              </span>
              {/* the lamp's source: in light, the brightest point, off-centre high (light comes from inside, not from a
                  painted surface); in dark the inner glow already carries it and this is clear */}
              <span
                data-ns-glide=""
                className="absolute top-[6%] left-[14%] block size-[66%] rounded-full [transition:opacity_900ms_var(--ns-ease)]"
                style={{ opacity: "calc(0.7 + var(--orb-halo) * 0.3)", background: "radial-gradient(closest-side, var(--ns-orb-inner) 0%, color-mix(in oklab, var(--ns-orb-inner) 45%, transparent) 45%, transparent 100%)" }}
              />
              {/* the key light on the skin, leaning toward your voice */}
              <span
                data-ns-glide=""
                className="absolute top-[15%] left-[15%] block size-[70%] rounded-full mix-blend-soft-light [transition:translate_900ms_var(--ns-ease)]"
                style={{ opacity: "var(--ns-orb-key)", translate: `${c.key[0]}% ${c.key[1] + (inputFrom === "below" ? lin * 8 : -lin * 8)}%`, background: "radial-gradient(closest-side, rgb(255 255 255 / 0.62), rgb(255 255 255 / 0.12) 55%, transparent)" }}
              />
              <span className="absolute top-[13%] left-[27%] block h-[17%] w-[26%] rounded-full opacity-80 blur-[3px]" style={{ background: "radial-gradient(closest-side, rgb(255 255 255 / 0.55), transparent)" }} />
              {/* the limb's falloff and the dawn rim from below: what makes a disc read as a sphere */}
              <span
                className="absolute inset-0 block rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 36% 30%, transparent var(--ns-orb-limb-from), var(--ns-orb-limb) 100%), radial-gradient(ellipse 70% 30% at 50% 102%, color-mix(in oklab, var(--ns-orb-dawn) 45%, transparent), transparent 70%)",
                }}
              />
              <span className="absolute inset-0 block mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px", opacity: `calc(var(--ns-orb-grain) * ${clamp(grain, 0, 1.5)})` }} />
            </span>
          </span>
        </span>
      </span>
      {word === "under" && (
        <span className="flex flex-col items-center gap-0.5 text-center">
          <span data-slot="orb-word" className="font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-strong)] font-[number:var(--ns-weight-medium)] tracking-[var(--ns-tracking-display)] text-[var(--ns-ink)]">
            {label}
          </span>
          {hint && <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">{hint}</span>}
        </span>
      )}
    </span>
  );
}

export { Orb, type OrbProps, type OrbState };
