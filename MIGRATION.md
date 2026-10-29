# Migrating from Notchset 1.x

The 1.x registry (the first generation of this repository, served from `/r/<name>.json` at the root) is archived at the
`v1` tag. This generation (2.x) is a different system: the components are rebuilt on one foundation of design roles,
and the same install name does not always mean the same API. Nothing here overwrites a 1.x install on its own; files
you already added stay as they are until you add the new version over them, so diff each one first.

## Button

`button` kept its install name and changed its API.

| 1.x | 2.x |
|---|---|
| `buttonVariants()` export (cva) | gone: use `<Button>`; for a link that looks like a button, style it with the same roles |
| `variant="default"` | `variant="primary"` |
| `variant="secondary"` | `variant="secondary"` (the default) |
| `variant="outline"` | `variant="secondary"` |
| `variant="ghost"` | `variant="ghost"` |
| `variant="destructive"` | `variant="danger"` |
| `variant="link"` | no button variant: use a text link |
| `size="default"`, `size="sm"` | the same |
| `size="lg"` | `size="default"` (one control height per density) |
| `size="icon"`, `"icon-sm"`, `"icon-lg"` | `square` (with `size="sm"` for the small one), plus an `aria-label` |
| `arrow`, sound props | gone |
| a `button-client` file beside it | gone: `Button` is one file |

## Components that did not carry over

Of the 130 items in the 1.x registry, 14 keep their name in 2.x (`avatar-stack`, `button`, `date-picker`, `inline-edit`,
`skeleton-reveal`, `sparkline`, `spinner`, `status-pill`, `time-picker`, and the `notchset-*` foundation, font, skill and
AI-rules items). The rest were retired or folded into broader components, and have no one-to-one replacement. They stay
installable from the `v1` tag:

`add-to-bag`, `ai-suggest-chip`, `alert`, `alert-dialog`, `announcement-bar`, `archive-undo`, `billing-period`, `billing-switch`, `bookmark-button`, `capsule-breadcrumb`, `checklist`, `checklist-alert`, `chunked-progress`, `classic-breadcrumb`, `code-block`, `color-picker`, `comet-progress`, `command-search`, `confirm-morph`, `connect-button`, `context-actions`, `copy-button`, `deploy-button`, `donut`, `dot-breadcrumb`, `download-action`, `drag-handle-list`, `drum-breadcrumb`, `elastic-refresh`, `elastic-tab-bar`, `email-field`, `error-summary`, `expanding-search`, `explorer-tree`, `export-action`, `feed-tab-bar`, `file-dropzone`, `floating-status`, `follow-action`, `follow-button`, `goal-bars`, `grouped-settings`, `hold-delete-action`, `hold-delete-button`, `horizontal-accordion`, `icon-buttons`, `inchworm-tabs`, `index-accordion`, `input`, `install-command`, `island-nav`, `lifecycle-badge`, `like-button`, `link-unfurl`, `live-banner`, `live-counter`, `mention-card`, `metric-sparkline`, `morph-loader`, `nested-changelog`, `notchset`, `otp-input`, `passkey-button`, `password-input`, `password-strength`, `pay-button`, `presence-avatar`, `profile-card`, `promise-toast`, `radial-bars`, `radix`, `range-picker`, `reaction-bar`, `record-button`, `regenerate-button`, `resolvable-alert`, `retry-action`, `rich-button`, `riding-progress`, `row-actions`, `save-action`, `save-button`, `scrub-number`, `segment-stepper`, `selection-toolbar`, `send-action`, `settings-switch`, `setup-form-block`, `share-fan`, `share-popover`, `sign-in-block`, `skeleton-fit`, `slug-input`, `snap-sheet`, `social-button`, `sound-provider`, `split-button`, `stat-ticker`, `step-accordion`, `stretch-tabs`, `style-toggles`, `sync-button`, `system-bar`, `tag-input`, `textarea`, `theme-switch`, `threshold-meter`, `time-slots`, `toast-pile`, `toast-stack`, `tooltip-toolbar`, `update-action`, `upload-button`, `validate-submit`, `verify-code-block`, `waffle-meter`


## Upgrade checklist

1. Pin what you have: commit your current `components/ui/notchset/` before adding anything.
2. Add the foundation first (`notchset-foundation`), then components one at a time; run your type check after each.
3. Rename Button variants and sizes as in the table above, then search for `buttonVariants`.
4. For a retired component, keep the 1.x file (it is yours) or replace it with the nearest 2.x component and its docs at <https://notchset.dev/components>.
