# Accessibility

- Every control has a name: a visible label, or `aria-label` (an `IconButton` requires `label`).
- Focus is always visible: the foundation's outline in `--ns-signal`. Never remove it.
- Keyboard first: everything a pointer does, a key does. Menus, selects and comboboxes follow the WAI-ARIA
  patterns (arrows, Enter, Esc, type-ahead); dialogs trap focus and return it to their opener.
- Status is said in words, not colour alone; a status dot has its word beside it.
- Live changes are announced once: a toast, a saved or refused state, a figure that rolled.
- Errors are tied to their field (`Field`'s `error`), marked invalid and read with it.
- Touch targets: controls grow on touch screens (the foundation's coarse-pointer sizes); nothing a finger presses
  is smaller than `--ns-touch`.
- Reduced motion reaches the same final state with no movement.
- Required means required: native `required`, never an asterisk alone.
