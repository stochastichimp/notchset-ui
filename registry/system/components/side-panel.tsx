// Notchset side-panel 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Dialog as Base } from "@base-ui/react/dialog";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReturnFocus } from "@/lib/notchset/return-focus";
import { BackButton } from "@/components/ui/notchset/breadcrumb";
import { IconButton } from "@/components/ui/notchset/icon-button";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Side panel: a record opened beside the list it came from, so you can work through a list without losing
 * your place. It is not modal: the list stays usable, and opening another row swaps the panel's record. J and
 * K (or the arrows in its header) step to the next and previous record of the list on screen; Esc closes the
 * whole panel. A mark in the Signature at its top edge ties it to the row it shows. On a phone it takes the whole screen
 * above the tab bar: the header keeps only the kind and the actions (the body opens with the record's name, so
 * nothing is cut short), and the position and arrows go, since the list isn't on screen.
 *
 * Pass `onPrevious`/`onNext` and `position` ("3 of 12") only when the record was opened from a list on screen.
 *
 * Following a link inside the panel (a person's deal) pushes: pass `back` and the header shows "‹ Elena Petrova"
 * instead of the arrows (the record shown is not part of the list on screen). Alt+← and ⌘[ go back too.
 */
type SidePanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** A quiet word before the title ("Company", "Task"). */
  kind?: string | undefined;
  /** Where the record sits in the list on screen ("3 of 12"); quiet, after the kind, not on a phone. */
  position?: string | undefined;
  onPrevious?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
  /** Shown after following a link inside the panel: where Back goes. Hides the list arrows. */
  back?: { label: string; onBack: () => void } | undefined;
  actions?: React.ReactNode;
  /** A wider panel for a record that is written in (a task with its thread): a CSS length, "600px". */
  width?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
};

function SidePanel({ open, onOpenChange, title, kind, position, onPrevious, onNext, back, actions, width, children, className }: SidePanelProps) {
  const portalContainer = usePortalContainer();
  const returnFocus = useReturnFocus();
  React.useEffect(() => {
    if (!open || (!onNext && !onPrevious && !back)) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,select,[contenteditable=true],[role=combobox]")) return;
      if (back && ((e.altKey && e.key === "ArrowLeft") || (e.metaKey && e.key === "["))) {
        e.preventDefault();
        back.onBack();
        return;
      }
      /* in a followed record the list arrows are hidden, so J/K do nothing either; Back is the way out */
      if (e.metaKey || e.ctrlKey || e.altKey || back) return;
      const step = e.key === "j" ? onNext : e.key === "k" ? onPrevious : undefined;
      if (!step) return;
      e.preventDefault();
      step();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onNext, onPrevious, back]);

  return (
    <Base.Root open={open} onOpenChange={(o) => onOpenChange(o)} modal={false} disablePointerDismissal>
      <Base.Portal container={portalContainer}>
        <Base.Popup
          data-slot="side-panel"
          data-ns-layer=""
          finalFocus={returnFocus}
          data-ns-moves=""
          style={width ? ({ "--ns-panel-w": width } as React.CSSProperties) : undefined}
          className={cn(
            "fixed top-0 right-0 bottom-0 z-20 flex w-[min(var(--ns-panel-w),100vw)] flex-col bg-[var(--ns-sheet)] text-[var(--ns-ink)] shadow-[-24px_0_48px_-24px_rgba(0,0,0,.28),-1px_0_0_var(--ns-line)] outline-hidden",
            "[animation:ns-panel-in_var(--ns-time-panel)_var(--ns-ease-panel)] data-ending-style:opacity-0 data-ending-style:[transition:opacity_180ms_var(--ns-ease)] max-[600px]:w-full",
            className,
          )}
        >
          <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[var(--ns-line)] pr-3 pl-4">
            {back && <BackButton label={back.label} onClick={back.onBack} className="ml-[-8px] shrink-0" />}
            <Base.Title className="m-0 flex min-w-0 flex-1 items-baseline gap-2 truncate text-[length:var(--ns-text-strong)] font-[number:var(--ns-weight-strong)]">
              {kind && <span className="shrink-0 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-3)]">{kind}</span>}
              {position && <span className="shrink-0 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)] tabular-nums max-[600px]:hidden">{position}</span>}
              <span className={cn("truncate", kind && "max-[600px]:sr-only")}>{title}</span>
            </Base.Title>
            {actions}
            {!back && onPrevious && (
              <IconButton label="Previous (K)" size="sm" variant="ghost" onClick={onPrevious} className="max-[600px]:hidden">
                <ChevronUp />
              </IconButton>
            )}
            {!back && onNext && (
              <IconButton label="Next (J)" size="sm" variant="ghost" onClick={onNext} className="max-[600px]:hidden">
                <ChevronDown />
              </IconButton>
            )}
            <Base.Close render={<IconButton label="Close (Esc)" size="sm" variant="ghost"><X /></IconButton>} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto overscroll-contain px-[18px] pt-5 pb-8 max-[600px]:pb-[calc(96px+env(safe-area-inset-bottom,0px))]">{children}</div>
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}

export { SidePanel, type SidePanelProps };
