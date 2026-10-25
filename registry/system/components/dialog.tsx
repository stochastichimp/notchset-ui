// Notchset dialog 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Dialog as Base } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReturnFocus } from "@/lib/notchset/return-focus";
import { Button } from "@/components/ui/notchset/button";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Dialog: one focused step that needs an answer before you go on (New deal, Cancel plan). A title that says
 * the step, a line that says what happens, the form, then Cancel and the one verb, rightmost. A dangerous verb
 * says what it destroys ("Delete Dropbox") and is red. On a phone it rises from the bottom as a sheet, in
 * thumb reach. Focus starts in the first field, stays inside, and returns to what opened it. It is a form: Enter
 * in a field runs the verb (unless the field used Enter itself, like an open list), and Ctrl/⌘ Enter runs it from
 * anywhere, a long message included. A red verb never runs on a plain Enter: it takes a press, or Ctrl/⌘ Enter.
 */
type Verb = { label: string; onClick: () => void; danger?: boolean | undefined; disabled?: boolean | undefined; busy?: boolean | undefined; busyLabel?: string | undefined };
type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  verb?: Verb | undefined;
  /** Hide Cancel when the step has its own way back (a two-step flow). */
  noCancel?: boolean | undefined;
  /** Words or a link at the left of the footer ("Sent from ana@northwind.com"). */
  footNote?: React.ReactNode;
  size?: "sm" | "md" | "lg" | undefined;
  className?: string | undefined;
};

const widths = { sm: "w-[min(var(--ns-dialog-sm),calc(100vw-32px))]", md: "w-[min(var(--ns-dialog),calc(100vw-32px))]", lg: "w-[min(var(--ns-dialog-lg),calc(100vw-32px))]" } as const;

export const scrim =
  "fixed inset-0 z-40 bg-[rgba(10,10,14,.32)] [animation:ns-fade_200ms_ease] data-ending-style:opacity-0 data-ending-style:[transition:opacity_180ms_ease]";

/** Enter that belongs to the form, not to a field that handles it (a picker, a list that is open, a textarea). */
function submits(e: React.KeyboardEvent, danger: boolean) {
  if (e.key !== "Enter" || e.defaultPrevented || e.nativeEvent.isComposing || e.shiftKey || e.altKey) return false;
  if (e.metaKey || e.ctrlKey) return true;
  if (danger) return false;
  const t = e.target as HTMLElement;
  return t instanceof HTMLInputElement && !["checkbox", "radio", "button", "submit", "file"].includes(t.type) && t.getAttribute("aria-expanded") !== "true";
}

function Dialog({ open, onOpenChange, title, description, children, verb, noCancel, footNote, size = "md", className }: DialogProps) {
  const portalContainer = usePortalContainer();
  const returnFocus = useReturnFocus();
  const body = React.useRef<HTMLDivElement>(null);
  return (
    <Base.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <Base.Portal container={portalContainer}>
        <Base.Backdrop className={scrim} />
        <Base.Popup
          data-slot="dialog"
          data-ns-layer=""
          finalFocus={returnFocus}
          /* the first field takes focus, so typing starts at once and Enter submits; never the × */
          initialFocus={() => body.current?.querySelector<HTMLElement>("input:not([type=hidden]):not([disabled]):not([type=checkbox]):not([type=radio]),textarea:not([disabled]),[role=combobox],select:not([disabled])") ?? true}
          data-ns-moves=""
          className={cn(
            "fixed top-[14vh] left-1/2 z-[41] flex max-h-[76vh] -translate-x-1/2 flex-col rounded-[var(--ns-radius-xl)] bg-[var(--ns-panel)] text-[var(--ns-ink)] shadow-[0_0_0_1px_var(--ns-line),var(--ns-shadow-dialog)] outline-hidden",
            "[animation:ns-dialog-in_var(--ns-time-dialog)_var(--ns-ease)] data-ending-style:opacity-0 data-ending-style:[transition:opacity_160ms_ease]",
            "max-[600px]:top-auto max-[600px]:bottom-0 max-[600px]:left-0 max-[600px]:max-h-[88dvh] max-[600px]:w-full max-[600px]:translate-x-0 max-[600px]:rounded-[18px_18px_0_0] max-[600px]:pb-[env(safe-area-inset-bottom,0px)] max-[600px]:[animation:ns-sheet-up_280ms_var(--ns-ease-panel)] max-[600px]:data-ending-style:[animation:ns-sheet-down_200ms_var(--ns-ease)_forwards]",
            widths[size],
            className,
          )}
        >
          <div className="relative flex flex-col gap-1 border-b border-[var(--ns-line-soft)] pt-[18px] pr-12 pb-3.5 pl-[18px]">
            {/* × closes, as Esc and Cancel do; a phone sheet has no Esc key, so it needs one where the eye looks first */}
            <Base.Close
              aria-label="Close"
              className="absolute top-3 right-3 grid size-8 cursor-pointer place-items-center rounded-[var(--ns-radius)] text-[var(--ns-ink-3)] outline-hidden [transition:background-color_var(--ns-time-color)] hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] pointer-coarse:size-10"
            >
              <X className="size-4" aria-hidden />
            </Base.Close>
            <Base.Title className="m-0 font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-title)] leading-tight font-[number:var(--ns-weight-strong)]">{title}</Base.Title>
            {description && <Base.Description className="m-0 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">{description}</Base.Description>}
          </div>
          <form
            noValidate
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              if (verb && !verb.disabled && !verb.busy) verb.onClick();
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || !verb) return;
              const go = submits(e, !!verb.danger);
              /* a plain Enter never submits natively: only the cases above do, once */
              if (e.target instanceof HTMLInputElement) e.preventDefault();
              if (!go) return;
              e.preventDefault();
              if (!verb.disabled && !verb.busy) verb.onClick();
            }}
          >
            {children && <div ref={body} className="min-h-0 overflow-auto overscroll-contain px-[18px] py-4">{children}</div>}
            {(verb || !noCancel) && (
              <div className="flex items-center justify-end gap-2 border-t border-[var(--ns-line-soft)] px-[18px] py-3 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] [&_button]:min-w-24">
                {footNote && <span className="mr-auto min-w-0">{footNote}</span>}
                {!noCancel && <Base.Close render={<Button>Cancel</Button>} />}
                {verb && (
                  <Button type="submit" variant={verb.danger ? "danger" : "primary"} disabled={verb.disabled} busy={verb.busy}>
                    {verb.busy ? (verb.busyLabel ?? verb.label) : verb.label}
                  </Button>
                )}
              </div>
            )}
          </form>
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}

export { Dialog, type DialogProps };
