// Notchset chip 2.0.0 · https://notchset.dev/changelog
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Chip: one applied filter or picked value, raised like a button, with its own remove. The remove button says
 * what it removes ("Remove Owner: Ana"), so a list of chips reads clearly to a screen reader.
 */
type ChipProps = React.ComponentPropsWithoutRef<"span"> & {
  onRemove?: (() => void) | undefined;
  /** What the remove button says; defaults to "Remove" plus the chip's text when that is a string. */
  removeLabel?: string | undefined;
};

function Chip({ onRemove, removeLabel, className, children, ...props }: ChipProps) {
  const label = removeLabel ?? (typeof children === "string" ? `Remove ${children}` : "Remove");
  return (
    <span
      data-slot="chip"
      className={cn(
        "inline-flex h-[var(--ns-chip)] shrink-0 items-center gap-1.5 rounded-[7px] bg-[var(--ns-raised)] pl-2.5 font-[family-name:var(--ns-font-body)] text-[length:var(--ns-text-small)] leading-none font-[number:var(--ns-weight-medium)] whitespace-nowrap text-[var(--ns-ink)] shadow-[var(--ns-bezel)]",
        onRemove ? "pr-1" : "pr-2.5",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label={label}
          onClick={onRemove}
          className="grid size-[calc(var(--ns-chip)-2px)] cursor-pointer place-items-center rounded-[5px] text-[var(--ns-ink-3)] outline-hidden [transition:background-color_var(--ns-time-color),color_var(--ns-time-color)] hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </span>
  );
}

export { Chip, type ChipProps };
