# Composition: blocks and screens

A block is one panel of a real product (a records table, a deal card, an activity feed, a settings section)
built from components and the foundation roles.

- Compose items; don't restyle copies of them. A piece two blocks need is a component, not a copy.
- Lay out by container: blocks render inside any width, from a phone column to a wide dashboard.
- Pass data and callbacks as props; keep sample data in the demo. Design every state the task has: loading,
  empty (a sentence on what goes here and the one way to fill it), error (what failed and a retry), disabled.
- A screen is blocks plus layout: the shell, a page header, a toolbar, the blocks, and the states between them.
  One primary action per region.
- If a block's demo also uses other items (its guide says "This example also uses …"), install those too before
  pasting the example.
