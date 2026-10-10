---
name: notchset
description: Build interfaces with Notchset components and blocks for shadcn/ui. Use when creating or editing UI in a project that has Notchset installed, or when asked for buttons, fields, pickers, charts, pricing, auth, calendars, boards or other app screens built from Notchset.
---

# Notchset

Notchset is one design system for shadcn/ui: components that answer as people use them, and blocks that
compose them into whole tasks. It installs as source through the
shadcn CLI and sits on the project's own shadcn tokens.

Before writing UI, read in this order:

1. `components.md`: find the item before inventing one.
2. `composition.md`: how blocks and screens are put together; `app-pages.md`: the app shell, page
   header, collection pages and settings forms every app screen follows.
3. `design.md`: the foundation roles (sizes, type, corners, depth) and the rules for colour.
4. `motion.md`: the motion vocabulary and what stays signature.
5. `accessibility.md`, `responsive.md`, `copy.md`.
6. `checklist.md` before you say you're done.

Worked examples: `example-settings.md`, `example-dashboard.md`.

## Install

- Free items: `npx shadcn@latest add https://notchset.dev/r/<id>.json`, or `@notchset/<id>` once the registry is in
  components.json.
- Pro items: `@notchset-pro/<id>` with the `NOTCHSET_TOKEN` key in `.env.local`. Never recreate Pro source.
- Every item's guide: `https://notchset.dev/md/<id>.md` (props, keyboard, motion, mistakes). Read it before using it.
