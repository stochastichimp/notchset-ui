// Notchset tooltip 2.0.0 · https://notchset.dev/changelog
import * as React from "react";

/*
 * Where overlays (dialogs, menus, popovers, tooltips, toasts, sheets) portal to. By default the document body; a
 * host that themes or scopes a region (a preview stage, a shadow root, a tile in another theme) wraps it in
 * PortalContainer with an element inside that scope, so its overlays keep the region's roles and light or dark.
 */
const PortalContainerContext = React.createContext<HTMLElement | null>(null);

const PortalContainer = PortalContainerContext.Provider;

/** The element overlays portal into here, or undefined for the document body. */
function usePortalContainer(): HTMLElement | undefined {
  return React.useContext(PortalContainerContext) ?? undefined;
}

export { PortalContainer, PortalContainerContext, usePortalContainer };
