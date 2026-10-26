// Notchset time-picker 2.0.0 · https://notchset.dev/changelog
/*
 * The one popup surface every list that opens from a control uses (select, combobox, recipient picker, and
 * menus in batch 3): the prototype's .menu. It drops just below its control, and on a phone it becomes a
 * bottom sheet with a grab handle and finger-sized rows. Kept as class strings so each primitive's own parts
 * wear the same look.
 */

/** On the Positioner: above everything but dialogs; on a phone, pinned to the bottom edge as a sheet (above a tab bar
    when the app sets --ns-sheet-bottom to its height). */
export const popupPositioner =
  "z-50 outline-hidden max-[600px]:!fixed max-[600px]:!inset-x-2 max-[600px]:!top-auto max-[600px]:!bottom-[calc(var(--ns-sheet-bottom)+env(safe-area-inset-bottom,0px))] max-[600px]:!left-2 max-[600px]:!w-auto max-[600px]:!transform-none";

/** On the Popup. */
export const popupSurface =
  "min-w-[max(var(--anchor-width,0px),180px)] max-h-[min(420px,70vh,var(--available-height,70vh))] overflow-auto overscroll-contain rounded-[var(--ns-radius-lg)] bg-[var(--ns-raised)] p-[5px] text-[length:var(--ns-text-body)] text-[var(--ns-ink)] shadow-[0_0_0_1px_var(--ns-line),var(--ns-shadow-float)] outline-hidden origin-[var(--transform-origin)] " +
  "[animation:ns-menu-in_var(--ns-time-menu)_var(--ns-ease)] data-ending-style:opacity-0 data-ending-style:[transition:opacity_110ms_ease] " +
  "max-[600px]:w-auto max-[600px]:min-w-0 max-[600px]:max-h-[70dvh] max-[600px]:rounded-[var(--ns-radius-xl)] max-[600px]:px-1.5 max-[600px]:pt-3.5 max-[600px]:pb-1.5 max-[600px]:[animation:ns-sheet-up_var(--ns-time-panel)_var(--ns-ease-panel)] " +
  "max-[600px]:before:absolute max-[600px]:before:top-[5px] max-[600px]:before:left-1/2 max-[600px]:before:h-1 max-[600px]:before:w-9 max-[600px]:before:-translate-x-1/2 max-[600px]:before:rounded-full max-[600px]:before:bg-[var(--ns-line)] max-[600px]:before:content-['']";

/** On each item. Highlight (pointer or arrow keys) is the hover wash; the chosen item carries a check. */
export const popupItem =
  "flex w-full min-h-[var(--ns-menu-row)] cursor-default items-center gap-[9px] rounded-[7px] px-[9px] text-left outline-hidden select-none data-highlighted:bg-[var(--ns-hover)] data-disabled:opacity-45 [&_svg:not([data-slot=company-mark])]:size-3.5 [&_svg]:shrink-0";

/** The quiet line a list shows when nothing matches. */
export const popupEmpty = "px-[9px] py-2 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)] empty:hidden";
