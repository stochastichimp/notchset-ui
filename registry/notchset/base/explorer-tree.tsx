"use client"

/**
 * Explorer Tree (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/explorer-tree
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { inertRef } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Explorer Tree: a file tree with git status. Folders fold open and shut; a single selection slab
 * slides to the selected row; a closed folder with changes inside shows an amber dot. Arrow keys move,
 * → opens, ← closes or goes to the parent, Enter toggles.
 */

type GitStatus = "M" | "A" | "U"

interface TreeNode {
  /** The path, e.g. "app/routes/dashboard.tsx"; folders are the nodes with children. */
  path: string
  children?: readonly TreeNode[] | undefined
  size?: string | undefined
  status?: GitStatus | undefined
}

interface ExplorerTreeProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onSelect"> {
  nodes: readonly TreeNode[]
  defaultOpen?: readonly string[] | undefined
  defaultSelected?: string | undefined
  onSelect?: ((path: string) => void) | undefined
  /** The header label. Default "Explorer". */
  label?: string | undefined
  sound?: boolean | undefined
}

type Flat = { node: TreeNode; depth: number; parent: string | null }

const ROW = 32
const EXT_TONE: Record<string, 1 | 2 | 3 | 4> = { tsx: 1, jsx: 1, css: 2, ts: 3, js: 3, svg: 4, json: 4 }

function flatten(nodes: readonly TreeNode[], depth: number, parent: string | null, out: Flat[]) {
  for (const node of nodes) {
    out.push({ node, depth, parent })
    if (node.children) flatten(node.children, depth + 1, node.path, out)
  }
  return out
}

function hasChanges(node: TreeNode): boolean {
  return Boolean(node.status) || Boolean(node.children?.some(hasChanges))
}

const nameOf = (path: string) => path.split("/").pop() ?? path

const ExplorerTree = React.forwardRef<HTMLDivElement, ExplorerTreeProps>(function ExplorerTree(
  { nodes, defaultOpen, defaultSelected, onSelect, label = "Explorer", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const all = React.useMemo(() => flatten(nodes, 0, null, []), [nodes])
  const [open, setOpen] = React.useState<Set<string>>(() => new Set(defaultOpen ?? all.filter((f) => f.node.children).map((f) => f.node.path)))
  const [selected, setSelected] = React.useState(defaultSelected ?? all[0]?.node.path ?? "")
  const rowsRef = React.useRef(new Map<string, HTMLDivElement>())
  const shown = (f: Flat): boolean => {
    let p = f.parent
    while (p) {
      if (!open.has(p)) return false
      p = all.find((x) => x.node.path === p)?.parent ?? null
    }
    return true
  }
  const visible = all.filter(shown)
  const index = Math.max(0, visible.findIndex((f) => f.node.path === selected))
  const counts = { M: 0, A: 0, U: 0 }
  for (const f of all) if (f.node.status) counts[f.node.status] += 1

  const select = (path: string, focus = false) => {
    if (path !== selected) sfx.select()
    setSelected(path)
    onSelect?.(path)
    if (focus) requestAnimationFrame(() => rowsRef.current.get(path)?.focus())
  }
  const setFolder = (path: string, on: boolean) => {
    if (open.has(path) === on) return
    const next = new Set(open)
    if (on) {
      next.add(path)
      sfx.open()
    } else {
      next.delete(path)
      sfx.close()
    }
    setOpen(next)
  }

  const onKey = (event: React.KeyboardEvent, f: Flat) => {
    const i = visible.findIndex((x) => x.node.path === f.node.path)
    const folder = Boolean(f.node.children)
    const rtl = (event.currentTarget as HTMLElement).closest("[dir=rtl]") != null
    const intoKey = rtl ? "ArrowLeft" : "ArrowRight"
    const outKey = rtl ? "ArrowRight" : "ArrowLeft"
    if (event.key === "ArrowDown" && visible[i + 1]) select(visible[i + 1]!.node.path, true)
    else if (event.key === "ArrowUp" && visible[i - 1]) select(visible[i - 1]!.node.path, true)
    else if (event.key === intoKey && folder) setFolder(f.node.path, true)
    else if (event.key === outKey) {
      if (folder && open.has(f.node.path)) setFolder(f.node.path, false)
      else if (f.parent) select(f.parent, true)
    } else if ((event.key === "Enter" || event.key === " ") && folder) setFolder(f.node.path, !open.has(f.node.path))
    else if (event.key === "Home" && visible[0]) select(visible[0].node.path, true)
    else if (event.key === "End" && visible.length) select(visible[visible.length - 1]!.node.path, true)
    else return
    event.preventDefault()
  }

  return (
    <div ref={ref} data-slot="explorer-tree" data-notchset="" className={cn("w-full overflow-hidden rounded-[min(var(--radius),16px)] border border-[var(--border)] bg-[var(--background)]", className)} {...props}>
      <div className="flex h-10 items-center justify-between gap-3 border-b border-[var(--border)] px-3.5">
        <span className="font-mono text-[10.5px] tracking-[.07em] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] uppercase">{label}</span>
        <span className="flex gap-2.5 font-mono text-[10.5px] font-semibold">
          {counts.M > 0 && <span className="text-[color-mix(in_oklab,var(--warning,var(--foreground))_62%,var(--foreground))]">{counts.M} M</span>}
          {counts.A > 0 && <span className="text-[color-mix(in_oklab,var(--success,var(--foreground))_72%,var(--foreground))]">{counts.A} A</span>}
          {counts.U > 0 && <span className="text-[color-mix(in_oklab,var(--info,var(--foreground))_72%,var(--foreground))]">{counts.U} U</span>}
        </span>
      </div>
      <div role="tree" aria-label={label} className="relative py-1">
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-1 top-1 h-8 rounded-[min(var(--radius),8px)] bg-[var(--accent)] [transition:transform_.35s_cubic-bezier(.2,1.25,.3,1),scale_.35s_cubic-bezier(.2,1.25,.3,1),translate_.35s_cubic-bezier(.2,1.25,.3,1),rotate_.35s_cubic-bezier(.2,1.25,.3,1)]" style={{ transform: `translateY(${index * ROW}px)` }} />
        {all.map((f) => {
          const isShown = shown(f)
          const folder = Boolean(f.node.children)
          const isOpen = folder && open.has(f.node.path)
          const ext = nameOf(f.node.path).split(".").pop() ?? ""
          const tone = EXT_TONE[ext] ?? 3
          const on = f.node.path === selected
          return (
            <div key={f.node.path} className={cn("grid [transition:grid-template-rows_.35s_var(--ns-ease-settle)]", isShown ? "grid-rows-[1fr]" : "grid-rows-[0fr]")} ref={inertRef(!isShown)}>
              <div className="min-h-0 overflow-hidden">
                <div
                  ref={(n) => {
                    if (n) rowsRef.current.set(f.node.path, n)
                    else rowsRef.current.delete(f.node.path)
                  }}
                  role="treeitem"
                  aria-level={f.depth + 1}
                  aria-expanded={folder ? isOpen : undefined}
                  aria-selected={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => {
                    select(f.node.path)
                    if (folder) setFolder(f.node.path, !isOpen)
                  }}
                  onKeyDown={(event) => onKey(event, f)}
                  className="relative flex h-8 cursor-pointer items-center gap-1.5 pe-3 text-[length:var(--ns-type-label)] whitespace-nowrap outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-inset"
                  style={{ paddingInlineStart: 6 + f.depth * 18 }}
                >
                  {Array.from({ length: f.depth }, (_, d) => (
                    <span key={d} aria-hidden="true" className="absolute inset-y-0 w-px bg-[var(--border)]" style={{ insetInlineStart: 13 + d * 18 }} />
                  ))}
                  <span aria-hidden="true" className="grid size-3.5 shrink-0 place-items-center text-[var(--muted-foreground)]">
                    {folder && (
                      <svg viewBox="0 0 24 24" className={cn("size-3 [transition:transform_.3s_var(--ns-ease-pop),scale_.3s_var(--ns-ease-pop),translate_.3s_var(--ns-ease-pop),rotate_.3s_var(--ns-ease-pop)] rtl:-scale-x-100", isOpen && "rotate-90 rtl:-rotate-90")} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    )}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0",
                      folder && "text-[var(--muted-foreground)]",
                      !folder && tone === 1 && "text-[var(--chart-1)]",
                      !folder && tone === 2 && "text-[var(--chart-2)]",
                      !folder && tone === 3 && "text-[var(--chart-3)]",
                      !folder && tone === 4 && "text-[var(--chart-4)]"
                    )}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {folder ? (
                      isOpen ? (
                        <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
                      ) : (
                        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                      )
                    ) : (
                      <>
                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                      </>
                    )}
                  </svg>
                  <span className={cn("truncate", on ? "font-semibold text-[var(--foreground)]" : "text-[color-mix(in_oklab,var(--muted-foreground)_70%,var(--foreground))]")}>{nameOf(f.node.path)}</span>
                  {folder && !isOpen && hasChanges(f.node) && (
                    <span className="size-[5px] shrink-0 rounded-full bg-[var(--warning,var(--foreground))]">
                      <span className="sr-only">, has changes</span>
                    </span>
                  )}
                  <span className="ms-auto flex items-center gap-2">
                    {f.node.size && <span className="font-mono text-[10px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{f.node.size}</span>}
                    {f.node.status && (
                      <span
                        className={cn(
                          "w-3 text-center font-mono text-[10.5px] font-semibold",
                          f.node.status === "M" && "text-[color-mix(in_oklab,var(--warning,var(--foreground))_62%,var(--foreground))]",
                          f.node.status === "A" && "text-[color-mix(in_oklab,var(--success,var(--foreground))_72%,var(--foreground))]",
                          f.node.status === "U" && "text-[color-mix(in_oklab,var(--info,var(--foreground))_72%,var(--foreground))]"
                        )}
                      >
                        {f.node.status}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex h-10 items-center border-t border-[var(--border)] px-3.5 font-mono text-[11px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
        <span className="truncate">{selected.split("/").join(" / ")}</span>
      </div>
    </div>
  )
})

export { ExplorerTree, type ExplorerTreeProps, type GitStatus, type TreeNode }
