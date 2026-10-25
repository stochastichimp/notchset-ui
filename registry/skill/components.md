# Finding the right item

Search first: `https://notchset.dev/llms.txt` lists every item with one line on what it is; the MCP server
(`search_components`, `get_component`) answers the same questions with install commands.

- Use an item when its job matches its one-line summary. A `SegmentedControl` switches views of one thing; `Tabs`
  are a list's saved slices; a `Switch` is a setting that takes effect at once; a `Checkbox` is a tick you then
  submit.
- Install it; don't copy its look into a new component. Adjust with `className` and the foundation roles
  (design.md), not by forking the file.
- What the host owns is said in the item's guide (sort order, selection, persistence, page-wide shortcuts): wire
  it, don't expect the item to guess.
- Shelves: actions (Button, Icon button), inputs (Text field, Search field, Select, Combobox, Checkbox, Switch,
  Segmented control, Chip, Inline edit, Field), dates (Calendar, Date picker, Date range picker, Time picker),
  overlays (Dialog, Side panel, Menu, Command menu, Tooltip, Bottom sheet), feedback (Toast, Banner, Empty state,
  Skeleton, Spinner), display and charts (Avatar, Status pill, Meter, Tick bar, Sparkline, Rolling number), and
  blocks for lists, records, pipeline, inbox, reports, billing, settings, developers and the app shell.
- No item fits? In this order: (1) the project's stock shadcn component, themed by the same tokens; (2) a
  composition of Notchset items and stock ones; (3) only then a new piece, built from the foundation roles and
  `Field` for anything typed into. Keep it in the project and say in your reply which gap it fills.
