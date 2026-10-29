// Notchset property-pill 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Property pill: one property of a record as a small control (a status, who it's for, a due date, a priority, its
 * labels) that opens the picker the host gives it. It shows the value with its mark, or what it would hold in a
 * quieter tone when empty ("Due date"); `tone="bad"` says the value is a problem (overdue) in the error colour. It
 * takes a ref and passes its props through, so it can be a Menu's or a Popover's trigger. Its accessible name says
 * the property and its value.
 *
 *   <Menu trigger={<PropertyPill kind="Priority" icon={<PriorityMark priority={3} />}>High</PropertyPill>}>…</Menu>
 */
type PropertyPillProps = Omit<React.ComponentPropsWithoutRef<"button">, "children"> & {
  /** what the property is ("Status", "Assignee"), read with its value */
  kind: string;
  icon?: React.ReactNode;
  /** the value in words; nothing shows `empty` instead */
  children?: React.ReactNode;
  empty?: string | undefined;
  tone?: "bad" | undefined;
};

const PropertyPill = React.forwardRef<HTMLButtonElement, PropertyPillProps>(function PropertyPill({ kind, icon, children, empty, tone, className, ...props }, ref) {
  const has = children != null && children !== "" && children !== false;
  const words = has ? (typeof children === "string" ? children : undefined) : empty;
  return (
    <button
      ref={ref}
      type="button"
      data-slot="property-pill"
      aria-label={words ? `${kind}: ${words}` : undefined}
      {...props}
      className={cn(
        "inline-flex h-6 max-w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[var(--ns-raised)] px-2 text-[length:var(--ns-text-body)] whitespace-nowrap text-[var(--ns-ink)] shadow-[var(--ns-bezel)] outline-hidden [transition:background-color_var(--ns-time-color)] hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] data-popup-open:bg-[var(--ns-selected)] pointer-coarse:h-9 max-[960px]:h-9 [&_svg]:size-3.5 [&_svg]:shrink-0",
        tone === "bad" && "text-[var(--ns-bad-ink)] [&_svg]:text-[var(--ns-bad-ink)]",
        className,
      )}
    >
      {icon}
      <span className={cn("min-w-0 truncate", !has && "text-[var(--ns-ink-3)]")}>{has ? children : empty}</span>
    </button>
  );
});

export { PropertyPill, type PropertyPillProps };
