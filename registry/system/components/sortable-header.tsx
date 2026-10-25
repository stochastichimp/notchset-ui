// Notchset sortable-header 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { ArrowDown, ArrowDownUp, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Sortable header: a table column you can sort by. Press to sort by it; press again to flip. Each column has a
 * natural first direction (names A to Z, money high to low), so the first press gives the useful order. The
 * arrow shows on the sorted column, and on others only on hover or focus. The th carries aria-sort.
 */
type SortableHeaderProps = Omit<React.ComponentPropsWithoutRef<"th">, "onClick" | "align"> & {
  label: string;
  /** This column's current sort, or null when the table is sorted by another column. */
  direction: "ascending" | "descending" | null;
  onSort: () => void;
  align?: "start" | "end" | undefined;
};

function SortableHeader({ label, direction, onSort, align = "start", className, ...props }: SortableHeaderProps) {
  const Arrow = direction === "ascending" ? ArrowUp : direction === "descending" ? ArrowDown : ArrowDownUp;
  return (
    <th aria-sort={direction ?? "none"} data-slot="sortable-header" className={cn(align === "end" && "text-end!", className)} {...props}>
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "group -mx-1 -my-0.5 inline-flex cursor-pointer items-center gap-1 align-middle rounded-[6px] px-1 py-0.5 [font:inherit] text-inherit outline-hidden hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]",
          direction && "text-[var(--ns-ink)]",
          align === "end" && "flex-row-reverse",
        )}
      >
        {label}
        <Arrow
          aria-hidden
          className={cn("size-3 text-[var(--ns-ink-3)] [transition:opacity_var(--ns-time-color)]", direction ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}
        />
      </button>
    </th>
  );
}

export { SortableHeader, type SortableHeaderProps };
