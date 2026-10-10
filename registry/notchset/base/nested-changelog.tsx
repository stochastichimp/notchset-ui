"use client"

/**
 * Nested Changelog (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/nested-changelog
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { accordionKeys, Collapse } from "@/lib/notchset/collapse"
import { useSound } from "@/lib/notchset/sound"

/*
 * Nested Changelog: versions that open into categories that open into items. The version chip inverts
 * when open and count pills summarise each release; inside, every category opens on its own, a spine in
 * its colour draws down and its items slide in one after another.
 */

type ChangeKind = "added" | "fixed" | "changed" | "removed"

interface Release {
  id: string
  version: string
  title: React.ReactNode
  date: string
  changes: readonly { kind: ChangeKind; items: readonly React.ReactNode[] }[]
}

interface NestedChangelogProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title"> {
  releases: readonly Release[]
  title?: React.ReactNode | undefined
  /** Open at first: release ids, and "release:kind" pairs. */
  defaultOpen?: readonly string[] | undefined
  sound?: boolean | undefined
}

const KINDS: Record<ChangeKind, { label: string; color: string }> = {
  added: { label: "Added", color: "var(--success,var(--chart-3))" },
  fixed: { label: "Fixed", color: "var(--info,var(--chart-1))" },
  changed: { label: "Changed", color: "var(--warning,var(--chart-4))" },
  removed: { label: "Removed", color: "var(--destructive)" },
}

const NestedChangelog = React.forwardRef<HTMLDivElement, NestedChangelogProps>(function NestedChangelog({ releases, title = "Changelog", defaultOpen = [], sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const base = React.useId()
  const [open, setOpen] = React.useState<readonly string[]>(defaultOpen)
  const toggle = (key: string) => {
    const on = open.includes(key)
    setOpen((o) => (on ? o.filter((x) => x !== key) : [...o, key]))
    if (on) sfx.close()
    else sfx.open()
  }

  return (
    <div ref={ref} data-slot="nested-changelog" data-notchset="" onKeyDown={accordionKeys} className={cn("flex w-full max-w-[480px] flex-col gap-0.5 text-[var(--foreground)]", className)} {...props}>
      {title && <span className="px-1 pb-2.5 text-[15px] font-medium">{title}</span>}
      <div className="border-t border-[var(--border)]">
        {releases.map((r, i) => {
          const on = open.includes(r.id)
          return (
            <div key={r.id} className="border-b border-[var(--border)]">
              <h3 className="m-0">
                <button
                  id={`${base}-r-${i}`}
                  type="button"
                  data-accordion-trigger=""
                  aria-expanded={on}
                  aria-controls={`${base}-rp-${i}`}
                  onClick={() => toggle(r.id)}
                  className="flex min-h-[60px] w-full cursor-pointer items-center gap-3 rounded-[10px] px-1 py-2 text-start outline-none focus-visible:shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--foreground)_14%,transparent)]"
                >
                  <span className={cn("inline-flex h-6 shrink-0 items-center rounded-[7px] px-2 font-mono text-[length:var(--ns-type-note)] font-medium [transition:background-color_.3s,color_.3s]", on ? "bg-[var(--foreground)] text-[var(--background)]" : "bg-[var(--muted)] text-[var(--foreground)]")}>{r.version}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[length:var(--ns-type-copy)] font-medium">{r.title}</span>
                    <span className="font-mono text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{r.date}</span>
                  </span>
                  <span className="flex flex-wrap justify-end gap-1 max-[420px]:hidden">
                    {r.changes.map((c) => (
                      <span
                        key={c.kind}
                        className="inline-flex h-5 items-center rounded-full px-[7px] font-mono text-[10.5px] font-semibold whitespace-nowrap"
                        style={{ background: `color-mix(in oklab, ${KINDS[c.kind].color} 14%, transparent)`, color: `color-mix(in oklab, ${KINDS[c.kind].color} 72%, var(--foreground))` }}
                      >
                        {c.items.length} {c.kind}
                      </span>
                    ))}
                  </span>
                  <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-4 shrink-0 text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [transition:rotate_.45s_var(--ns-ease-pop)]", on && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </h3>
              <Collapse id={`${base}-rp-${i}`} open={on} labelledBy={`${base}-r-${i}`}>
                <div className="flex flex-col gap-1 ps-3 pe-1 pb-3.5">
                  {r.changes.map((c, j) => {
                    const key = `${r.id}:${c.kind}`
                    const sub = open.includes(key)
                    const shown = sub && on
                    const k = KINDS[c.kind]
                    return (
                      <div key={c.kind}>
                        <h4 className="m-0">
                          <button
                            id={`${base}-c-${i}-${j}`}
                            type="button"
                            data-accordion-trigger=""
                            aria-expanded={sub}
                            aria-controls={`${base}-cp-${i}-${j}`}
                            onClick={() => toggle(key)}
                            className="flex h-[34px] w-full cursor-pointer items-center gap-2 rounded-[9px] px-1.5 text-start text-[length:var(--ns-type-label)] font-medium outline-none [transition:background-color_.2s] hover:bg-[var(--accent)] focus-visible:bg-[var(--accent)]"
                          >
                            <span aria-hidden="true" className="size-2 rounded-[2px]" style={{ background: k.color }} />
                            {k.label}
                            <span className="font-mono text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{c.items.length}</span>
                            <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("ms-auto size-3.5 text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [transition:rotate_.45s_var(--ns-ease-pop)]", sub && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>
                        </h4>
                        <Collapse id={`${base}-cp-${i}-${j}`} open={sub} labelledBy={`${base}-c-${i}-${j}`}>
                          <ul className="relative m-0 list-none ps-[26px] pt-1 pb-2">
                            <span
                              aria-hidden="true"
                              className="absolute start-[9.5px] top-1.5 bottom-3 w-[1.5px] origin-top rounded-[1px] [transition:scale_.55s_cubic-bezier(.6,0,.2,1)_.05s] motion-reduce:transition-none"
                              style={{ background: `color-mix(in oklab, ${k.color} 45%, var(--border))`, scale: shown ? "1 1" : "1 0" }}
                            />
                            {c.items.map((item, n) => (
                              <li
                                key={n}
                                className="py-1 text-[length:var(--ns-type-label)] leading-[var(--ns-leading-prose)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] motion-reduce:transition-none!"
                                style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateX(-6px)", transition: `opacity .3s ease ${120 + n * 60}ms, transform .45s cubic-bezier(.2,1.2,.3,1) ${120 + n * 60}ms` }}
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </Collapse>
                      </div>
                    )
                  })}
                </div>
              </Collapse>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export { NestedChangelog, type ChangeKind, type NestedChangelogProps, type Release }
