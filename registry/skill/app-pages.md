# App pages: shell, header, lists, settings

Every app screen follows these patterns, so many pages read as one product. Compose Notchset blocks and stock
shadcn pieces; don't invent new spacing, headings or table states per page.

## Shell and page header

- Shell: the `sidebar` and `top-bar` blocks (or stock shadcn `Sidebar`), one band tall (`--ns-header`); the
  content scrolls, the shell doesn't. Every left edge snaps to `--ns-gutter`.
- Page header: the title (`--ns-text-page`), one line under it in `--ns-ink-2`, and at most one primary
  `Button` at the end. Secondary actions go in a `Menu`. On phones the action drops under the title.

## Lists (records, customers, invoices)

- Table: the `data-table` block (sticky header, sortable headers, rows that open, a selection column). The host
  owns sort order, selection and row keys; wire them.
- Toolbar above the table, aligned to its edges: `SearchField`, the `filter-bar` block or `FilterButton`s, then
  the primary action. Filters change the URL so a filtered view can be shared.
- Every state, in the same frame as the table so nothing jumps:
  - Loading: `Skeleton` rows the height of real rows (`--ns-row`).
  - First use: an `EmptyState` saying what goes here and the action that creates the first one.
  - Filtered empty: "No results for …" and Clear filters.
  - Load failure: what failed, Retry, and the error announced (`role="alert"`).
- Bulk actions: the `bulk-bar` block; selection only holds ids still in the list, and a failed action keeps the
  selection and says what failed.
- A record opens beside its list in a `SidePanel` (J and K step through), or on its own page when people live in
  it.

## Settings

- The `settings-layout` block: sections with a title and one line saying what each controls.
- Fields are built on `Field` (label, hint, error). Validation is per field, checked on submit and as the person
  fixes it.
- A `Switch` takes effect at once; if the server refuses, flip it back and say why. A form's Save is a `Button`
  with `busy` while saving; a failed save keeps the values and says what failed beside the button.
- Async callbacks fail by throwing or by resolving `false`, a failed `Response` (`!res.ok`) or `{ error }`; check
  `res.ok` before treating a request as done.

## Phones

Order on a phone: header, the primary task, then supporting panels. Tables become calm lists or scroll inside
their own region; toolbars wrap; menus become bottom sheets. Check 390px and 1280px.
