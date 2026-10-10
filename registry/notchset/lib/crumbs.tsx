"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * The breadcrumb model every breadcrumb style shares: a Crumb, its kind icon, and useTrail, which keeps
 * the levels you're leaving on screen long enough to fade and slide away (.23s) before the path updates,
 * and reports the depth so going deeper can pop the new crumb in with a rising tone.
 */

type CrumbKind = "workspace" | "folder" | "project" | "file"

interface Crumb {
  id: string
  label: string
  href?: string | undefined
  kind?: CrumbKind | undefined
  /** A project's colour, e.g. "var(--chart-1)". */
  color?: string | undefined
  /** Other items at this level, for the drum and editor styles. */
  siblings?: readonly Crumb[] | undefined
}

/** The kind icon: workspace initial tile, folder, coloured project square, or file. */
function CrumbIcon({ crumb, inverted = false, className }: { crumb: Crumb; inverted?: boolean | undefined; className?: string | undefined }) {
  const k = crumb.kind
  if (k === "workspace")
    return (
      <span aria-hidden="true" className={cn("grid size-[18px] shrink-0 place-items-center rounded-[5px] text-[10px] font-bold", inverted ? "bg-[var(--background)] text-[var(--foreground)]" : "bg-[var(--foreground)] text-[var(--background)]", className)}>
        {crumb.label[0]?.toUpperCase()}
      </span>
    )
  if (k === "project") return <span aria-hidden="true" className={cn("size-[9px] shrink-0 rounded-[3px]", className)} style={{ background: inverted ? "currentColor" : (crumb.color ?? "var(--chart-1)") }} />
  if (k === "folder")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-3.5 shrink-0", !inverted && "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]", className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      </svg>
    )
  if (k === "file")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-3.5 shrink-0", !inverted && "text-[var(--chart-1)]", className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    )
  return null
}

/**
 * The trail on screen. When `items` gets shorter, the old trail stays for 230ms with `leaving` set to the
 * index the path is going back to, so the levels beyond it can fade out; then it catches up.
 */
function useTrail(items: readonly Crumb[], onChange?: (deeper: boolean, depth: number) => void) {
  const key = items.map((c) => c.id).join("/")
  const [last, setLast] = React.useState(items)
  const [old, setOld] = React.useState<readonly Crumb[] | null>(null)
  const lastKey = last.map((c) => c.id).join("/")
  if (key !== lastKey) {
    // Going up keeps the old trail for a beat so the levels beyond can leave.
    setOld(lastKey.startsWith(key + "/") ? last : null)
    setLast(items)
  }
  React.useEffect(() => {
    if (!old) return
    const t = window.setTimeout(() => setOld(null), 230)
    return () => window.clearTimeout(t)
  }, [old])

  const latest = React.useRef(onChange)
  const seen = React.useRef(key)
  React.useEffect(() => {
    latest.current = onChange
  })
  const depth = items.length
  React.useEffect(() => {
    const was = seen.current
    seen.current = key
    if (was !== key) latest.current?.(!was.startsWith(key + "/"), depth)
  }, [key, depth])
  return { shown: old ?? items, leaving: old ? items.length - 1 : -1 }
}

export { CrumbIcon, useTrail, type Crumb, type CrumbKind }
