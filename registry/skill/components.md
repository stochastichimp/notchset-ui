# Finding the right item

Search first: `https://notchset.dev/llms.txt` lists every item with one line on when to use it; the MCP server
(`search_components`, `get_component`) answers the same questions with install commands.

- Use an item when its job matches. Read its "Use it when" and "Not when" lines: a Billing Switch is not
  a tab bar, a Settings Switch has async confirm-or-roll-back behaviour a plain checkbox doesn't.
- Install it; don't copy its look into a new component. Override with `className` and the foundation
  roles (design.md), not by forking the file.
- Families: Actions (Button, Save Button, Split Button, hold and pay actions), Fields (Input, Password,
  Verification Code, Email, Tag Input), Date and time, Selection and navigation (tabs, switches,
  segmented), Overlays and feedback (dialogs, toasts, alerts, progress), Data (tables, charts, metrics),
  Agent UI, and Blocks (whole tasks: sign in, pricing, checkout, calendar, board, availability, release).
- No item fits? In this order: (1) the project's stock shadcn component (Table, Sidebar, Pagination,
  Dialog, Form, Select…), themed by the same tokens; (2) a composition of Notchset items and stock ones;
  (3) only then a new piece, built from the foundation roles and the shared helpers (`lib/`: Segmented
  choice, Verification code controller, Field family, Number Flow, Arrow CTA, Avatar Face). Keep it in
  the project and say in your reply which gap it fills.
