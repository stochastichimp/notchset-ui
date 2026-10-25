// Notchset empty-state 2.0.0 · https://notchset.dev/changelog
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Empty state: what goes here and the one way to fill it. A page-sized one centres a title, a line and an
 * action; size="inline" is the quiet line inside a section ("No notes yet").
 */
type EmptyStateProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  size?: "page" | "inline" | undefined;
};

function EmptyState({ title, icon, action, size = "page", className, children, ...props }: EmptyStateProps) {
  if (size === "inline") {
    return (
      <div data-slot="empty-state" data-size="inline" className={cn("py-2.5 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]", className)} {...props}>
        {children ?? title}
      </div>
    );
  }
  return (
    <div
      data-slot="empty-state"
      className={cn("flex flex-col items-center gap-2 px-6 py-[72px] text-center text-[var(--ns-ink-3)] [&>svg]:size-5", className)}
      {...props}
    >
      {icon}
      {title && <b className="font-[family-name:var(--ns-font-display)] text-[15px] font-[number:var(--ns-weight-strong)] text-[var(--ns-ink)]">{title}</b>}
      {children && <p className="m-0 max-w-[42ch]">{children}</p>}
      {action && <div className="mt-2 flex gap-2">{action}</div>}
    </div>
  );
}

export { EmptyState, type EmptyStateProps };
