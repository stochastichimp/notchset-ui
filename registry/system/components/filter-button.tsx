// Notchset filter-button 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Menu, MenuCheckboxItem, MenuItem, MenuSeparator } from "@/components/ui/notchset/menu";

/*
 * Filter button: one facet of a list (Stage, Owner). Unused, it is a dashed outline that says "you can narrow
 * this"; once something is picked it turns solid and counts the picks. It opens a menu of checkable options
 * that stays open while you tick several, with Clear at the bottom. The picks also show as chips under the bar.
 * Options can carry a count (how many rows the pick would leave); a menu with no options says so.
 */
type FilterOption = { value: string; label: string; icon?: React.ReactNode; count?: number };
type FilterButtonProps = {
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  className?: string | undefined;
};

function FilterButton({ label, icon, options, value, onValueChange, className }: FilterButtonProps) {
  const on = value.length > 0;
  return (
    <Menu
      trigger={
        <button
          type="button"
          data-slot="filter-button"
          data-active={on || undefined}
          aria-label={on ? `${label}: ${value.length} selected` : label}
          className={cn(
            "inline-flex h-[var(--ns-control-sm)] shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--ns-radius)] border border-dashed border-[color-mix(in_oklab,var(--ns-ink-3)_45%,transparent)] bg-transparent px-[9px] text-[length:var(--ns-text-body)] text-[var(--ns-ink-2)] outline-hidden [transition:border-color_var(--ns-time-color),color_var(--ns-time-color),background-color_var(--ns-time-color)]",
            "hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] data-popup-open:bg-[var(--ns-hover)] [&_svg]:size-3.5",
            on && "border-solid border-[var(--ns-ink-3)] text-[var(--ns-ink)]",
            className,
          )}
        >
          {icon}
          {label}
          {on && <span className="rounded-[4px] bg-[var(--ns-selected)] px-1 py-px text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] tabular-nums">{value.length}</span>}
        </button>
      }
    >
      {options.length === 0 && <div className="px-[9px] py-2 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">Nothing left with the other filters on</div>}
      {options.map((o) => (
        <MenuCheckboxItem
          key={o.value}
          icon={o.icon}
          closeOnClick={false}
          checked={value.includes(o.value)}
          onCheckedChange={(c) => onValueChange(c ? [...value, o.value] : value.filter((v) => v !== o.value))}
        >
          <span className="flex w-full items-center">
          <span className="min-w-0 truncate">{o.label}</span>
          {o.count !== undefined && <span className="ml-auto pl-3 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">{o.count}</span>}
          </span>
        </MenuCheckboxItem>
      ))}
      {on && (
        <>
          <MenuSeparator />
          <MenuItem onClick={() => onValueChange([])} className="text-[var(--ns-ink-2)]">
            Clear {label.toLowerCase()}
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

export { FilterButton, type FilterButtonProps, type FilterOption };
