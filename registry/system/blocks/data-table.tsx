// Notchset data-table 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/notchset/checkbox";
import { SortableHeader } from "@/components/ui/notchset/sortable-header";

/*
 * Data table (block 12): a list of records with a sticky header, every column sortable its natural way first,
 * rows that open on press, optional selection (Shift-click selects a run), and a keyboard row (J/K moves it,
 * Enter opens, X selects; the page binds the keys and passes activeIndex). Cells that hold their own control
 * (a stage menu, an owner menu) stop the row from opening. A selected row is washed with an edge in the Signature.
 * On a phone the selection column (unless phoneSelect) and any hideOnPhone column drop out, and the first and last columns left
 * keep the page gutter.
 */
export type Column<R> = {
  key: string;
  label: string;
  align?: "start" | "end" | undefined;
  /** Shown with the sort hint on the header ("Sort by close · …"). */
  hint?: string | undefined;
  sortable?: boolean | undefined;
  /** Takes the leftover width (a long text column); others fit their content. */
  grow?: boolean | undefined;
  /** Hidden on a phone, where a table becomes a calm list: who, its status, its value. */
  hideOnPhone?: boolean | undefined;
  /** Also hidden at tablet width (960px and under), when the row's name needs the room. */
  hideOnTablet?: boolean | undefined;
  /** Row actions (Retire, Approve): shown on the row's hover or focus where a pointer can hover, always on touch. */
  reveal?: boolean | undefined;
  cell: (row: R) => React.ReactNode;
  className?: string | undefined;
};
type DataTableProps<R> = {
  rows: R[];
  rowKey: (row: R) => string;
  rowLabel: (row: R) => string;
  columns: Column<R>[];
  sort?: { key: string; direction: "ascending" | "descending" } | undefined;
  onSort?: ((key: string) => void) | undefined;
  selected?: Set<string> | undefined;
  onSelect?: ((id: string, index: number, range: boolean) => void) | undefined;
  onSelectAll?: (() => void) | undefined;
  /** Keep the checkboxes on a phone, for a list whose job is acting on several rows at once (approvals). */
  phoneSelect?: boolean | undefined;
  onOpen?: ((row: R) => void) | undefined;
  activeIndex?: number | undefined;
  empty?: React.ReactNode;
  className?: string | undefined;
};

const cellPad = "px-3.5 first:pl-[var(--ns-gutter)] last:pr-[var(--ns-gutter)]";

function DataTable<R>({ rows, rowKey, rowLabel, columns, sort, onSort, selected, onSelect, onSelectAll, phoneSelect, onOpen, activeIndex, empty, className }: DataTableProps<R>) {
  const activeRow = React.useRef<HTMLTableRowElement>(null);
  React.useEffect(() => {
    activeRow.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);
  if (!rows.length) return <>{empty}</>;
  const all = !!selected && rows.every((r) => selected.has(rowKey(r)));
  const some = !!selected && !all && rows.some((r) => selected.has(rowKey(r)));
  const shown = columns.filter((c) => !c.hideOnPhone);
  /* on a phone the column at either end owns the gutter, whichever columns are left */
  /* the column that takes spare width; when it's hidden on a phone the first column left takes it, so a long
     subtitle truncates instead of pushing the last column into the screen's edge */
  const phoneGrow = shown.some((c) => c.grow) ? undefined : shown[0];
  const edge = (c: Column<R>) => cn(c === phoneGrow && "max-[600px]:w-full max-[600px]:max-w-0", c.hideOnPhone && "max-[600px]:hidden", c.hideOnTablet && "max-[960px]:hidden", c === shown[0] && !phoneSelect && "max-[600px]:pl-[var(--ns-gutter)]", c === shown.at(-1) && "max-[600px]:pr-[var(--ns-gutter)]");
  return (
    <table data-slot="data-table" className={cn("w-full border-separate border-spacing-0 text-[length:var(--ns-text-body)]", className)}>
      <thead>
        <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-[1] [&>th]:h-10 [&>th]:border-t [&>th]:border-[var(--ns-line)] [&>th]:bg-[var(--ns-panel)] [&>th]:text-start [&>th]:text-[length:var(--ns-text-meta)] [&>th]:font-[number:var(--ns-weight-medium)] [&>th]:whitespace-nowrap [&>th]:text-[var(--ns-ink-3)] [&>th]:shadow-[inset_0_-1px_0_var(--ns-line-soft)]">
          {selected && (
            <th className={cn("w-[46px] pr-0 pl-[var(--ns-gutter)]", !phoneSelect && "max-[600px]:hidden")}>
              <Checkbox aria-label="Select all" checked={all} indeterminate={some} onCheckedChange={() => onSelectAll?.()} />
            </th>
          )}
          {columns.map((c) =>
            /* a column with no name (row actions) has nothing to sort by */
            c.sortable !== false && c.label && onSort ? (
              <SortableHeader
                key={c.key}
                label={c.label}
                align={c.align}
                title={c.hint ? `Sort by ${c.label.toLowerCase()} · ${c.hint}` : `Sort by ${c.label.toLowerCase()}`}
                direction={sort?.key === c.key ? sort.direction : null}
                onSort={() => onSort(c.key)}
                className={cn(cellPad, edge(c))}
              />
            ) : (
              <th key={c.key} className={cn(cellPad, c.align === "end" && "text-end!", edge(c))}>
                {/* laid out as a sortable header's label is, so every header in the row shares one baseline */}
                <span className="-my-0.5 inline-flex items-center py-0.5 align-middle">{c.label}</span>
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const id = rowKey(r);
          const isSel = !!selected?.has(id);
          return (
            <tr
              key={id}
              ref={i === activeIndex ? activeRow : undefined}
              data-row={id}
              data-active={i === activeIndex || undefined}
              aria-selected={selected ? isSel : undefined}
              onClick={(e) => {
                /* a press inside a popup a cell opened (portaled out of the row, like an inline Deny) reaches the row
                   through React, not the page: it never opens the row */
                if (!e.currentTarget.contains(e.target as Node)) return;
                if ((e.target as HTMLElement).closest("button,a,input,[role=checkbox],[data-cell-control]")) return;
                onOpen?.(r);
              }}
              className={cn(
                "group/row",
                "group [&>td]:h-[46px] [&>td]:border-b [&>td]:border-[var(--ns-line-soft)] [&>td]:whitespace-nowrap [&>td]:text-[var(--ns-ink-2)] [&>td]:[transition:background-color_var(--ns-time-color)]",
                onOpen && "cursor-pointer hover:[&>td]:bg-[var(--ns-hover)]",
                isSel && "[&>td]:bg-[var(--ns-selected)] hover:[&>td]:bg-[var(--ns-selected)] [&>td:first-child]:shadow-[inset_2px_0_0_var(--ns-signal)]",
                i === activeIndex && !isSel && "[&>td]:bg-[var(--ns-hover)] [&>td:first-child]:shadow-[inset_2px_0_0_var(--ns-ink-3)]",
              )}
            >
              {selected && (
                <td className={cn("w-[46px] pr-0 pl-[var(--ns-gutter)]", !phoneSelect && "max-[600px]:hidden")} onMouseDown={(e) => e.shiftKey && e.preventDefault() /* Shift-click selects a run of rows, not their text */}>
                  <Checkbox
                    aria-label={`Select ${rowLabel(r)}`}
                    checked={isSel}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelect?.(id, i, e.shiftKey);
                    }}
                  />
                </td>
              )}
              {columns.map((c) => (
                <td key={c.key} className={cn(cellPad, c.align === "end" && "text-end", c.grow && "w-full max-w-0", edge(c), c.reveal && "[@media(hover:hover)]:[&>*]:opacity-0 [@media(hover:hover)]:group-hover/row:[&>*]:opacity-100 [@media(hover:hover)]:group-focus-within/row:[&>*]:opacity-100 [@media(hover:hover)]:group-aria-selected/row:[&>*]:opacity-100 [@media(hover:hover)]:has-[[data-popup-open]]:[&>*]:opacity-100", c.className)}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export { DataTable, type DataTableProps };
