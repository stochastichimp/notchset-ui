# Example: an account settings page

Follows `app-pages.md` (shell, header, widths, settings forms).

1. Content `max-w-[720px]`; page header "Settings" with one muted line; no extra actions.
2. Profile box: Input for name, Email Field for email. Save Button saves the section: it rolls to Saving
   and Saved only after `res.ok`; on a failure it shakes and the message stays beside it.
3. Security box: Password Input with Password Strength for a new password.
4. Preferences box: Settings Switch for each on/off (it confirms with the server and rolls back on
   failure).
5. Plan box: Billing Switch for Monthly / Yearly and Billing Period for the plan list.
6. Danger zone box: Hold-to-Delete for the account, with the consequence written next to it.
7. Check the page against `checklist.md`.
