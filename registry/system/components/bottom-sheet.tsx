// Notchset bottom-sheet 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Drawer } from "@base-ui/react/drawer";
import { cn } from "@/lib/utils";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Bottom sheet: a phone's place for a short set of choices or a small form (More, account, quick add). It
 * rises from the bottom in thumb reach, has a grab handle, and closes by swiping down, tapping outside or Esc.
 * On a desktop, use a Menu or Dialog instead: the sheet is a phone shape.
 */
type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** Hide the title visually when the content already names itself (it is still read out). */
  hideTitle?: boolean | undefined;
  children: React.ReactNode;
  className?: string | undefined;
};

function BottomSheet({ open, onOpenChange, title, hideTitle, children, className }: BottomSheetProps) {
  const portalContainer = usePortalContainer();
  return (
    <Drawer.Root open={open} onOpenChange={(o) => onOpenChange(o)} swipeDirection="down">
      <Drawer.Portal container={portalContainer}>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-[rgba(10,10,14,.32)] opacity-[calc(1-var(--drawer-swipe-progress,0))] [transition:opacity_300ms_var(--ns-ease-panel)] data-starting-style:opacity-0 data-ending-style:opacity-0 data-swiping:duration-0" />
        <Drawer.Viewport className="fixed inset-0 z-[41] flex items-end justify-center">
          <Drawer.Popup
            data-slot="bottom-sheet"
            data-ns-layer=""
            className={cn(
              "max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-[18px_18px_0_0] bg-[var(--ns-panel)] px-1.5 pt-3.5 pb-[calc(8px+env(safe-area-inset-bottom,0px))] text-[var(--ns-ink)] shadow-[0_0_0_1px_var(--ns-line),var(--ns-shadow-dialog)] outline-hidden",
              "[transform:translateY(var(--drawer-swipe-movement-y,0px))] [transition:transform_300ms_var(--ns-ease-panel)] data-starting-style:[transform:translateY(100%)] data-ending-style:[transform:translateY(100%)] data-swiping:select-none data-swiping:duration-0",
              "min-[600px]:max-w-[480px]",
              className,
            )}
          >
            <div aria-hidden className="mx-auto mb-2 h-1 w-9 rounded-full bg-[var(--ns-line)]" />
            <Drawer.Content>
              <Drawer.Title className={cn("m-0 px-2.5 pb-2 font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-strong)] font-[number:var(--ns-weight-strong)]", hideTitle && "sr-only")}>{title}</Drawer.Title>
              {children}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** A finger-sized row in a sheet. */
function SheetItem({ icon, children, danger, onClick }: { icon?: React.ReactNode; children: React.ReactNode; danger?: boolean | undefined; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[10px] px-2.5 text-left text-[15px] text-[var(--ns-ink)] outline-hidden hover:bg-[var(--ns-hover)] focus-visible:bg-[var(--ns-hover)] [&_svg]:size-[18px] [&_svg]:text-[var(--ns-ink-3)]",
        danger && "text-[var(--ns-bad-ink)] [&_svg]:text-[var(--ns-bad-ink)]",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export { BottomSheet, SheetItem, type BottomSheetProps };
