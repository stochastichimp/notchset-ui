"use client"

/**
 * Dot Breadcrumb (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/dot-breadcrumb
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useCalm } from "@/lib/notchset/shared"
import { useTrail, type Crumb } from "@/lib/notchset/crumbs"
import { useSound } from "@/lib/notchset/sound"

/*
 * Dot Breadcrumb: the path as dots on a line. The workspace is a square with its initial, projects are
 * dots in their colour, and the current level is larger with a pulsing halo, its name beside it. Dots
 * swell as the pointer nears and a tooltip slides to the nearest one; clicking a dot pulls the trail back
 * to it as the line shortens. A visually hidden text trail carries it for screen readers.
 */

interface DotBreadcrumbProps extends Omit<React.ComponentPropsWithoutRef<"nav">, "children"> {
  items: readonly Crumb[]
  onNavigate: (index: number, crumb: Crumb) => void
  /** Draw a dashed stub after the current level (it has children). */
  hasChildren?: boolean | undefined
  sound?: boolean | undefined
}

const PAD = 14

const DotBreadcrumb = React.forwardRef<HTMLElement, DotBreadcrumbProps>(function DotBreadcrumb({ items, onNavigate, hasChildren = false, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const { shown, leaving } = useTrail(items, (deeper, depth) => {
    if (deeper) sfx.tone(700 + depth * 110, 0.05, "triangle", 0.04)
    else sfx.drop()
  })
  const [mx, setMx] = React.useState(-1)
  const [gap, setGap] = React.useState(46)
  const near = React.useRef(-1)
  const box = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setGap(el.clientWidth < 420 ? 34 : 46))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const reduce = useCalm()

  const keep = leaving >= 0 ? leaving + 1 : shown.length
  const cur = shown[keep - 1]
  let nearest = -1
  let nd = 26
  shown.forEach((_, i) => {
    const d = mx < 0 ? 999 : Math.abs(mx - (PAD + i * gap))
    if (i !== keep - 1 && i < keep && d < nd) {
      nd = d
      nearest = i
    }
  })

  return (
    <nav ref={ref} aria-label="Breadcrumb" data-slot="dot-breadcrumb" data-notchset="" className={cn("w-full", className)} {...props}>
      <ol className="sr-only">
        {shown.slice(0, keep).map((c, i) => (
          <li key={c.id} aria-current={i === keep - 1 ? "page" : undefined}>
            {c.label}
          </li>
        ))}
      </ol>
      <div
        ref={box}
        dir="ltr"
        aria-hidden="false"
        onPointerMove={(e) => {
          if (reduce) return
          const r = e.currentTarget.getBoundingClientRect()
          const x = Math.round(e.clientX - r.left)
          let nn = -1
          shown.forEach((_, i) => {
            if (Math.abs(x - (PAD + i * gap)) < 26) nn = i
          })
          if (nn !== near.current) {
            near.current = nn
            if (nn >= 0) sfx.tone(1000 + nn * 90, 0.012, "triangle", 0.02)
          }
          if (Math.abs(x - mx) > 1) setMx(x)
        }}
        onPointerLeave={() => {
          near.current = -1
          setMx(-1)
        }}
        className="relative mt-0.5 mb-1 h-[60px] w-full"
      >
        <span aria-hidden="true" className="absolute top-[39px] start-[14px] h-0.5 rounded-[2px] bg-[var(--foreground)] [transition:width_.5s_var(--ns-ease-settle)]" style={{ width: (keep - 1) * gap }} />
        <span aria-hidden="true" className="absolute top-[39px] h-0 border-t-2 border-dashed border-[var(--border)] [transition:left_.5s_var(--ns-ease-settle),width_.35s]" style={{ left: PAD + (keep - 1) * gap + 12, width: hasChildren ? 26 : 0 }} />
        {shown.map((c, i) => {
          const isCur = i === keep - 1
          const gone = i >= keep
          const d = mx < 0 ? 999 : Math.abs(mx - (PAD + i * gap))
          const scale = gone ? 0 : 1 + 0.8 * Math.max(0, 1 - d / 64)
          const size = i === 0 ? 22 : isCur ? 16 : 12
          const bg = i === 0 ? "var(--foreground)" : c.kind === "project" ? (c.color ?? "var(--chart-1)") : c.kind === "file" ? "var(--chart-1)" : "var(--muted-foreground)"
          return (
            <span key={c.id} className="absolute top-10 -translate-x-1/2 -translate-y-1/2 [transition:left_.5s_var(--ns-ease-settle)]" style={{ left: PAD + i * gap }}>
              <button
                type="button"
                aria-label={c.label}
                aria-current={isCur ? "page" : undefined}
                tabIndex={gone ? -1 : 0}
                onClick={() => !isCur && !gone && onNavigate(i, c)}
                className={cn("grid size-[30px] place-items-center rounded-full outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", isCur ? "cursor-default" : "cursor-pointer")}
              >
                <span className="grid animate-[ns-chip_.45s_var(--ns-ease-rebound)_both] place-items-center motion-reduce:animate-none">
                  <span
                    aria-hidden="true"
                    className={cn("grid place-items-center text-[11px] font-bold text-[var(--background)] shadow-[0_0_0_3px_var(--background)] [transition:scale_.25s_cubic-bezier(.2,1.4,.3,1),width_.35s,height_.35s]", isCur && i > 0 && "animate-[ns-halo-dot_1.6s_ease-out_infinite] motion-reduce:animate-none")}
                    style={{ width: size, height: size, borderRadius: i === 0 ? 7 : "50%", background: bg, scale: String(scale) }}
                  >
                    {i === 0 ? c.label[0]?.toUpperCase() : null}
                  </span>
                </span>
              </button>
            </span>
          )
        })}
        {cur && (
          <span key={cur.id} aria-hidden="true" className="absolute top-[30px] flex h-5 animate-[ns-reveal_.45s_cubic-bezier(.2,.8,.2,1)_both] items-baseline gap-[7px] leading-5 whitespace-nowrap [transition:left_.5s_var(--ns-ease-settle)]" style={{ left: PAD + (keep - 1) * gap + (hasChildren ? 46 : 18) }}>
            <span className="text-[length:var(--ns-type-copy)] font-semibold">{cur.label}</span>
            <span className="font-mono text-[10.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">L{keep}</span>
          </span>
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 flex h-6 -translate-x-1/2 items-center rounded-full bg-[var(--foreground)] px-[9px] text-[length:var(--ns-type-note)] font-semibold whitespace-nowrap text-[var(--background)] [transition:left_.25s_cubic-bezier(.2,1.2,.3,1),opacity_.15s,translate_.25s_cubic-bezier(.2,1.4,.3,1)]"
          style={{ left: PAD + Math.max(0, nearest) * gap, opacity: nearest >= 0 ? 1 : 0, translate: nearest >= 0 ? "-50% 0" : "-50% 4px" }}
        >
          {nearest >= 0 ? shown[nearest]!.label : ""}
        </span>
      </div>
    </nav>
  )
})

export { DotBreadcrumb, type DotBreadcrumbProps }
