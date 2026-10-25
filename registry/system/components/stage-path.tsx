// Notchset stage-path 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Stage path: where a record is in its process, and the way to move it. Passed stages are a soft tint of the
 * current stage's colour with the days spent there, in words; the current stage is solid with a halo; later stages are
 * grey. The current stage says how long it has been there, in its colour. Press a stage to move the record there. On a phone only the current stage's name shows.
 *
 * A closed record has no current stage: `end` caps the path with the outcome (Won in emerald, Lost in ruby) and how
 * long it took; `reached` names the stages it passed. Won sweeps emerald along the passed stages, left to right.
 */
type Stage = { value: string; label: string; color: string; days?: number | undefined };
type StagePathProps = {
  stages: Stage[];
  current: string;
  onMove: (value: string) => void;
  end?: { outcome: "won" | "lost"; label: string; detail?: string | undefined } | undefined;
  reached?: string[] | undefined;
  className?: string | undefined;
};

function StagePath({ stages, current, onMove, end, reached, className }: StagePathProps) {
  const at = end ? -1 : stages.findIndex((s) => s.value === current);
  const tint = stages[Math.max(at, 0)]?.color;
  const won = end?.outcome === "won";
  return (
    <div role="group" aria-label="Stage" data-slot="stage-path" className={cn("grid gap-1.5", className)} style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))${end ? " auto" : ""}` }}>
      {stages.map((s, i) => {
        const state = end ? (reached?.includes(s.value) ? "done" : "next") : i === at ? "now" : i < at ? "done" : "next";
        const c = end ? (won ? "var(--ns-ok)" : s.color) : state === "next" ? undefined : i <= at ? s.color : tint;
        return (
          <button
            key={s.value}
            type="button"
            data-state={state}
            aria-current={state === "now" ? "step" : undefined}
            aria-label={state === "now" ? `${s.label}, current stage` : `Move to ${s.label}`}
            disabled={state === "now"}
            onClick={() => onMove(s.value)}
            style={{ "--c": c } as React.CSSProperties}
            className="group flex min-w-0 cursor-pointer flex-col gap-2 rounded-[4px] text-left outline-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ns-signal)] disabled:cursor-default"
          >
            <i
              data-ns-glide=""
              style={{ transitionDelay: won ? `${i * 60}ms` : undefined }}
              className={cn(
                "block h-1.5 rounded-[2px] [transition:background-color_400ms_ease,box-shadow_400ms_ease]",
                state === "next" && "bg-[var(--ns-line)]",
                state === "done" && "bg-[color-mix(in_oklab,var(--c)_55%,transparent)]",
                state === "now" && "bg-[var(--c)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--c)_18%,transparent)]",
              )}
            />
            <span
              className={cn(
                "flex min-w-0 items-baseline gap-[7px] overflow-hidden text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] group-hover:text-[var(--ns-ink-2)]",
                state === "now" ? "text-[var(--ns-ink)] group-hover:text-[var(--ns-ink)] max-[600px]:overflow-visible" : "max-[600px]:hidden",
                /* on a phone the one name shown may be wider than its stage; late stages let it run back to the left */
                state === "now" && i >= stages.length / 2 && "max-[600px]:justify-end",
              )}
            >
              <span className={cn("min-w-0 truncate", state === "now" && "max-[600px]:shrink-0 max-[600px]:overflow-visible")}>{s.label}</span>
              {/* the days drop first when a stage is narrow (a tablet's path), so the name stays whole */}
              {state !== "next" && s.days !== undefined && <b className={cn("shrink-0 font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)]", state === "now" ? "text-[color-mix(in_oklab,var(--c)_var(--ns-tint-ink),var(--ns-ink))]" : "text-[var(--ns-ink-3)]")}>{s.days} {s.days === 1 ? "day" : "days"}</b>}
            </span>
          </button>
        );
      })}
      {end && (
        <div data-slot="stage-end" data-outcome={end.outcome} className="flex min-w-16 flex-col gap-2 pl-1" style={{ "--c": won ? "var(--ns-ok)" : "var(--ns-bad)" } as React.CSSProperties}>
          <i data-ns-moves="" className="block h-1.5 origin-left rounded-[2px] bg-[var(--c)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--c)_18%,transparent)] [animation:ns-sweep_520ms_var(--ns-ease)_both]" style={{ animationDelay: won ? `${stages.length * 60}ms` : undefined }} />
          <span className="flex items-baseline gap-[7px] text-[length:var(--ns-text-meta)] whitespace-nowrap text-[var(--ns-ink)]">
            {end.label}
            {end.detail && <b className="font-[family-name:var(--ns-font-display)] font-[number:var(--ns-weight-medium)] text-[color-mix(in_oklab,var(--c)_var(--ns-tint-ink),var(--ns-ink))]">{end.detail}</b>}
          </span>
        </div>
      )}
    </div>
  );
}

export { StagePath, type StagePathProps };
