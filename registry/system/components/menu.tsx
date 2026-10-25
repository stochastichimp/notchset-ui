// Notchset menu 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Menu as Base } from "@base-ui/react/menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { KeyboardHint } from "@/components/ui/notchset/keyboard-hint";
import { popupItem, popupPositioner, popupSurface } from "@/lib/notchset/popup";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Menu: the actions for a thing, opened from a button (⋯, a row's menu, the account). Same surface as every
 * popup: drops below, a bottom sheet on a phone. Items carry an icon, the shortcut the app binds, and danger in
 * words and colour for the one destructive step. Group labels name a set; separators split sets.
 */
type MenuProps = {
  /** The button that opens it: one element that takes a ref. */
  trigger: React.ReactElement;
  children: React.ReactNode;
  align?: "start" | "center" | "end" | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
};

function Menu({ trigger, children, align = "start", open, onOpenChange, className }: MenuProps) {
  const portalContainer = usePortalContainer();
  return (
    <Base.Root open={open} onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}>
      <Base.Trigger render={trigger} />
      <Base.Portal container={portalContainer}>
        <Base.Positioner align={align} sideOffset={4} collisionPadding={8} className={popupPositioner}>
          <Base.Popup data-slot="menu" data-ns-layer="" data-ns-moves="" className={cn(popupSurface, className)}>
            {children}
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

type MenuItemProps = Omit<React.ComponentPropsWithoutRef<typeof Base.Item>, "className"> & {
  icon?: React.ReactNode;
  /** A shortcut the app binds ("E", "⌘⌫"); printed on the right. */
  shortcut?: string | undefined;
  danger?: boolean | undefined;
  className?: string | undefined;
};

function MenuItem({ icon, shortcut, danger, className, children, ...props }: MenuItemProps) {
  return (
    <Base.Item data-slot="menu-item" className={cn(popupItem, danger && "text-[var(--ns-bad-ink)] [&_svg]:text-[var(--ns-bad-ink)]", className)} {...props}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <KeyboardHint keys={shortcut} className="ml-auto pl-3" />}
    </Base.Item>
  );
}

type MenuCheckboxItemProps = Omit<React.ComponentPropsWithoutRef<typeof Base.CheckboxItem>, "className"> & {
  icon?: React.ReactNode;
  className?: string | undefined;
};

function MenuCheckboxItem({ icon, className, children, ...props }: MenuCheckboxItemProps) {
  return (
    <Base.CheckboxItem data-slot="menu-checkbox-item" className={cn(popupItem, className)} {...props}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <Base.CheckboxItemIndicator className="ml-2 text-[var(--ns-ink)]">
        <Check />
      </Base.CheckboxItemIndicator>
    </Base.CheckboxItem>
  );
}

function MenuGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Base.Group>
      <Base.GroupLabel className="px-[9px] pt-[7px] pb-[5px] text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-3)]">{label}</Base.GroupLabel>
      {children}
    </Base.Group>
  );
}

function MenuSeparator() {
  return <Base.Separator className="mx-[-5px] my-[5px] h-px bg-[var(--ns-line-soft)]" />;
}

export { Menu, MenuCheckboxItem, MenuGroup, MenuItem, MenuSeparator, type MenuItemProps, type MenuProps };
