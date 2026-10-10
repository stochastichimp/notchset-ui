"use client"

/**
 * Code Block (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/code-block
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, copyText, RollingLabel, useIsomorphicLayoutEffect, useTimeline } from "@/lib/notchset/shared"
import { CopyMark, tokenizeLine, TokenSpan, type Language } from "@/lib/notchset/code"
import { useSound } from "@/lib/notchset/sound"

/*
 * Code Block: files in tabs with an underline that slides between them, numbered lines that light up on
 * hover, highlighted lines, and Copy: the icon turns into a green check, the label rolls to Copied and a
 * tint sweeps across the code.
 */

interface CodeFile {
  name: string
  code: string
  language?: Language | undefined
  /** 1-based line numbers to highlight. */
  highlight?: readonly number[] | undefined
}

interface CodeBlockProps extends React.ComponentPropsWithoutRef<"div"> {
  files: readonly CodeFile[]
  defaultFile?: number | undefined
  sound?: boolean | undefined
}

const EXT_TONE: Record<string, 1 | 2 | 3 | 4> = { tsx: 1, jsx: 1, css: 2, ts: 3, js: 3, json: 4, sh: 4 }

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock({ files, defaultFile = 0, sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [active, setActive] = React.useState(Math.max(0, Math.min(files.length - 1, defaultFile)))
  const [copied, setCopied] = React.useState(false)
  const [sweep, setSweep] = React.useState(0)
  const [bar, setBar] = React.useState<{ left: number; width: number } | null>(null)
  const tabs = React.useRef<HTMLDivElement>(null)
  const file = files[active]
  const lang: Language = file?.language ?? ((file?.name.split(".").pop() ?? "text") as Language)
  const lines = (file?.code ?? "").replace(/\n$/, "").split("\n")

  useIsomorphicLayoutEffect(() => {
    const el = tabs.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`)
    if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth })
  }, [active, files])

  const copy = async () => {
    if (!file || !(await copyText(file.code))) {
      sfx.buzz()
      return
    }
    sfx.pop()
    timeline.clear()
    setCopied(true)
    setSweep((n) => n + 1)
    timeline.after(1800, () => setCopied(false))
  }

  return (
    <div ref={ref} data-slot="code-block" data-notchset="" className={cn("w-full overflow-hidden rounded-[min(var(--radius),16px)] border border-[var(--border)] bg-[var(--background)]", className)} {...props}>
      <div className="flex h-12 items-center justify-between gap-3 border-b border-[var(--border)] pe-2">
        <div ref={tabs} role="tablist" aria-label="Files" className="relative flex h-full items-stretch overflow-x-auto ps-2">
          {files.map((f, i) => {
            const tone = EXT_TONE[f.name.split(".").pop() ?? ""] ?? 1
            return (
              <button
                key={f.name}
                type="button"
                role="tab"
                data-tab={i}
                aria-selected={i === active}
                onClick={() => {
                  if (i === active) return
                  sfx.tick()
                  setActive(i)
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-[var(--ns-inset-compact)] font-mono text-[length:var(--ns-type-note)] whitespace-nowrap outline-none [transition:color_.2s] focus-visible:bg-[var(--accent)]",
                  i === active ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] hover:text-[var(--foreground)]"
                )}
              >
                <span aria-hidden="true" className={cn("size-[7px] rounded-[2px]", tone === 1 && "bg-[var(--chart-1)]", tone === 2 && "bg-[var(--chart-2)]", tone === 3 && "bg-[var(--chart-3)]", tone === 4 && "bg-[var(--chart-4)]")} />
                {f.name}
              </button>
            )
          })}
          {bar && <span aria-hidden="true" className="absolute bottom-0 h-0.5 bg-[var(--foreground)] [transition:left_.4s_cubic-bezier(.2,1.25,.3,1),width_.4s_cubic-bezier(.2,1.25,.3,1)]" style={{ left: bar.left, width: bar.width }} />}
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={copied ? "Copied" : `Copy ${file?.name ?? "code"}`}
          className="inline-flex h-[var(--ns-control-compact)] shrink-0 cursor-pointer items-center gap-1.5 rounded-[min(var(--radius),10px)] px-2.5 text-[length:var(--ns-type-note)] font-medium text-[var(--foreground)] outline-none hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <CopyMark copied={copied} />
          <RollingLabel size="sm" index={copied ? 1 : 0} rows={["Copy", "Copied"]} />
        </button>
      </div>
      <div role="tabpanel" tabIndex={0} aria-label={file?.name} className="relative overflow-x-auto py-2 outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-inset">
        {sweep > 0 && <span key={sweep} aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-0 animate-[ns-code-sweep_1s_cubic-bezier(.6,0,.2,1)_forwards] bg-[color-mix(in_oklab,var(--info,var(--foreground))_10%,transparent)]" />}
        <pre key={active} className="m-0 animate-[ns-reveal_.35s_both] font-mono text-[12.5px] leading-[22px]">
          <code>
            {lines.map((line, i) => {
              const marked = file?.highlight?.includes(i + 1)
              return (
                <span key={i} className={cn("group/line flex hover:bg-[var(--accent)]", marked && "bg-[color-mix(in_oklab,var(--info,var(--foreground))_8%,transparent)]")}>
                  <span aria-hidden="true" className={cn("w-10 shrink-0 pe-3 text-end select-none group-hover/line:text-[var(--foreground)]", marked ? "text-[var(--foreground)]" : "text-[color-mix(in_oklab,var(--muted-foreground)_80%,var(--foreground))]")}>
                    {i + 1}
                  </span>
                  <span className="pe-4 whitespace-pre">
                    {tokenizeLine(line, lang).map((t, j) => (
                      <TokenSpan key={j} token={t} />
                    ))}
                    {line === "" && " "}
                  </span>
                </span>
              )
            })}
          </code>
        </pre>
      </div>
      <Announcer message={copied ? "Copied" : ""} />
    </div>
  )
})

export { CodeBlock, type CodeBlockProps, type CodeFile }
