# Responsive

- Size by container, not the screen, wherever a piece can be placed anywhere (`@container`).
- Touch and narrow windows get finger-sized controls automatically: the foundation raises `--ns-control`,
  `--ns-field`, `--ns-segment`, `--ns-menu-row` and the gutter under `(pointer: coarse)` and narrow widths.
  Don't override them smaller.
- Phones are a design, not a reflow: tables become calm lists, menus and pickers become bottom sheets, a side
  panel becomes a full screen with Back, and the primary action stays in thumb reach.
- Long content wraps; nothing important is truncated without a way to read it.
- Check 320px, 390px and 1280px, in light and dark.
