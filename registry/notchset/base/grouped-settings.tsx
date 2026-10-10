"use client"

/**
 * Grouped Settings (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/grouped-settings
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { accordionKeys, Collapse } from "@/lib/notchset/collapse"
import { RollingLabel } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Grouped Settings: setting groups in one card. Each header has a tinted icon tile, a count and a
 * chevron; opening a group staggers its rows in. Expand all / Collapse all rolls its label and cascades
 * the groups 70ms apart, a sound per group.
 */

interface SettingGroup {
  id: string
  title: React.ReactNode
  icon?: React.ReactNode | undefined
  /** A chart colour for the icon tile. */
  color?: string | undefined
  rows: readonly { label: React.ReactNode; value: React.ReactNode; status?: boolean | undefined }[]
}

interface GroupedSettingsProps extends Omit<React.ComponentPropsWithoutRef<"div">, "title" | "defaultValue"> {
  title?: React.ReactNode | undefined
  groups: readonly SettingGroup[]
  defaultOpen?: readonly string[] | undefined
  sound?: boolean | undefined
}

const GroupedSettings = React.forwardRef<HTMLDivElement, GroupedSettingsProps>(function GroupedSettings({ title, groups, defaultOpen = [], sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const base = React.useId()
  const [open, setOpen] = React.useState<readonly string[]>(defaultOpen)
  const [bulk, setBulk] = React.useState(0)
  const all = groups.length > 0 && groups.every((g) => open.includes(g.id))

  React.useEffect(() => {
    if (!bulk) return
    const t = window.setTimeout(() => setBulk(0), 800)
    return () => window.clearTimeout(t)
  }, [bulk])

  const toggleAll = () => {
    const next = !all
    setOpen(next ? groups.map((g) => g.id) : [])
    setBulk((n) => n + 1)
    groups.forEach((_, i) => window.setTimeout(() => (next ? sfx.open() : sfx.close()), i * 70))
  }

  return (
    <div ref={ref} data-slot="grouped-settings" data-notchset="" className={cn("flex w-full max-w-[440px] flex-col gap-2.5 text-[var(--foreground)]", className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        {title && <span className="text-[15px] font-medium">{title}</span>}
        <button
          type="button"
          onClick={toggleAll}
          className="ms-auto inline-flex h-[34px] cursor-pointer items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap outline-none [transition:background-color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95"
        >
          <RollingLabel index={all ? 1 : 0} size="sm" rows={["Expand all", "Collapse all"]} />
        </button>
      </div>
      <div onKeyDown={accordionKeys} className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--background)]">
        {groups.map((g, i) => {
          const on = open.includes(g.id)
          const c = g.color ?? `var(--chart-${(i % 5) + 1})`
          return (
            <div key={g.id} className={cn("-mt-px border-t border-[var(--border)] [transition:background-color_.3s]", on ? "bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)]" : "bg-transparent")}>
              <h3 className="m-0">
                <button
                  id={`${base}-t-${i}`}
                  type="button"
                  data-accordion-trigger=""
                  aria-expanded={on}
                  aria-controls={`${base}-p-${i}`}
                  onClick={() => {
                    setBulk(0)
                    setOpen((o) => (on ? o.filter((x) => x !== g.id) : [...o, g.id]))
                    if (on) sfx.close()
                    else sfx.open()
                  }}
                  className="flex h-[52px] w-full cursor-pointer items-center gap-3 px-3.5 text-start outline-none focus-visible:shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--foreground)_14%,transparent)]"
                >
                  <span aria-hidden="true" className="grid size-[30px] shrink-0 place-items-center rounded-[9px] [&_svg]:size-4" style={{ background: `color-mix(in oklab, ${c} 15%, transparent)`, color: c }}>
                    {g.icon}
                  </span>
                  <span className="flex-1 text-[length:var(--ns-type-copy)] font-medium">{g.title}</span>
                  <span className="font-mono text-[11px] whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
                    {g.rows.length} {g.rows.length === 1 ? "setting" : "settings"}
                  </span>
                  <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-4 text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [transition:rotate_.45s_var(--ns-ease-pop)]", on && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </h3>
              <Collapse id={`${base}-p-${i}`} open={on} labelledBy={`${base}-t-${i}`} delay={bulk ? i * 70 : 0}>
                <dl className="m-0 ps-14 pe-3.5 pb-1.5">
                  {g.rows.map((r, k) => (
                    <div
                      key={k}
                      className="flex justify-between gap-3 border-t border-[var(--border)] py-2.5 text-[length:var(--ns-type-label)] motion-reduce:transition-none!"
                      style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(-6px)", transition: `opacity .3s ease ${80 + k * 50}ms, transform .45s cubic-bezier(.2,1.2,.3,1) ${80 + k * 50}ms` }}
                    >
                      <dt className="text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{r.label}</dt>
                      <dd className="m-0 flex items-center gap-1.5 font-medium whitespace-nowrap">
                        {r.status && <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--success,var(--foreground))]" />}
                        {r.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Collapse>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export { GroupedSettings, type GroupedSettingsProps, type SettingGroup }
