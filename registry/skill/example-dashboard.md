# Example: a team dashboard

Follows `app-pages.md` (shell, header, widths, states).

1. Shell: stock shadcn Sidebar; content `max-w-[1200px]`, `gap-8` between sections.
2. Page header: "Overview", one muted line with the date range, one primary action (Button "Invite").
3. Metrics row: Metric Sparkline tiles (`grid gap-4 sm:grid-cols-2 lg:grid-cols-4`), each saying what
   changed and over what period.
4. Trend: a chart from the catalogue (Composed Chart or Focus Lines) in a box.
5. Records: stock shadcn Table + Pagination with the collection states from `app-pages.md` (loading,
   first use, filtered empty, load failure with Retry). Use Service Table only if the records are
   services with health and latency.
6. Activity: Nested Changelog or a list beside the table on wide screens, below it on phones.
7. Check the page against `checklist.md`.
