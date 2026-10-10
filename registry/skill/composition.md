# Composition: blocks and screens

A block is a whole task (sign in, check out, plan a week) built from catalogue items and shared helpers.

- Compose items; don't restyle copies of them. A block's own folder holds only its task-specific parts
  (a plan card, a slot grid, a task card).
- A piece two blocks need goes to a shared helper, then to a published item.
- Lay out by container: blocks render inside any width, from a phone column to a wide dashboard.
- Expose data and callbacks as props; keep sample data in the demo. Every state the task has: loading,
  empty, error (a message the person can act on), disabled, done.
- A screen is blocks plus layout: an app shell, a page header, a toolbar, the task blocks, and the
  states between them. Keep one primary action per region.
