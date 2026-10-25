// Notchset segmented-control 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { cn } from "@/lib/utils";

/*
 * Segmented control: two to five views or modes of the same thing (List | Board, This quarter | This year).
 * The chosen one is raised on a recessed well; one is always chosen, so pressing it again does nothing.
 * Arrow keys move between options. A count can sit beside a label.
 */
type Option<V extends string> = { value: V; label: React.ReactNode; count?: number | undefined; icon?: React.ReactNode };
type SegmentedControlProps<V extends string> = {
  options: Option<V>[];
  value: V;
  onValueChange: (value: V) => void;
  /** Names the group for screen readers ("View"). */
  label: string;
  size?: "default" | "sm" | undefined;
  className?: string | undefined;
};

function SegmentedControl<V extends string>({ options, value, onValueChange, label, size = "default", className }: SegmentedControlProps<V>) {
  return (
    <ToggleGroup
      data-slot="segmented-control"
      aria-label={label}
      value={[value]}
      onValueChange={(next) => {
        if (next[0]) onValueChange(next[0] as V);
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-[9px] bg-[var(--ns-well)] shadow-[inset_0_0_0_1px_var(--ns-line)]",
        size === "sm" ? "p-0.5" : "p-[3px]",
        className,
      )}
    >
      {options.map((o) => (
        <Toggle
          key={o.value}
          value={o.value}
          className={cn(
            "inline-flex h-[var(--ns-segment)] cursor-pointer items-center gap-1.5 rounded-[var(--ns-radius)] font-[family-name:var(--ns-font-body)] text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] whitespace-nowrap text-[var(--ns-ink-3)] outline-hidden [transition:background-color_var(--ns-time-color),color_var(--ns-time-color),box-shadow_var(--ns-time-color)]",
            "hover:text-[var(--ns-ink-2)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ns-signal)] data-pressed:bg-[var(--ns-raised)] data-pressed:text-[var(--ns-ink)] data-pressed:shadow-[var(--ns-bezel)] [&_svg]:size-3.5",
            size === "sm" ? "px-2" : "px-[11px]",
          )}
        >
          {o.icon}
          {o.label}
          {o.count !== undefined && <span className="font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">{o.count}</span>}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

export { SegmentedControl, type SegmentedControlProps };
