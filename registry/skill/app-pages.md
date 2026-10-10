# App pages: shell, header, collections, settings

Every app screen follows these four patterns, so seventy pages read as one product. Compose stock shadcn
pieces and Notchset items; don't invent new spacing, headings or table states per page.

## Shell and page header

- Shell: stock shadcn `Sidebar` (or a top bar on small apps) with the project's tokens; the content area
  scrolls, the shell doesn't.
- Content width: `mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8`; forms and settings
  `max-w-[720px]`. Section gap `gap-8`; inside a section `gap-4`.
- Page header: title (`text-2xl font-semibold tracking-tight`), one line under it in muted foreground,
  and at most one primary action at the end (Button). Secondary actions go in a menu. On phones the
  action drops under the title, full width.

## Collection pages (records, customers, invoices)

- Table: stock shadcn `Table` with `Pagination` for general records. Notchset's Service Table is for
  operational service lists (health, latency, uptime) only.
- Toolbar above the table, aligned to its edges: search (Input), filters (Select / Segmented), then the
  primary action. Filters change the URL so a filtered view can be shared.
- Every state, in the same frame as the table so nothing jumps:
  - Loading: skeleton rows the height of real rows (`--ns-row-height`).
  - First use (no records yet): one sentence on what goes here and the action that creates the first one.
  - Filtered empty: "No results for …" and a Clear filters button.
  - Load failure: what failed, a Retry button, and the error announced (`role="alert"`).
- Selection and bulk actions: selection only holds ids still in the table; a failed action keeps the
  selection and says what failed (Service Table and Arrow CTA do this already).

## Settings forms

- Sections as boxes (`rounded-[var(--ns-corner-box,min(26px,calc(var(--radius,999px)*2.6)))]`, `border`, `bg-[var(--card)]`), each with a title
  and one line saying what it controls.
- Labels `text-[length:var(--ns-type-label)]`, notes under fields `text-[length:var(--ns-type-note)]`.
- Validation is per field (inline message, `aria-invalid`), checked on submit and as the person fixes it.
- A failed save is not a validation result: keep the values, say what failed next to the save action
  and announce it. Never show "saved" or "looks good" after a failed request.
- Async callbacks fail by throwing or by resolving `false`, a failed `Response` (`!res.ok`) or
  `{ error }`; check `res.ok` before treating a request as done.

## Phones

Order on a phone: header, the primary task, then supporting panels. Tables scroll inside their own
region; toolbars wrap. Check 390px and 1280px.
