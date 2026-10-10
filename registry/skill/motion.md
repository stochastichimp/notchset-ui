# Motion

Motion says what happened: a press compresses, content settles, a shape reshapes, a mark pops. Ordinary
motion uses the roles below and nothing else; a component's signature choreography (Save Button's morph,
the call to action's sweep, hold-to-delete, chart transitions) stays inside that component with its own
timing, and is not copied into new work.

| Job | Curve | Time |
| --- | --- | --- |
| Press (compress and spring back) | `var(--ns-ease-press)` | `var(--ns-time-press)`, depth `scale-[var(--ns-press-depth)]` |
| Settle (content arrives, no overshoot) | `var(--ns-ease-settle)` | `var(--ns-time-state)` |
| Reshape (width, thumb, rolling label) | `var(--ns-ease-reshape)` | `var(--ns-time-reflow)` |
| Pop (a glyph or mark appears) | `var(--ns-ease-pop)` | `var(--ns-time-state)` |
| Rebound (a stronger glyph response) | `var(--ns-ease-rebound)` | `var(--ns-time-state)` |
| Hover feedback, colour, state, fold | default ease | `var(--ns-time-response)`, `-color`, `-state`, `-reflow` |

Write transitions as literal arbitrary properties, listing `scale`, `translate` and `rotate` whenever
`transform` is listed: `[transition:scale_var(--ns-time-press)_var(--ns-ease-press)]`.

Never put an overshooting curve on opacity, colour or blur.

Every animation has a reduced-motion path, and `data-motion="off"` on any ancestor means the same:
- Classes: `motion-reduce:transition-none` / `motion-reduce:animate-none`.
- A `transition` set in an inline `style`: `motion-reduce:transition-none!`; an `animation` set in an inline
  `style`: `motion-reduce:animate-none!` (both with the `!`: an inline style beats a plain class).
- JS-driven motion (requestAnimationFrame loops, pointer-following light): check `prefersCalm(element)`
  from the shared helpers when it starts AND on every frame or handler, so turning motion off mid-way
  settles it at once.
- Motion off still reaches the final state; the work (a save, an upload) keeps its real timing.

Sound is opt-in (SoundProvider) and independent of motion: one cue per event, from the component that
owns the event.
