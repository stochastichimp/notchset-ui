// Notchset switch 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Switch as Base } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

/*
 * Switch: a setting that takes effect the moment it flips (no Save). Off is a mid-grey track (--ns-ink-4, 3:1 or
 * better on every surface, so the control is seen before it's touched); on is ink. The
 * thumb slides on the system's ease. Children become its label. The target is 24px tall at least (a 1px clear band
 * above and below the track, outside its painted background); on touch screens the hit area grows to 40px.
 */
type SwitchProps = Omit<React.ComponentPropsWithoutRef<typeof Base.Root>, "className"> & {
  className?: string | undefined;
  children?: React.ReactNode;
};

function Switch({ className, children, ...props }: SwitchProps) {
  const track = (
    <Base.Root
      data-slot="switch"
      className={cn(
        "relative box-content inline-block h-[var(--ns-switch-h)] w-[var(--ns-switch-w)] shrink-0 bg-clip-content py-[max(0px,calc((24px-var(--ns-switch-h))/2))] cursor-pointer rounded-full bg-[var(--ns-ink-4)] outline-hidden [transition:background-color_160ms]",
        "data-checked:bg-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] data-disabled:cursor-default data-disabled:opacity-45",
        "pointer-coarse:after:absolute pointer-coarse:after:-inset-3 pointer-coarse:after:content-['']",
        className,
      )}
      {...props}
    >
      <Base.Thumb className="absolute top-[calc(3px+max(0px,calc((24px-var(--ns-switch-h))/2)))] left-[3px] block size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.3)] [transition:transform_200ms_var(--ns-ease),background-color_160ms] data-checked:translate-x-[calc(var(--ns-switch-w)-22px)] data-checked:bg-[var(--ns-panel)]" />
    </Base.Root>
  );
  if (!children) return track;
  return (
    <label data-slot="switch-label" className="inline-flex cursor-pointer items-center gap-2.5 text-[var(--ns-ink)] has-data-disabled:cursor-default">
      {track}
      <span className="min-w-0">{children}</span>
    </label>
  );
}

export { Switch, type SwitchProps };
