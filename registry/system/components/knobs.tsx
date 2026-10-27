// Notchset knobs 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Knobs and the ghost cursor: what a showcase piece is played with (SHOWCASE-RULES.md, "Knobs" and "It plays itself,
 * then hands over"). Knobs is one Tune control, closed by default, that opens a row of two to four labelled sliders for a piece's physics (Tension, Damping), each with
 * its value written; a knob may also be a choice of a few words. GhostCursor is the hand that acts the moment out
 * while a piece plays itself: a pointer drawn at a spot of the stage, pressed or not, hidden from screen readers.
 *
 *   <Knobs knobs={[{ label: "Tension", value: t, min: 0.2, max: 2, onChange: setT }, { label: "Figure", value: f, options: ["Body", "Plant", "None"], onChange: setF }]} />
 */
type SliderKnob = { label: string; value: number; min?: number | undefined; max?: number | undefined; step?: number | undefined; onChange: (v: number) => void; format?: ((v: number) => string) | undefined };
type ChoiceKnob = { label: string; value: string; options: string[]; onChange: (v: string) => void };
type Knob = SliderKnob | ChoiceKnob;
type KnobsProps = {
  knobs: Knob[];
  /** open at first; closed by default behind one Tune control, so the piece is the object, not its sliders */
  defaultOpen?: boolean | undefined;
  className?: string | undefined;
};

function Slider({ k }: { k: SliderKnob }) {
  const id = React.useId();
  const min = k.min ?? 0, max = k.max ?? 1;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)]">
        {k.label}
        <span className="font-[family-name:var(--ns-font-mono)] text-[var(--ns-ink-3)] tabular-nums">{k.format ? k.format(k.value) : k.value.toFixed(2)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={k.step ?? (max - min) / 100}
        value={k.value}
        onChange={(e) => k.onChange(Number(e.target.value))}
        className="h-[var(--ns-control-sm)] w-full cursor-pointer accent-[var(--ns-signal)] outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)]"
      />
    </div>
  );
}

function Choice({ k }: { k: ChoiceKnob }) {
  const id = React.useId();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={id} className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)]">
        {k.label}
      </span>
      <div role="radiogroup" aria-labelledby={id} className="flex h-[var(--ns-control-sm)] items-center gap-0.5 rounded-[var(--ns-radius)] bg-[var(--ns-well)] p-0.5 shadow-[inset_0_0_0_1px_var(--ns-line-soft)]">
        {k.options.map((o, i) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={k.value === o}
            tabIndex={k.value === o ? 0 : -1}
            onClick={() => k.onChange(o)}
            onKeyDown={(e) => {
              const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!d || e.nativeEvent.isComposing) return;
              e.preventDefault();
              const next = k.options[(i + d + k.options.length) % k.options.length]!;
              k.onChange(next);
              (e.currentTarget.parentElement?.children[(i + d + k.options.length) % k.options.length] as HTMLElement | undefined)?.focus();
            }}
            className="h-full min-w-0 flex-1 cursor-pointer truncate rounded-[calc(var(--ns-radius)-2px)] px-2 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)] outline-hidden [transition:background-color_var(--ns-time-color),color_var(--ns-time-color)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] aria-checked:bg-[var(--ns-raised)] aria-checked:text-[var(--ns-ink)] aria-checked:shadow-[var(--ns-bezel)]"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Knobs({ knobs, defaultOpen = false, className }: KnobsProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();
  return (
    <div data-slot="knobs" data-open={open || undefined} className={cn("flex w-full flex-col gap-3", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="inline-flex h-[var(--ns-control-sm)] cursor-pointer items-center gap-1.5 self-start rounded-[var(--ns-radius)] px-2 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)] outline-hidden [transition:background-color_var(--ns-time-color),color_var(--ns-time-color)] hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] aria-expanded:text-[var(--ns-ink)]"
      >
        <SlidersHorizontal aria-hidden className="size-3.5" strokeWidth={1.75} />
        {open ? "Done tuning" : "Tune"}
      </button>
      {open && (
        <div id={id} data-ns-moves="" className={cn("grid w-full gap-x-5 gap-y-3 [animation:ns-fade_var(--ns-time-menu)_var(--ns-ease)]", knobs.length > 2 ? "grid-cols-3 max-[600px]:grid-cols-2" : "grid-cols-2")}>
          {knobs.map((k) => ("options" in k ? <Choice key={k.label} k={k} /> : <Slider key={k.label} k={k} />))}
        </div>
      )}
    </div>
  );
}

/** The hand that acts a moment out: drawn at (x, y) in pixels of its positioned parent, pressed or not. */
function GhostCursor({ x, y, down, hidden }: { x: number; y: number; down?: boolean | undefined; hidden?: boolean | undefined }) {
  return (
    <span
      aria-hidden
      data-slot="ghost-cursor"
      className="pointer-events-none absolute top-0 left-0 z-[5] block [transition:opacity_var(--ns-time-dialog)]"
      style={{ transform: `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`, opacity: hidden ? 0 : 1 }}
    >
      <span className="absolute top-0 left-0 block size-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color-mix(in_oklab,var(--ns-ink)_14%,transparent)] [transition:scale_120ms_var(--ns-ease),opacity_120ms]" style={{ scale: down ? "1" : "0.4", opacity: down ? 1 : 0 }} />
      <svg width="20" height="22" viewBox="0 0 20 22" className="relative -translate-x-[2px] -translate-y-[2px] drop-shadow-[0_2px_3px_rgb(0_0_0/0.28)]" style={{ scale: down ? "0.92" : "1", transition: "scale 120ms var(--ns-ease)" }}>
        <path d="M2.5 1.8 L2.5 17.2 L6.6 13.4 L9.3 19.6 L12.2 18.3 L9.5 12.3 L15.2 12.1 Z" fill="var(--ns-panel)" stroke="var(--ns-ink)" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export { GhostCursor, Knobs, type Knob, type KnobsProps };
