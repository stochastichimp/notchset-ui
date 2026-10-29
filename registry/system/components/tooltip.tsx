// Notchset tooltip 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Tooltip as Base } from "@base-ui/react/tooltip";
import { cn } from "@/lib/utils";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Tooltip: a visual label for something that has no words of its own (an icon button, a collapsed sidebar,
 * cut-off text). Never repeat a label the reader can already see. 350ms the first time, then instant while
 * the pointer scans neighbours (the provider's 400ms window); keyboard focus shows it too. The trigger keeps
 * its own accessible name: the tip is for sighted users only.
 */

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <Base.Provider delay={350} timeout={400}>
      {children}
    </Base.Provider>
  );
}

type TooltipProps = {
  label: React.ReactNode;
  /** The trigger: one element that takes a ref (a Button, an IconButton, a link). */
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right" | undefined;
  /** Controlled open, for a tip that also opens on tap (a disabled control's reason, components/capability.tsx). */
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
};

function Tooltip({ label, children, side = "top", open, onOpenChange, className }: TooltipProps) {
  const portalContainer = usePortalContainer();
  return (
    <Base.Root {...(open !== undefined ? { open } : {})} {...(onOpenChange ? { onOpenChange: (o: boolean) => onOpenChange(o) } : {})}>
      <Base.Trigger render={children} />
      <Base.Portal container={portalContainer}>
        <Base.Positioner side={side} sideOffset={6} collisionPadding={8} className="z-[80]">
          <Base.Popup
            data-slot="tooltip"
            data-ns-layer=""
            className={cn(
              "pointer-events-none max-w-[260px] rounded-[7px] bg-[var(--ns-ink)] px-2 py-[5px] font-[family-name:var(--ns-font-body)] text-[length:var(--ns-text-meta)] leading-[1.35] font-[number:var(--ns-weight-medium)] text-[var(--ns-canvas)] shadow-[var(--ns-shadow-float)]",
              "[transition:opacity_120ms,transform_120ms_var(--ns-ease)] data-starting-style:opacity-0 data-ending-style:opacity-0 data-[side=top]:data-starting-style:translate-y-0.5 data-[side=bottom]:data-starting-style:-translate-y-0.5 data-instant:transition-none",
              className,
            )}
          >
            {label}
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

export { Tooltip, TooltipProvider, type TooltipProps };
