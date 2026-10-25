# Design: the foundation roles

The foundation (`Notchset` foundation item, merged into the global stylesheet by the install) names every value
as a role. Use the role, never a literal: no hex colours, no pixel sizes a role names, no one-off durations.

## Colour

The colour roles read the project's shadcn tokens (`--background`, `--foreground`, `--muted`,
`--muted-foreground`, `--border`, `--ring`, `--primary`, `--destructive`, and `--success`, `--warning` when
present), so every piece follows the project's theme in light and dark.

| Role | Means |
|---|---|
| `--ns-canvas`, `--ns-side`, `--ns-panel`, `--ns-raised`, `--ns-well` | the page, the sidebar, a content panel, a control or menu, a sunken field |
| `--ns-ink`, `--ns-ink-2`, `--ns-ink-3` | text in three tones; the third only for meta text and glyphs |
| `--ns-line`, `--ns-line-soft` | borders and dividers |
| `--ns-signal` | the one chosen thing in a region, today, focus. Never decoration |
| `--ns-ok`, `--ns-warn`, `--ns-bad` (text: `--ns-ok-ink`, `--ns-bad-ink`) | good, needs attention, wrong or refused; always with a word |
| `--ns-hover`, `--ns-selected` | hover, and a selected row |

Outcomes are said in words where the change shows (a toast with Undo, the row, the figure), never with a
coloured fill on the button that was pressed. Chart colours are for data only.

## Sizes, type, corners

| Role | Use |
|---|---|
| `--ns-control`, `--ns-control-sm` | button heights (32/28px on desktop; 40/36px on touch, set by the foundation) |
| `--ns-field` | every single-line field |
| `--ns-row`, `--ns-header`, `--ns-touch` | a list row, the top band, the smallest touch target |
| `--ns-text-meta` … `--ns-text-figure` | type sizes; `--ns-text-meta` (12px) is the floor |
| `--ns-font-body`, `--ns-font-display`, `--ns-font-mono` | reading, titles and figures, keys and codes |
| `--ns-radius-sm`, `--ns-radius`, `--ns-radius-lg`, `--ns-radius-xl`, `--ns-radius-full` | chip, control, card, dialog, pill |
| `--ns-space-1` … `--ns-space-8`, `--ns-gutter` | the 4px rhythm and the one left edge |
| `--ns-bezel`, `--ns-shadow-float`, `--ns-shadow-dialog`, `--ns-shadow-panel` | a control's edge, menus, dialogs, side panels |

A part inside another takes the outer corner minus its inset. Figures use tabular digits; a number beside words
takes the words' face.

## Writing classes

- Literal class strings in `className`, `cn()` or `cva()`. Reference roles with arbitrary values:
  `bg-[var(--ns-panel)]`, `text-[length:var(--ns-text-small)]`, `h-[var(--ns-field)]`.
- An animation is a whole class string (`[animation:ns-rise_var(--ns-time-page)_var(--ns-ease)]`), never only an
  inline style: Tailwind keeps a theme keyframe only when compiled CSS names it.
