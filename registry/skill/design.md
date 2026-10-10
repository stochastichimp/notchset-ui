# Design rules

## Colour comes from the project

Components read the project's shadcn tokens: `--background`, `--foreground`, `--muted`,
`--muted-foreground`, `--border`, `--input`, `--ring`, `--primary`, `--success`, `--warning`,
`--destructive`, `--chart-1…5`. Never hard-code a hex colour in a component. Mix tokens instead:
`color-mix(in oklab, var(--success,var(--foreground)) 70%, var(--foreground))`. Tints of a block's accent use
`--ns-tint-panel` / `-card` / `-band` / `-band-strong`.

## Foundation roles

Use the role, not its raw value (the values are the defaults):

| Job | Role |
| --- | --- |
| Control height compact / regular / roomy | `h-[var(--ns-control-compact)]` 32px, `-regular` 40px, `-roomy` 48px |
| Control padding | `px-[var(--ns-inset-compact)]` 12px, `-regular` 18px, `-roomy` 24px |
| Box and frame corners in blocks | `rounded-[var(--ns-corner-box,min(26px,calc(var(--radius,999px)*2.6)))]` 26px, `rounded-[var(--ns-corner-frame,min(34px,calc(var(--radius,999px)*3.4)))]` 34px |
| Note / label / copy text | `text-[length:var(--ns-type-note)]` 12px, `-label` 13px, `-copy` 14px |
| Prose leading, note leading | `leading-[var(--ns-leading-prose)]`, `leading-[var(--ns-leading-note)]` |
| Control label tracking | `tracking-[var(--ns-tracking-control)]` |
| Floating layer | `shadow-[var(--ns-shadow-layer)]` |
| Focus ring | `focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]` |
| Supporting text | `text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]` |

Controls keep the project's `--radius`; pills are `rounded-full`. Fields are their own family (44px).
A display number, an art-directed width or a hero title is not a role: keep it local.

## Writing classes

- Literal strings inside `className`, `cn()` or `cva()` only. Never a class in a constant, an array or a
  nested ternary (the project's Tailwind prefix can't rewrite those).
- Logical directions: `ps`/`pe`/`ms`/`me`/`start`/`end`; arbitrary radii (`rounded-[8px]`).
- ES2022 only (no `toSorted`, `findLast`, `.with`).
