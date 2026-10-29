# Motion

Durations and curves are roles: `--ns-time-color` (hover, state), `--ns-time-menu`, `--ns-time-toast`,
`--ns-time-dialog`, `--ns-time-panel`, `--ns-time-page`, and `--ns-ease`, `--ns-ease-panel` (sheets and panels),
`--ns-ease-pop` (something created). Nothing moves at rest.

- **Entrances ease out**: a menu, a dialog, a panel, a toast, rows arriving. Exits are quicker.
- **Your own change moves; arrival doesn't.** A figure you changed rolls only the digits that changed
  (`RollingNumber`); a row your action adds grows in (`Reveal`). A page you open is simply there: no count-ups.
- **Waiting is the notch** (`Spinner`): ink, beside the words that say what is happening ("Saving…"), never a
  colour.
- **Reduced motion** is honoured twice: the operating system's setting and `data-motion="reduced"` on an
  ancestor. Every state still lands, at once, and nothing forces full motion past them, a showcase included.
- Never add bounce, parallax or looping decoration to an app screen.
