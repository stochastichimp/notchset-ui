// Notchset side-panel 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";

/*
 * Focus goes back to whatever opened a layer when it closes, even when the layer is opened from state (a menu
 * item, a shortcut, a row) rather than its own trigger. One document listener remembers the last control
 * focused or pressed outside any layer (marked data-ns-layer); pressing counts too because Safari does not focus
 * a clicked button. Pass the result to a Base UI Popup's finalFocus.
 */
let last: HTMLElement | null = null;
let watching = false;

function watch() {
  if (watching || typeof document === "undefined") return;
  watching = true;
  const note = (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (!t?.closest || t.closest("[data-ns-layer]")) return;
    /* a table row that opens on press is its own opener: it takes focus back (as a J/K row does), so closing
       what it opened never leaves focus on the page's body, where the next Tab can leave the app */
    const row = t.closest<HTMLElement>("tr[data-row]");
    const ctl = t.closest<HTMLElement>("button,a[href],input,select,textarea,[tabindex]");
    if (row && (!ctl || !row.contains(ctl)) && !row.hasAttribute("tabindex")) row.tabIndex = -1;
    last = (row && (!ctl || !row.contains(ctl)) ? row : ctl) ?? last;
  };
  document.addEventListener("focusin", note, true);
  document.addEventListener("pointerdown", note, true);
}

export function useReturnFocus() {
  React.useEffect(watch, []);
  return React.useCallback(() => (last && last.isConnected ? last : true), []);
}
