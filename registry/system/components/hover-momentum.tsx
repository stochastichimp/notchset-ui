// Notchset hover-momentum 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Hover momentum: a card that shows its recent activity only when you ask. At rest it's just the card; on hover or
 * keyboard focus it grows a small bar chart of the last days (one bar per day, the newest strongest) with its one
 * line of meaning ("6 touches in 14 days"), and folds away when you leave. Nothing new at rest, nothing to
 * dismiss. The card itself is the focus target, so the chart is one Tab away; on touch, a tap focuses it.
 *
 *   <HoverMomentum label="Raycast" values={touchesByDay} summary="6 touches in 14 days, 2 this week">
 *     <DealCardBody … />
 *   </HoverMomentum>
 */
type HoverMomentumProps = {
  /** one value per day, oldest first */
  values: number[];
  /** what the card is, for screen readers ("Raycast deal") */
  label: string;
  /** the chart's meaning in words */
  summary: string;
  /** what the first and last bars stand for; by default the last bar is today and the first is as many days back as
      there are bars after it ("13 days ago" for 14 values, "4 days ago" for 5) */
  range?: [string, string] | undefined;
  children: React.ReactNode;
  className?: string | undefined;
};

const daysAgo = (n: number) => (n <= 0 ? "Today" : n === 1 ? "Yesterday" : `${n} days ago`);

function HoverMomentum({ values, label, summary, range: given, children, className }: HoverMomentumProps) {
  const hi = Math.max(...values, 1);
  /* one bar is only today, and no bars have no span to name */
  const range: [string, string] | null = given ?? (values.length > 1 ? [daysAgo(values.length - 1), "Today"] : values.length ? ["Today", ""] : null);
  return (
    <div
      data-slot="hover-momentum"
      tabIndex={0}
      role="group"
      aria-label={`${label}. ${summary}`}
      className={cn(
        "group/momentum rounded-[var(--ns-radius-lg)] bg-[var(--ns-raised)] p-3 shadow-[var(--ns-bezel)] outline-hidden [transition:box-shadow_var(--ns-time-color)] hover:shadow-[var(--ns-bezel),0_6px_18px_-8px_rgba(0,0,0,.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)]",
        className,
      )}
    >
      {children}
      <div
        aria-hidden
        data-ns-glide=""
        className="grid grid-rows-[0fr] opacity-0 [transition:grid-template-rows_var(--ns-time-menu)_var(--ns-ease),opacity_var(--ns-time-menu)_var(--ns-ease)] group-hover/momentum:grid-rows-[1fr] group-hover/momentum:opacity-100 group-focus/momentum:grid-rows-[1fr] group-focus/momentum:opacity-100"
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-2.5 flex flex-col gap-1.5 border-t border-[var(--ns-line-soft)] pt-2.5">
            <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)]">{summary}</span>
            <span className="flex h-9 items-end gap-[3px]">
              {values.map((v, i) => (
                <i
                  key={i}
                  data-ns-glide=""
                  style={{ height: `${v ? Math.max(14, Math.round((v / hi) * 100)) : 6}%`, transitionDelay: `${i * 12}ms` }}
                  className={cn(
                    "block min-w-0 flex-1 origin-bottom scale-y-50 rounded-[2px] [transition:scale_var(--ns-time-dialog)_var(--ns-ease)] group-hover/momentum:scale-y-100 group-focus/momentum:scale-y-100",
                    v ? (i >= values.length - 3 ? "bg-[var(--ns-ink-2)]" : "bg-[var(--ns-ink-3)] opacity-60") : "bg-[var(--ns-line)]",
                  )}
                />
              ))}
            </span>
            {range && (
              <span className="flex justify-between text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
                <span>{range[0]}</span>
                <span>{range[1]}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { HoverMomentum, type HoverMomentumProps };
