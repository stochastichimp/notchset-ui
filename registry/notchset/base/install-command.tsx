"use client"

/**
 * Install Command (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/install-command
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, copyText, useTimeline, prefersCalm } from "@/lib/notchset/shared"
import { CopyMark } from "@/lib/notchset/code"
import { useSound } from "@/lib/notchset/sound"

/*
 * Install Command: a package-manager switch over an inverse pill that holds the command with a blinking
 * caret. Switching retypes the command; Copy turns into a green check and the helper says where to
 * paste it.
 */

type Manager = "pnpm" | "npm" | "bun" | "yarn"

interface InstallCommandProps extends React.ComponentPropsWithoutRef<"div"> {
  /** The command per manager, e.g. { pnpm: "pnpm dlx shadcn@latest add …", … }. */
  commands: Partial<Record<Manager, string>>
  defaultManager?: Manager | undefined
  /** Under the pill before copying. */
  helper?: React.ReactNode | undefined
  copiedHelper?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const TAB = 58

const InstallCommand = React.forwardRef<HTMLDivElement, InstallCommandProps>(function InstallCommand(
  { commands, defaultManager, helper = "Runs in your project root.", copiedHelper = "Copied. Paste it in your project root.", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const managers = (Object.keys(commands) as Manager[]).filter((m) => commands[m])
  const [manager, setManager] = React.useState<Manager>(defaultManager && commands[defaultManager] ? defaultManager : (managers[0] ?? "pnpm"))
  const full = commands[manager] ?? ""
  const [typed, setTyped] = React.useState(full.length)
  const [copied, setCopied] = React.useState(false)
  const typer = React.useRef<ReturnType<typeof setInterval> | null>(null)
  React.useEffect(() => () => {
    if (typer.current) clearInterval(typer.current)
  }, [])

  const pick = (m: Manager) => {
    if (m === manager) return
    sfx.tick()
    setManager(m)
    setCopied(false)
    if (typer.current) clearInterval(typer.current)
    const target = commands[m] ?? ""
    // The clicked tab has focus: motion off on its page counts too.
    if (prefersCalm(document.activeElement)) {
      setTyped(target.length)
      return
    }
    let n = 0
    setTyped(0)
    typer.current = setInterval(() => {
      n = Math.min(target.length, n + 2)
      if (n % 8 === 0) sfx.key()
      setTyped(n)
      if (n >= target.length && typer.current) {
        clearInterval(typer.current)
        typer.current = null
      }
    }, 14)
  }

  const copy = async () => {
    if (!(await copyText(full))) {
      sfx.buzz()
      return
    }
    sfx.pop()
    setCopied(true)
    timeline.clear()
    timeline.after(1800, () => setCopied(false))
  }

  const index = Math.max(0, managers.indexOf(manager))
  return (
    <div ref={ref} data-slot="install-command" data-notchset="" className={cn("flex w-full flex-col gap-3", className)} {...props}>
      <div role="radiogroup" aria-label="Package manager" className="relative flex w-fit rounded-[var(--radius)] bg-[var(--muted)] p-0.5">
        <span aria-hidden="true" className="absolute inset-y-0.5 rounded-[max(calc(var(--radius)-2px),4px)] bg-[var(--background)] shadow-[0_1px_2px_rgba(0,0,0,.08)] [transition:inset-inline-start_.45s_cubic-bezier(.2,1.25,.3,1)]" style={{ width: TAB, insetInlineStart: 2 + index * TAB }} />
        {managers.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={m === manager}
            onClick={() => pick(m)}
            className={cn("relative h-[var(--ns-control-compact)] cursor-pointer rounded-[max(calc(var(--radius)-2px),4px)] font-mono text-[length:var(--ns-type-note)] outline-none [transition:color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", m === manager ? "text-[var(--foreground)]" : "text-[color-mix(in_oklab,var(--muted-foreground)_80%,var(--foreground))]")}
            style={{ width: TAB }}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="flex h-[52px] items-center gap-2 rounded-[var(--radius)] bg-[var(--foreground)] ps-5 pe-1.5 text-[var(--background)]">
        <code className="flex min-w-0 flex-1 items-center overflow-hidden font-mono text-[length:var(--ns-type-label)] whitespace-nowrap">
          <span aria-hidden="true" className="me-2 opacity-45">
            $
          </span>
          <span className="truncate">{full.slice(0, typed)}</span>
          <span aria-hidden="true" className="ms-0.5 inline-block h-4 w-2 shrink-0 animate-[ns-blink_1s_steps(1)_infinite] bg-[var(--chart-1,var(--background))]" />
          <span className="sr-only">{full}</span>
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={copied ? "Copied" : "Copy command"}
          className="grid size-[var(--ns-control-regular)] shrink-0 cursor-pointer place-items-center rounded-[max(calc(var(--radius)-6px),10px)] outline-none hover:bg-[color-mix(in_oklab,var(--background)_14%,transparent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[var(--background)]"
        >
          <CopyMark copied={copied} />
        </button>
      </div>
      <p className={cn("m-0 text-[length:var(--ns-type-note)]", copied ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{copied ? copiedHelper : helper}</p>
      <Announcer message={copied ? "Copied" : ""} />
    </div>
  )
})

export { InstallCommand, type InstallCommandProps, type Manager }
