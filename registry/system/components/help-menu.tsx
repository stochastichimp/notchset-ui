// Notchset help-menu 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { CircleHelp, LifeBuoy } from "lucide-react";
import { SheetItem } from "@/components/ui/notchset/bottom-sheet";
import { MenuItem } from "@/components/ui/notchset/menu";

/*
 * Help menu: Help lives where people already look for themselves, in the account menu beside Keyboard shortcuts.
 * One config adds "Help" (with F1) and "Contact support"; leave a part unset and its item isn't drawn.
 *
 *   const help: HelpConfig = { url: "https://docs.example.com", support: { email: "help@example.com" } };
 *   useHelpShortcut(help);
 *   <Menu trigger={me}>… <MenuItem>Keyboard shortcuts</MenuItem> <HelpMenuItems help={help} /> <MenuSeparator /> …</Menu>
 *
 * On a phone the account sheet takes HelpSheetItems. Point-of-use explanations are Explain (components/explain.tsx).
 */

export type HelpConfig = {
  /** The help centre, opened in a new tab. */
  url?: string | undefined;
  /** Opens help in the app instead (a panel, a chat); wins over url. */
  onOpen?: (() => void) | undefined;
  /** Where Contact support goes: an address (opens mail) or a page. */
  support?: { email?: string | undefined; url?: string | undefined } | undefined;
  /** The key that opens Help; false binds none. Defaults to F1. */
  shortcut?: "F1" | false | undefined;
};

const open = (url: string) => {
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
};

/** What each item does, or undefined when the config leaves it out. */
export function helpActions(help: HelpConfig | undefined) {
  const openHelp = help?.onOpen ?? (help?.url ? () => open(help.url!) : undefined);
  const s = help?.support;
  const contact = s?.url ? () => open(s.url!) : s?.email ? () => open(`mailto:${s.email}`) : undefined;
  return { openHelp, contact };
}

/** Binds the Help key (F1) while mounted, when help is configured. */
export function useHelpShortcut(help: HelpConfig | undefined) {
  const { openHelp } = helpActions(help);
  const key = help?.shortcut ?? "F1";
  const latest = React.useRef(openHelp);
  React.useEffect(() => {
    latest.current = openHelp;
  });
  const on = !!openHelp && key !== false;
  React.useEffect(() => {
    if (!on) return;
    const down = (e: KeyboardEvent) => {
      if (e.key !== key || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      latest.current?.();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [on, key]);
}

type HelpMenuItemsProps = {
  help: HelpConfig | undefined;
};

/** Help and Contact support, for the account menu; nothing when the config leaves them out. */
function HelpMenuItems({ help }: HelpMenuItemsProps) {
  const { openHelp, contact } = helpActions(help);
  const key = help?.shortcut ?? "F1";
  return (
    <>
      {openHelp && (
        <MenuItem data-slot="help-menu" icon={<CircleHelp aria-hidden />} shortcut={key || undefined} onClick={openHelp}>
          Help
        </MenuItem>
      )}
      {contact && (
        <MenuItem icon={<LifeBuoy aria-hidden />} onClick={contact}>
          Contact support
        </MenuItem>
      )}
    </>
  );
}

/** The same two items as finger-sized rows, for a phone's account sheet. */
function HelpSheetItems({ help, onDone }: HelpMenuItemsProps & { onDone?: (() => void) | undefined }) {
  const { openHelp, contact } = helpActions(help);
  return (
    <>
      {openHelp && (
        <SheetItem icon={<CircleHelp aria-hidden />} onClick={() => (onDone?.(), openHelp())}>
          Help
        </SheetItem>
      )}
      {contact && (
        <SheetItem icon={<LifeBuoy aria-hidden />} onClick={() => (onDone?.(), contact())}>
          Contact support
        </SheetItem>
      )}
    </>
  );
}

export { HelpMenuItems, HelpSheetItems, type HelpMenuItemsProps };
