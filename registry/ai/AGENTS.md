# Notchset: rules for AI agents

Notchset items are installed in this project as source files you own:

- Notchset components: `components/ui/notchset/`, shared code in `lib/notchset/`. Their keyframes are merged into the global stylesheet by the shadcn CLI. Each one's guide is served, not installed: `https://notchset.dev/md/<id>.md`. Read it before using or editing the component.

## Rules
1. Prefer a Notchset component over writing a new one for the same job. If it isn't installed yet, install it (routing table below) instead of recreating it.
2. Pass content, data and callbacks through props. Components never fetch data themselves.
3. Colours: components read the app's shadcn tokens by role. Don't add Tailwind colour classes inside Notchset components; put overrides in the app's own CSS or tokens.
4. Dark mode follows the `.dark` class on an ancestor. Motion is built in: data-motion="off" on any ancestor, or reduced motion, finishes it at once. Don't wrap Notchset components in other animation libraries.
5. Keep every ARIA attribute, keyboard handler, focus rule, `data-slot` and `data-sound` attribute listed in the component's guide.
6. Sound is opt-in: wrap the app in `SoundProvider` once (the `sound-provider` item); components with sound play it inside it.

## Routing table (every Notchset item, installed or not)

Free commands install the Base UI build by URL. In a Radix project (a radix-*, new-york or default style) use `https://notchset.dev/r/radix-nova/<id>.json`, or `@notchset/<id>` with the registries below, which follows the project's style. Pro commands always follow the style.

| When the user needs… | Item | Install |
|---|---|---|
| button, primary button, secondary, outline, ghost, destructive, link button, icon button, continue button | Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/button.json` |
| save button, save changes, saving state, cmd+s, ctrl+s, async button | Save Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/save-button.json` |
| upload button, file upload progress, upload percent, attach file | Upload Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/upload-button.json` |
| sync button, refresh, sync now, syncing count, pull changes | Sync Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/sync-button.json` |
| deploy button, ship to production, pipeline progress, build test ship, release button | Deploy Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/deploy-button.json` |
| split button, publish button with menu, dropdown button, schedule, save as draft, button with options | Split Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/split-button.json` |
| segmented control, view switcher, tabs, list board timeline, toggle views | Inchworm Tabs (Notchset) | `npx shadcn@latest add https://notchset.dev/r/inchworm-tabs.json` |
| toolbar, tool palette, canvas tools, select draw shape text, editor tools, keyboard shortcuts | Tool Toolbar (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/tool-toolbar` |
| hold to delete, press and hold, long press confirm, destructive action, delete file | Hold to Delete (Notchset) | `npx shadcn@latest add https://notchset.dev/r/hold-delete-button.json` |
| confirm button, inline confirm, are you sure, discard changes, keep or discard | Confirm Morph (Notchset) | `npx shadcn@latest add https://notchset.dev/r/confirm-morph.json` |
| pay button, checkout, buy now, receipt, payment success, charge card | Pay Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/pay-button.json` |
| add to cart, add to bag, quantity stepper, cart button, shop | Add to Bag (Notchset) | `npx shadcn@latest add https://notchset.dev/r/add-to-bag.json` |
| passkey, sign in with passkey, webauthn, biometric login, touch id, face id | Passkey Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/passkey-button.json` |
| connect integration, oauth connect, link account, connect stripe, disconnect | Connect Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/connect-button.json` |
| follow button, subscribe to user, follow unfollow, follower count, social | Follow Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/follow-button.json` |
| like button, heart, favourite, upvote, like count, social reaction | Like Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/like-button.json` |
| bookmark, save for later, reading list, save article | Bookmark Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/bookmark-button.json` |
| theme toggle, dark mode switch, light dark, theme switcher, next-themes | Theme Switch (Notchset) | `npx shadcn@latest add https://notchset.dev/r/theme-switch.json` |
| copy button, copy to clipboard, copy link, copy code, invite code, share url | Copy Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/copy-button.json` |
| icon button, notification bell, settings gear, mute microphone, pin, toolbar icons, tooltip | Icon Buttons (Notchset) | `npx shadcn@latest add https://notchset.dev/r/icon-buttons.json` |
| ai suggestion, suggest title, ai autocomplete, generate with ai, streaming text, accept suggestion | AI Suggestion Chip (Notchset) | `npx shadcn@latest add https://notchset.dev/r/ai-suggest-chip.json` |
| email signup, newsletter form, subscribe, waitlist, validate email, submit button shake | Validate Submit (Notchset) | `npx shadcn@latest add https://notchset.dev/r/validate-submit.json` |
| reorder list, drag and drop list, sortable list, drag handle, rearrange items | Drag Handle List (Notchset) | `npx shadcn@latest add https://notchset.dev/r/drag-handle-list.json` |
| rich button, choice card, onboarding choice, import or start blank, create project options | Rich Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/rich-button.json` |
| regenerate, retry ai response, new draft, ai rewrite, draft history | Regenerate Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/regenerate-button.json` |
| record, voice note, audio recorder, microphone, dictation, waveform | Record Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/record-button.json` |
| share, share button, copy link, share menu, share sheet | Share Fan-out (Notchset) | `npx shadcn@latest add https://notchset.dev/r/share-fan.json` |
| archive, undo, soft delete, delayed commit, optimistic delete | Archive + Undo (Notchset) | `npx shadcn@latest add https://notchset.dev/r/archive-undo.json` |
| input, text field, labelled input, clearable input, character counter | Input (Notchset) | `npx shadcn@latest add https://notchset.dev/r/input.json` |
| email input, magic link, sign in with email, email autocomplete, floating label | Email Field (Notchset) | `npx shadcn@latest add https://notchset.dev/r/email-field.json` |
| textarea, auto grow, character limit, ctrl enter save, note field | Textarea (Notchset) | `npx shadcn@latest add https://notchset.dev/r/textarea.json` |
| inline edit, editable title, rename in place, click to edit | Inline Edit (Notchset) | `npx shadcn@latest add https://notchset.dev/r/inline-edit.json` |
| chat input, message composer, send message, AI chat box, typing indicator | Composer (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/composer` |
| password input, show password, caps lock warning, sign in password | Password Input (Notchset) | `npx shadcn@latest add https://notchset.dev/r/password-input.json` |
| password strength meter, choose password, generate password, password rules | Password Strength (Notchset) | `npx shadcn@latest add https://notchset.dev/r/password-strength.json` |
| otp input, verification code, one time code, 2fa code, pin input | Verification Code (Notchset) | `npx shadcn@latest add https://notchset.dev/r/otp-input.json` |
| command search, cmd k, combobox, search with results, quick switcher | Command Search (Notchset) | `npx shadcn@latest add https://notchset.dev/r/command-search.json` |
| expanding search, search icon, find in page, header search, highlight matches | Expanding Search (Notchset) | `npx shadcn@latest add https://notchset.dev/r/expanding-search.json` |
| tag input, chips input, multi value, keywords, labels input | Tag Input (Notchset) | `npx shadcn@latest add https://notchset.dev/r/tag-input.json` |
| scrub number, drag to change value, number input, price input, slider alternative | Scrub Number (Notchset) | `npx shadcn@latest add https://notchset.dev/r/scrub-number.json` |
| slug input, username availability, url slug, handle, workspace url | Slug Input (Notchset) | `npx shadcn@latest add https://notchset.dev/r/slug-input.json` |
| progress bar, upload progress, publish progress, percent label, stages | Riding Progress (Notchset) | `npx shadcn@latest add https://notchset.dev/r/riding-progress.json` |
| import progress, chunked progress, batch progress, skipped rows | Chunked Progress (Notchset) | `npx shadcn@latest add https://notchset.dev/r/chunked-progress.json` |
| indeterminate progress, download progress, connecting, unknown size | Comet Progress (Notchset) | `npx shadcn@latest add https://notchset.dev/r/comet-progress.json` |
| upload queue, file upload list, multiple uploads, upload status | Upload Queue (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/upload-queue` |
| timer, countdown, pomodoro, focus timer, break timer | Capsule Timer (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/capsule-timer` |
| background job status, export progress, toast progress, dynamic island | Floating Status (Notchset) | `npx shadcn@latest add https://notchset.dev/r/floating-status.json` |
| stepper, onboarding steps, multi step form, wizard, progress steps | Segment Stepper (Notchset) | `npx shadcn@latest add https://notchset.dev/r/segment-stepper.json` |
| onboarding checklist, setup steps, getting started, task list | Checklist (Notchset) | `npx shadcn@latest add https://notchset.dev/r/checklist.json` |
| usage meter, quota, plan usage, waffle chart, credits used | Waffle Meter (Notchset) | `npx shadcn@latest add https://notchset.dev/r/waffle-meter.json` |
| rate limit meter, usage threshold, quota alert, api usage, limit warning | Threshold Meter (Notchset) | `npx shadcn@latest add https://notchset.dev/r/threshold-meter.json` |
| storage usage, disk usage breakdown, stacked bar, capacity | Storage Breakdown (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/storage-breakdown` |
| skeleton loader, loading placeholder, content reveal, shimmer alternative | Skeleton Reveal (Notchset) | `npx shadcn@latest add https://notchset.dev/r/skeleton-reveal.json` |
| spinner, loader, loading indicator, busy, activity indicator | Spinner (Notchset) | `npx shadcn@latest add https://notchset.dev/r/spinner.json` |
| data table, services table, status table, sortable table, bulk actions, health status | Service Table (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/service-table` |
| query builder, filter builder, filters, advanced search, conditions | Query Builder (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/query-builder` |
| sparkline, metric card, kpi, trend chart, scrub chart | Metric Sparkline (Notchset) | `npx shadcn@latest add https://notchset.dev/r/metric-sparkline.json` |
| code block, code snippet, syntax highlighting, copy code, file tabs | Code Block (Notchset) | `npx shadcn@latest add https://notchset.dev/r/code-block.json` |
| install command, npm install, package manager tabs, copy command, cli snippet | Install Command (Notchset) | `npx shadcn@latest add https://notchset.dev/r/install-command.json` |
| diff view, code diff, review change, accept change, ai suggested edit | Diff View (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/diff-view` |
| json viewer, payload inspector, webhook payload, api response viewer, json tree | Payload Inspector (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/payload-inspector` |
| file tree, explorer, tree view, folder tree, git status | Explorer Tree (Notchset) | `npx shadcn@latest add https://notchset.dev/r/explorer-tree.json` |
| alert, callout, banner message, inline notice, error message, warning | Alert (Notchset) | `npx shadcn@latest add https://notchset.dev/r/alert.json` |
| announcement bar, countdown banner, event banner, live stream starts in, launch countdown | Live Banner (Notchset) | `npx shadcn@latest add https://notchset.dev/r/live-banner.json` |
| toast promise, loading toast, async toast, publishing toast, retry toast | Promise Toast (Notchset) | `npx shadcn@latest add https://notchset.dev/r/promise-toast.json` |
| toast, toasts, notifications stack, sonner, snackbar | Toast Stack (Notchset) | `npx shadcn@latest add https://notchset.dev/r/toast-stack.json` |
| date picker, calendar input, choose a date, due date, datepicker, popover calendar | Date Picker (Notchset) | `npx shadcn@latest add https://notchset.dev/r/date-picker.json` |
| date range picker, analytics date range, from to dates, last 30 days, report period | Range Picker (Notchset) | `npx shadcn@latest add https://notchset.dev/r/range-picker.json` |
| time slots, booking, schedule meeting, appointment picker, availability | Time Slots (Notchset) | `npx shadcn@latest add https://notchset.dev/r/time-slots.json` |
| time picker, time input, choose time, clock picker, wheel picker | Time Picker (Notchset) | `npx shadcn@latest add https://notchset.dev/r/time-picker.json` |
| color picker, colour picker, brand color, hex input, hue slider, contrast checker | Color Picker (Notchset) | `npx shadcn@latest add https://notchset.dev/r/color-picker.json` |
| calendar, agenda, events calendar, schedule view, month view | Agenda Calendar (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/agenda-calendar` |
| period comparison, vs previous period, trend line, line chart, compare periods, ahead behind | Period Comparison (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/period-line` |
| sparkline, kpi card, trend card, metric with chart, mini chart | Sparkline (Notchset) | `npx shadcn@latest add https://notchset.dev/r/sparkline.json` |
| bar chart, goal chart, target bars, daily activity, habit tracker | Goal Bars (Notchset) | `npx shadcn@latest add https://notchset.dev/r/goal-bars.json` |
| slope chart, before after, rank change, quarter over quarter, change by channel | Slope Chart (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/slope-chart` |
| ranked bars, share of total, top sources, traffic sources, breakdown list, stacked bar | Ranked Share (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/ranked-share` |
| waffle chart, unit chart, 100 dots, percentage breakdown, time allocation | Unit Flow (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/unit-flow` |
| treemap, hierarchy, revenue by region, book of business, nested breakdown | Treemap (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/treemap` |
| ridgeline, joy plot, distribution by month, density, seasonal spread | Ridgeline (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/ridgeline` |
| activity heatmap, contribution graph, calendar heatmap, github style, daily activity | Activity Heatmap (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/activity-heatmap` |
| live counter, realtime total, live responses, event counter, ticker | Live Counter (Notchset) | `npx shadcn@latest add https://notchset.dev/r/live-counter.json` |
| health score, scorecard, checklist status, compliance checks, workspace health | Health Scorecard (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/health-scorecard` |
| brush chart, timeline zoom, range selector, time series zoom, overview and detail | Brush Timeline (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/brush-timeline` |
| streamgraph, stacked area, themes over time, topics over time, river chart | Streamgraph (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/stream-graph` |
| multi line chart, series comparison, regions over time, labelled lines | Focus Lines (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/focus-lines` |
| composed chart, bar and line, dual axis, revenue and margin, combo chart | Bars and Line (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/composed-chart` |
| likert chart, diverging bar, survey results, agree disagree, sentiment | Diverging Bars (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/diverging-bars` |
| funnel, conversion funnel, signup funnel, drop off, pipeline stages | Funnel (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/funnel` |
| donut chart, pie chart, share of total, breakdown, ring chart | Donut (Notchset) | `npx shadcn@latest add https://notchset.dev/r/donut.json` |
| radial bar, goal rings, progress rings, okr progress, activity rings | Radial Bars (Notchset) | `npx shadcn@latest add https://notchset.dev/r/radial-bars.json` |
| radar chart, spider chart, scorecard, product qualities, compare releases | Radar (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/radar` |
| sankey, flow diagram, user flow, source to outcome, alluvial | Sankey (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/sankey` |
| bubble chart, scatter quadrant, account health, 2x2 matrix, scatter plot | Bubble Quadrants (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/bubble-quadrants` |
| music player, audio player, now playing, podcast player, mini player, media controls | Mini Player (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/mini-player` |
| voice assistant, voice input, speak button, AI voice, listening indicator, dictation | Voice Ring (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/voice-ring` |
| voice notes, voice messages, audio messages, chat voice, walkie talkie, record and send | Voice Notes (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/voice-notes` |
| hero background, interactive background, pointer effect, landing page backdrop, flow field | Needle Field (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/needle-field` |
| book a table, reservation, appointment booking, booking widget, schedule visit | Booking Pill (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/booking-pill` |
| schedule send, send later, schedule message, pick date and time, reminder time | Send Later (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/send-later` |
| time zone planner, meeting planner, world clock, working hours overlap, schedule across time zones | Overlap Finder (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/overlap-finder` |
| daily goals, habit tracker, progress rings alternative, health goals, activity goals, streaks | Daily Goals (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/daily-goals` |
| profile card, user card, creator card, team member card, follow card | Profile Card (Notchset) | `npx shadcn@latest add https://notchset.dev/r/profile-card.json` |
| social feed, photo feed, mobile app shell, bottom tab bar, double tap to like | Feed Tab Bar (Notchset) | `npx shadcn@latest add https://notchset.dev/r/feed-tab-bar.json` |
| mega menu, navigation menu, header nav, dropdown nav, marketing navbar | Island Nav (Notchset) | `npx shadcn@latest add https://notchset.dev/r/island-nav.json` |
| bottom tab bar, tab bar, mobile navigation, segmented tabs, app tabs with badges | Elastic Tab Bar (Notchset) | `npx shadcn@latest add https://notchset.dev/r/elastic-tab-bar.json` |
| more actions, overflow menu, context menu, photo actions, kebab menu, item actions | Context Actions (Notchset) | `npx shadcn@latest add https://notchset.dev/r/context-actions.json` |
| add task, quick add, todo list, inline composer, floating action button, new item | Quick Add (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/quick-add` |
| share dialog, share document, invite people, share link, permissions popover | Share Popover (Notchset) | `npx shadcn@latest add https://notchset.dev/r/share-popover.json` |
| canvas toolbar, whiteboard, design tool, tool rail, moodboard, editor tools | Tool Rail (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/tool-rail` |
| terminal replay, CLI demo, install instructions, command walkthrough, asciinema alternative | Command Replay (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/command-replay` |
| KPI card, stat card, metric with period tabs, revenue card, dashboard number | Stat Ticker (Notchset) | `npx shadcn@latest add https://notchset.dev/r/stat-ticker.json` |
| bottom sheet, nested sheets, mobile settings, drawer stack, modal sheet | Layered Sheets (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/layered-sheets` |
| payment methods, wallet, card stack, swipe cards, saved cards | Card Stack (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/card-stack` |
| quick settings, control center, volume slider, brightness slider, toggle tiles | Quick Settings (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/quick-settings` |
| link preview, unfurl, open graph preview, rich link, chat composer link | Link Unfurl (Notchset) | `npx shadcn@latest add https://notchset.dev/r/link-unfurl.json` |
| integrations page, app directory, marketplace, connect apps, plugins | Integration Hub (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/integration-hub` |
| skeleton loader, loading placeholder, content loading, shimmer, list loading | Skeleton Fit (Notchset) | `npx shadcn@latest add https://notchset.dev/r/skeleton-fit.json` |
| pull to refresh, swipe to dismiss, activity feed, notifications list, swipe actions | Elastic Refresh (Notchset) | `npx shadcn@latest add https://notchset.dev/r/elastic-refresh.json` |
| loading indicator, spinner alternative, sync status, success animation, error animation | Morph Loader (Notchset) | `npx shadcn@latest add https://notchset.dev/r/morph-loader.json` |
| faq, accordion, questions and answers, collapsible list, help section | Index Accordion (Notchset) | `npx shadcn@latest add https://notchset.dev/r/index-accordion.json` |
| checkout, multi-step form, wizard, stepper, order form | Step Accordion (Notchset) | `npx shadcn@latest add https://notchset.dev/r/step-accordion.json` |
| settings page, grouped list, account settings, preferences, collapsible sections | Grouped Settings (Notchset) | `npx shadcn@latest add https://notchset.dev/r/grouped-settings.json` |
| changelog, release notes, version history, what's new, nested accordion | Nested Changelog (Notchset) | `npx shadcn@latest add https://notchset.dev/r/nested-changelog.json` |
| horizontal accordion, expanding panels, feature showcase, image accordion, gallery | Horizontal Accordion (Notchset) | `npx shadcn@latest add https://notchset.dev/r/horizontal-accordion.json` |
| pre-publish checklist, blocking issues, warnings list, readiness check, launch checklist | Checklist Alert (Notchset) | `npx shadcn@latest add https://notchset.dev/r/checklist-alert.json` |
| system status banner, maintenance notice, outage banner, incident banner, announcement bar | System Bar (Notchset) | `npx shadcn@latest add https://notchset.dev/r/system-bar.json` |
| delete confirmation, type to confirm, destructive dialog, alert dialog, danger zone | Alert Dialog (Notchset) | `npx shadcn@latest add https://notchset.dev/r/alert-dialog.json` |
| form validation, error summary, form errors, accessible form, validation messages | Error Summary (Notchset) | `npx shadcn@latest add https://notchset.dev/r/error-summary.json` |
| offline indicator, connection status, network status, reconnecting, dynamic island | Status Pill (Notchset) | `npx shadcn@latest add https://notchset.dev/r/status-pill.json` |
| update button, software update, install update, upgrade button | Update Action (Notchset) | `npx shadcn@latest add https://notchset.dev/r/update-action.json` |
| download button, file download, progress download | Download Action (Notchset) | `npx shadcn@latest add https://notchset.dev/r/download-action.json` |
| export button, export data, multi step progress, csv export | Export Action (Notchset) | `npx shadcn@latest add https://notchset.dev/r/export-action.json` |
| retry button, failed upload, try again, error recovery | Retry Action (Notchset) | `npx shadcn@latest add https://notchset.dev/r/retry-action.json` |
| save button, keyboard shortcut save, cmd s, autosave | Save Action (Notchset) | `npx shadcn@latest add https://notchset.dev/r/save-action.json` |
| send button, send message, send email, submit | Send Action (Notchset) | `npx shadcn@latest add https://notchset.dev/r/send-action.json` |
| pay button, checkout button, payment, buy now | Pay Action (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/pay-action` |
| hold to delete, press and hold, destructive button, long press | Hold Delete Action (Notchset) | `npx shadcn@latest add https://notchset.dev/r/hold-delete-action.json` |
| passkey button, sign in, webauthn, biometric login | Passkey Action (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/passkey-action` |
| follow button, subscribe, connect, social button | Follow Action (Notchset) | `npx shadcn@latest add https://notchset.dev/r/follow-action.json` |
| generate button, ai generate, write with ai, draft | Generate Action (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/generate-action` |
| join call, call button, meeting button, start call | Join Call Action (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/join-call-action` |
| reader header, document header actions, more menu, contextual header, app bar actions | Header Capsule (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/header-capsule` |
| bubble menu, selection toolbar, text formatting, inline toolbar, highlight menu | Selection Toolbar (Notchset) | `npx shadcn@latest add https://notchset.dev/r/selection-toolbar.json` |
| inbox, row actions, hover actions, email list, notifications list | Row Actions (Notchset) | `npx shadcn@latest add https://notchset.dev/r/row-actions.json` |
| peek and pop, long press menu, context menu, photo grid, gallery actions | Hold Peek (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/hold-peek` |
| bulk actions, selection bar, file manager, multi select, batch actions | Selection Action Bar (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/selection-action-bar` |
| breadcrumb, path, navigation trail, file path, hierarchy | Classic Breadcrumb (Notchset) | `npx shadcn@latest add https://notchset.dev/r/classic-breadcrumb.json` |
| breadcrumb, pill breadcrumb, compact path, app header path, segmented trail | Capsule Breadcrumb (Notchset) | `npx shadcn@latest add https://notchset.dev/r/capsule-breadcrumb.json` |
| breadcrumb switcher, sibling switcher, project switcher, path dropdown, environment switcher | Drum Breadcrumb (Notchset) | `npx shadcn@latest add https://notchset.dev/r/drum-breadcrumb.json` |
| minimal breadcrumb, dot path, depth indicator, compact trail, progress path | Dot Breadcrumb (Notchset) | `npx shadcn@latest add https://notchset.dev/r/dot-breadcrumb.json` |
| path input, address bar, file path editor, breadcrumb input, go to folder | Path Editor (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/path-editor` |
| reactions, like button group, social actions, post actions, engagement bar | Reaction Bar (Notchset) | `npx shadcn@latest add https://notchset.dev/r/reaction-bar.json` |
| split button, merge button, action with options, dropdown button, primary action menu | Merge Split (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/merge-split` |
| bulk actions, selection bar, file picker actions, batch toolbar, multi select | Selection Island (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/selection-island` |
| formatting toolbar, text style toggles, toggle group, editor toolbar, alignment control | Style Toggles (Notchset) | `npx shadcn@latest add https://notchset.dev/r/style-toggles.json` |
| radio cards, room booking, plan cards, card radio group, option cards | Room Picker (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/room-picker` |
| radio list, permission picker, privacy setting, who can reply, audience picker | Reply Rail (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/reply-rail` |
| segmented tabs, inbox tabs, tabs with counts, filter tabs, collapsible list | Stretch Tabs (Notchset) | `npx shadcn@latest add https://notchset.dev/r/stretch-tabs.json` |
| billing toggle, pricing period, annual discount, plan picker, subscription | Billing Period (Notchset) | `npx shadcn@latest add https://notchset.dev/r/billing-period.json` |
| billing toggle, monthly yearly switch, pricing period, annual discount | Billing Switch (Notchset) | `npx shadcn@latest add https://notchset.dev/r/billing-switch.json` |
| switch, toggle, settings row, async toggle, preference | Settings Switch (Notchset) | `npx shadcn@latest add https://notchset.dev/r/settings-switch.json` |
| tri-state checkbox, select all, export picker, nested checkboxes, bulk select | Export Picker (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/export-picker` |
| announcement bar, site banner, top bar, rotating notice, maintenance banner | Announcement Bar (Notchset) | `npx shadcn@latest add https://notchset.dev/r/announcement-bar.json` |
| toast, timed toast, undo toast, snackbar, swipe to dismiss | Burn Toast (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/burn-toast` |
| notification pile, missed notifications, toast queue, activity feed, notification center | Toast Pile (Notchset) | `npx shadcn@latest add https://notchset.dev/r/toast-pile.json` |
| actionable alert, storage warning, fix it alert, quota warning, inline resolution | Resolvable Alert (Notchset) | `npx shadcn@latest add https://notchset.dev/r/resolvable-alert.json` |
| avatar, presence, status dot, user avatar, online indicator | Presence Avatar (Notchset) | `npx shadcn@latest add https://notchset.dev/r/presence-avatar.json` |
| status badge, lifecycle, review state, count badge, notification badge | Lifecycle Badge (Notchset) | `npx shadcn@latest add https://notchset.dev/r/lifecycle-badge.json` |
| avatar group, collaborators, facepile, people stack, invite | Avatar Stack (Notchset) | `npx shadcn@latest add https://notchset.dev/r/avatar-stack.json` |
| rich text editor, wysiwyg, notes editor, bubble menu, autosave | Rich Text Card (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/rich-text-card` |
| signature, e-sign, draw signature, sign document, handwriting | Signature Pad (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/signature-pad` |
| file upload, dropzone, drag and drop upload, upload progress, attachments | File Dropzone (Notchset) | `npx shadcn@latest add https://notchset.dev/r/file-dropzone.json` |
| bottom sheet, drawer, snap points, mobile sheet, draggable panel | Snap Sheet (Notchset) | `npx shadcn@latest add https://notchset.dev/r/snap-sheet.json` |
| hover card, mention, profile preview, user card, people popover | Mention Card (Notchset) | `npx shadcn@latest add https://notchset.dev/r/mention-card.json` |
| tooltip, toolbar tooltips, icon toolbar, keyboard shortcuts, tool picker | Tooltip Toolbar (Notchset) | `npx shadcn@latest add https://notchset.dev/r/tooltip-toolbar.json` |
| drawer, side panel, invoice detail, order detail, detail view | Invoice Drawer (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/invoice-drawer` |
| sunburst alternative, drill down donut, budget breakdown, hierarchy chart, plan vs actual | Drill Ring (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/drill-ring` |
| spreadsheet, data grid, range selection, editable table, inventory grid | Range Grid (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/range-grid` |
| latency chart, live metrics, SLO monitor, uptime strip, realtime bar chart | Pulse Strip (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/pulse-strip` |
| social login, sign in with Google, OAuth buttons, passkey login, magic link | Social Button (Notchset) | `npx shadcn@latest add https://notchset.dev/r/social-button.json` |
| pricing page, plans, subscription tiers, compare plans, enterprise pricing, seat pricing | Pricing (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/pricing-block` |
| checkout, review and pay, order summary, seats, add-ons, promo code, subscription purchase | Checkout (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/checkout-block` |
| usage pricing, pricing calculator, cost estimator, metered billing, API pricing, seats and usage | Usage Pricing (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/usage-pricing-block` |
| pricing calculator, seat pricing, team size, per-seat plans, plan picker | Pricing Calculator (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/pricing-calculator` |
| scheduling, meeting time, availability, calendar, find a time, invites, booking | Availability (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/availability-block` |
| calendar, week view, scheduling, events, planner, agenda, day view, drag and drop | Week Calendar (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/calendar-block` |
| release checklist, launch readiness, go live, deployment checks, approval gate, ship | Release Readiness (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/release-block` |
| kanban, board, tasks, project management, sprint, drag and drop, workflow, WIP limit | Project Board (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/board-block` |
| sign in, sign up, login, register, one-time code, magic code, passkey, OAuth | Sign In (Notchset) | `npx shadcn@latest add https://notchset.dev/r/sign-in-block.json` |
| multi-step form, wizard, onboarding, create project, stepper, review step | Setup Form (Notchset) | `npx shadcn@latest add https://notchset.dev/r/setup-form-block.json` |
| verification code, otp, one-time code, 2fa, confirm email, two-factor | Verification Code (Notchset) | `npx shadcn@latest add https://notchset.dev/r/verify-code-block.json` |
| onboarding, sign up flow, first run, create workspace, invite team, auth, welcome | Auth Studio (Notchset) (Pro) | `npx shadcn@latest add @notchset-pro/auth-studio` |

## Installing more

The project's `components.json` needs both registries:

```json
{
  "registries": {
    "@notchset": "https://notchset.dev/r/{style}/{name}.json",
    "@notchset-pro": {
      "url": "https://notchset.dev/r/pro/{style}/{name}.json",
      "headers": { "Authorization": "Bearer ${NOTCHSET_TOKEN}" }
    }
  }
}
```

Pro items need `NOTCHSET_TOKEN` in `.env.local`. If an install returns 401 or 403, tell the user plainly and link https://notchset.dev/pricing. Don't try to work around it.

## Updating

Re-run the install with `--overwrite`. Check https://notchset.dev/r/changelog.json first: a major version bump means props changed.

Docs for people: https://notchset.dev/components · For agents: https://notchset.dev/llms.txt
