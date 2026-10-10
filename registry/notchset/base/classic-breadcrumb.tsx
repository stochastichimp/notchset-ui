"use client"

/**
 * Classic Breadcrumb (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/classic-breadcrumb
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { CrumbIcon, useTrail, type Crumb } from "@/lib/notchset/crumbs"
import { useSound } from "@/lib/notchset/sound"

/*
 * Classic Breadcrumb: a quiet trail of muted links divided by a mono slash; hovering a link draws an
 * underline from the start. Long trails collapse to first / … / the last two, and … opens a menu of the
 * hidden levels, indented by depth. Going up fades and slides the left levels away; going deeper pops
 * the new crumb in with a tone that rises with depth.
 */

interface ClassicBreadcrumbProps extends Omit<React.ComponentPropsWithoutRef<"nav">, "children"> {
  items: readonly Crumb[]
  /** Called with the index of the crumb chosen. */
  onNavigate: (index: number, crumb: Crumb) => void
  /** Levels shown before collapsing. */
  maxVisible?: number | undefined
  sound?: boolean | undefined
}

const ClassicBreadcrumb = React.forwardRef<HTMLElement, ClassicBreadcrumbProps>(function ClassicBreadcrumb({ items, onNavigate, maxVisible = 4, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const { shown, leaving } = useTrail(items, (deeper, depth) => {
    if (deeper) sfx.tone(700 + depth * 110, 0.05, "triangle", 0.04)
    else sfx.drop()
  })
  const [more, setMore] = React.useState(false)
  const pop = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    if (!more) return
    const down = (e: PointerEvent) => {
      if (!pop.current?.contains(e.target as Node)) setMore(false)
    }
    const key = (e: KeyboardEvent) => e.key === "Escape" && setMore(false)
    document.addEventListener("pointerdown", down)
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("pointerdown", down)
      document.removeEventListener("keydown", key)
    }
  }, [more])

  const n = shown.length
  const collapse = n > maxVisible
  const visible: (number | "more")[] = collapse ? [0, "more", n - 2, n - 1] : shown.map((_, i) => i)
  const hidden = collapse ? shown.slice(1, n - 2) : []
  const go = (i: number) => {
    setMore(false)
    if (i < shown.length - 1) onNavigate(i, shown[i]!)
  }

  return (
    <nav ref={ref} aria-label="Breadcrumb" data-slot="classic-breadcrumb" data-notchset="" className={cn("relative", className)} {...props}>
      <ol className="m-0 flex min-w-0 list-none flex-nowrap items-center gap-2 p-0">
        {visible.map((d, j) => {
          const left = typeof d === "number" && leaving >= 0 && d > leaving
          return (
            <li
              key={d === "more" ? "more" : shown[d]!.id}
              className="relative flex min-w-0 animate-[ns-chip_.4s_var(--ns-ease-pop)_both] items-center gap-2 [transition:opacity_.22s,translate_.3s_cubic-bezier(.2,1.2,.3,1)] motion-reduce:animate-none"
              style={{ opacity: left ? 0 : 1, translate: left ? "8px 0" : "0 0" }}
            >
              {j > 0 && (
                <span aria-hidden="true" className="font-mono text-[length:var(--ns-type-label)] text-[color-mix(in_oklab,var(--foreground)_28%,transparent)]">
                  /
                </span>
              )}
              {d === "more" ? (
                <span ref={pop} className="relative flex">
                  <button
                    type="button"
                    aria-label="Show hidden levels"
                    aria-expanded={more}
                    onClick={() => {
                      if (more) sfx.close()
                      else sfx.open()
                      setMore(!more)
                    }}
                    className={cn("flex h-[26px] w-[30px] cursor-pointer items-center justify-center gap-[3px] rounded-[8px] outline-none [transition:background-color_.2s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", more && "bg-[var(--accent)]")}
                  >
                    <span className="size-[3.5px] rounded-full bg-current" />
                    <span className="size-[3.5px] rounded-full bg-current" />
                    <span className="size-[3.5px] rounded-full bg-current" />
                  </button>
                  <div
                    ref={(el) => {
  el?.toggleAttribute("inert", !more)
}}
                    className="absolute -start-1.5 top-[34px] z-[6] w-[220px] origin-[12px_0] [transition:opacity_.2s,translate_.4s_var(--ns-ease-reshape),scale_.4s_var(--ns-ease-reshape)]"
                    style={{ opacity: more ? 1 : 0, translate: more ? "0 0" : "0 -6px", scale: more ? "1" : ".94", pointerEvents: more ? "auto" : "none" }}
                  >
                    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--background)] p-1 shadow-[0_22px_44px_-18px_rgba(0,0,0,.45)]">
                      <span className="block px-[9px] pt-1.5 pb-1 font-mono text-[10.5px] tracking-[.06em] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] uppercase">Hidden levels</span>
                      {hidden.map((c, k) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => go(k + 1)}
                          className="flex h-9 w-full cursor-pointer items-center gap-[9px] rounded-[10px] pe-[9px] text-start text-[13.5px] outline-none [transition:opacity_.25s,translate_.4s_var(--ns-ease-reshape),background-color_.2s] hover:bg-[var(--accent)] focus-visible:bg-[var(--accent)]"
                          style={{ paddingInlineStart: 9 + k * 14, opacity: more ? 1 : 0, translate: more ? "0 0" : "0 -6px", transitionDelay: `${k * 40 + 60}ms` }}
                        >
                          <CrumbIcon crumb={c} />
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </span>
              ) : d === n - 1 ? (
                <span aria-current="page" className="flex items-center gap-[7px] text-[length:var(--ns-type-copy)] font-semibold whitespace-nowrap">
                  <CrumbIcon crumb={shown[d]!} />
                  {shown[d]!.label}
                </span>
              ) : (
                <a
                  href={shown[d]!.href ?? "#"}
                  onClick={(e) => {
                    if (!shown[d]!.href) e.preventDefault()
                    go(d)
                  }}
                  className="flex items-center gap-[7px] rounded-[4px] bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat py-[3px] text-[length:var(--ns-type-copy)] whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] no-underline outline-none [transition:color_.2s,background-size_.35s_cubic-bezier(.6,0,.2,1)] hover:bg-[length:100%_1px] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] rtl:bg-[position:100%_100%] max-[480px]:[&:not(:last-child)]:hidden"
                >
                  {shown[d]!.kind === "workspace" && <CrumbIcon crumb={shown[d]!} />}
                  {shown[d]!.label}
                </a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
})

export { ClassicBreadcrumb, type ClassicBreadcrumbProps }
