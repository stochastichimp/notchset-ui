# Accessibility

- The right semantics: radiogroup for one-of-a-few, tabs for panels, switch for on/off settings,
  checkbox for independent options. Label every control; a decorative mark is `aria-hidden`.
- Keyboard reaches every outcome the pointer does. Arrow keys inside groups (mirrored in right-to-left),
  Home/End to the ends, Escape closes, focus returns to the control that opened something.
- Focus is always visible (the shared focus ring or the family's documented indicator).
- Announce outcomes politely (saved, verified, failed) with a live region; never only with colour,
  motion or sound.
- Touch targets are at least 44px on coarse pointers. Text meets contrast on the project's tokens.
