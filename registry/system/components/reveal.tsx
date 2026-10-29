// Notchset reveal 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Reveal: a row your action adds or removes (Cc and Bcc, a discount line, who joins a thread) grows into place
 * and folds away instead of popping, so what's below moves smoothly and your eye keeps its place. It animates
 * only when `open` changes after mount: a row that's there when the page arrives is simply there. Reduced motion
 * swaps instantly. Closed content stays mounted but inert: out of the tab order and hidden from screen readers.
 */
type RevealProps = { open: boolean; children: React.ReactNode; className?: string | undefined };

function Reveal({ open, children, className }: RevealProps) {
  /* CSS alone: a transition only runs when `open` changes, never on the first paint, and a closed row is inert */
  return (
    <div
      data-slot="reveal"
      data-ns-glide=""
      data-open={open || undefined}
      aria-hidden={!open || undefined}
      // inert as a property, not a JSX attribute: React 18 neither types nor passes `inert`.
      ref={(el) => {
        if (el) el.inert = !open;
      }}
      className={cn(
        "grid [transition:grid-template-rows_var(--ns-time-dialog)_var(--ns-ease),opacity_var(--ns-time-dialog)_var(--ns-ease)]",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export { Reveal, type RevealProps };
