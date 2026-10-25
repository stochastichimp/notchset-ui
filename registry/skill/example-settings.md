# Example: workspace settings

Follows `app-pages.md` (shell, header, settings).

1. The `settings-layout` block; page header "Settings" with one muted line; no extra actions.
2. Workspace section: `TextField`s for the name and the domain, built on `Field` with hints and errors. Save is a
   `Button` with `busy` while saving; a failure keeps the values and says what failed beside it.
3. Notifications: a `Switch` per setting; each takes effect at once and flips back with a reason if refused.
4. Plan: the `plan-picker` block, and `price-summary` for what changes on the next invoice.
5. Developers: `api-key-list` and `webhook-list`; a new key is shown once with `SecretReveal`.
6. Check the page against `checklist.md`.
