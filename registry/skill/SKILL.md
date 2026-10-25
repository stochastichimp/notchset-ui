---
name: notchset
description: Build interfaces with Notchset components and blocks for shadcn/ui. Use when creating or editing UI in a project that has Notchset installed, or when asked for buttons, fields, pickers, tables, boards, records, inboxes, reports, billing or settings screens built from Notchset.
---

# Notchset

Notchset is one design system for shadcn/ui: components, and blocks that compose them into the panels of a real
product (a records table, a pipeline board, an inbox, a report, a settings page). It installs as source through
the shadcn CLI and sits on the project's own shadcn tokens, so it follows the project's theme.

Before writing UI, read in this order:

1. `components.md`: find the item before inventing one.
2. `composition.md` and `app-pages.md`: how blocks make a screen, and the shell, header, lists and settings
   every app screen follows.
3. `design.md`: the foundation roles (surfaces, ink, sizes, type, corners, motion) and what each colour means.
4. `motion.md`: what moves, when, and what never does.
5. `accessibility.md`, `responsive.md`, `copy.md`.
6. `checklist.md` before you say you're done.

Worked examples: `example-settings.md`, `example-dashboard.md`.

## Install

- Free items: `npx shadcn@latest add https://notchset.dev/r/<id>.json`, or `@notchset/<id>` once the registry is in
  components.json. Every components.json style gets the same files.
- Pro items: `@notchset-pro/<id>` with the `NOTCHSET_TOKEN` key in `.env.local`. Never recreate Pro source.
- Every item's guide: `https://notchset.dev/md/<id>.md` (props, usage, what the host owns, mistakes). Read it before using it.
- Requirements: React 18.3 or 19, Tailwind CSS v4 (not v3, and no Tailwind `prefix`), a components.json.
