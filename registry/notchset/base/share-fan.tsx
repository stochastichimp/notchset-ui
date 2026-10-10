"use client"

/**
 * Share Fan-out (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/share-fan
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer, copyText, inertRef, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Share fan-out: a pill that opens sideways into its share targets. The label folds away and the icon
 * turns into a close X; the targets pop in one after another. Picking one turns it into a check, says
 * what happened, and folds the pill closed. On touch devices with a native share sheet, `native` opens
 * that instead.
 */

interface ShareTarget {
  id: string
  label: string
  icon: React.ReactNode
  /** Does the sharing. Resolve with what happened, e.g. "Link copied". */
  onSelect: () => Promise<string> | string
}

interface ShareFanProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  targets: readonly ShareTarget[]
  /** What the native share sheet gets, on touch devices that have one. */
  native?: ShareData | undefined
  /** Called with the outcome after a target is picked. */
  onShared?: ((target: string, result: string) => void) | undefined
  label?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className: "absolute inset-0 size-4", "aria-hidden": true } as const

const ShareIcons = {
  link: (
    <svg {...svg}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  mail: (
    <svg {...svg}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  message: (
    <svg {...svg}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  qr: (
    <svg {...svg}>
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  ),
}

/** A target that copies `url`. */
function copyLinkTarget(url: string): ShareTarget {
  return { id: "link", label: "Copy link", icon: ShareIcons.link, onSelect: async () => ((await copyText(url)) ? "Link copied" : "Couldn't copy") }
}

/** A target that opens an email draft with `url` in it. */
function emailTarget(url: string, subject = ""): ShareTarget {
  return {
    id: "email",
    label: "Email",
    icon: ShareIcons.mail,
    onSelect: () => {
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(url)}`
      return "Email draft opened"
    },
  }
}

const ShareFan = React.forwardRef<HTMLDivElement, ShareFanProps>(function ShareFan({ targets, native, onShared, label = "Share", sound = true, className, onKeyDown, ...props }, ref) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [open, setOpen] = React.useState(false)
  const [picked, setPicked] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState("")
  const toggleRef = React.useRef<HTMLButtonElement>(null)

  const close = (focus = false) => {
    timeline.clear()
    setOpen(false)
    setPicked(null)
    if (focus) toggleRef.current?.focus()
  }

  const toggle = async () => {
    if (!open && native && typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share(native)
      } catch {
        // Dismissed: nothing to do.
      }
      return
    }
    if (open) {
      sfx.drop()
      close()
    } else {
      sfx.arpeggio()
      setPicked(null)
      setMessage("")
      setOpen(true)
    }
  }

  const pick = async (target: ShareTarget) => {
    if (picked) return
    setPicked(target.id)
    sfx.pop()
    sfx.sparkleHi()
    const result = await target.onSelect()
    setMessage(result)
    onShared?.(target.id, result)
    timeline.after(950, () => close(true))
  }

  return (
    <div
      ref={ref}
      data-slot="share-fan"
      data-notchset=""
      data-state={open ? "open" : "closed"}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.key === "Escape" && open) {
          event.stopPropagation()
          sfx.drop()
          close(true)
        }
      }}
      className={cn("inline-flex h-11 max-w-full shrink-0 items-center gap-0.5 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] p-[3px] [transition:width_.5s_cubic-bezier(.2,1.2,.3,1)]", className)}
      style={{ width: open ? 8 + 36 + targets.length * 38 : 108 }}
      {...props}
    >
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close share options" : undefined}
        onClick={toggle}
        className={cn(
          "flex h-9 shrink-0 cursor-pointer items-center rounded-[var(--radius)] text-[length:var(--ns-type-copy)] font-medium whitespace-nowrap text-[var(--foreground)] outline-none [transition:padding_.4s_var(--ns-ease-settle),background-color_.2s,transform_.15s,scale_.15s,translate_.15s,rotate_.15s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.94] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          open ? "bg-[var(--accent)] px-2.5" : "ps-3 pe-3.5 hover:bg-[var(--accent)]"
        )}
      >
        <span aria-hidden="true" className="relative block size-4 shrink-0">
          <svg {...svg} className={cn(svg.className, "[transition:transform_.45s_var(--ns-ease-pop),scale_.45s_var(--ns-ease-pop),translate_.45s_var(--ns-ease-pop),rotate_.45s_var(--ns-ease-pop),opacity_.2s]", open ? "scale-[.4] rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100")}>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="m16 6-4-4-4 4" />
            <path d="M12 2v13" />
          </svg>
          <svg {...svg} className={cn(svg.className, "[transition:transform_.45s_var(--ns-ease-pop),scale_.45s_var(--ns-ease-pop),translate_.45s_var(--ns-ease-pop),rotate_.45s_var(--ns-ease-pop),opacity_.2s]", open ? "scale-100 rotate-0 opacity-100" : "scale-[.4] -rotate-90 opacity-0")}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </span>
        <span className={cn("block overflow-hidden [transition:max-width_.4s_var(--ns-ease-settle),opacity_.2s,padding_.4s]", open ? "max-w-0 ps-0 opacity-0" : "max-w-[60px] ps-2 opacity-100")}>{label}</span>
      </button>
      {targets.map((target, i) => {
        const on = picked === target.id
        return (
          <button
            key={target.id}
            ref={inertRef(!open)}
            type="button"
            aria-label={target.label}
            title={target.label}
            onClick={() => void pick(target)}
            className={cn(
              "grid size-9 shrink-0 cursor-pointer place-items-center rounded-[var(--radius)] outline-none [transition:opacity_.25s,transform_.45s_var(--ns-ease-pop),scale_.45s_var(--ns-ease-pop),translate_.45s_var(--ns-ease-pop),rotate_.45s_var(--ns-ease-pop),background-color_.2s,color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
              open ? "scale-100 opacity-100" : "pointer-events-none scale-[.4] opacity-0",
              on ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--foreground)] hover:bg-[var(--accent)]"
            )}
            style={{ transitionDelay: open ? `${60 + i * 45}ms, ${60 + i * 45}ms, 0ms, 0ms` : "0ms" }}
          >
            <span aria-hidden="true" className="relative block size-4">
              <span className={cn("absolute inset-0 [transition:opacity_.15s]", on ? "opacity-0" : "opacity-100")}>{target.icon}</span>
              <svg {...svg} strokeWidth={2.5} className={cn(svg.className, "[transition:opacity_.2s,transform_.4s_var(--ns-ease-rebound),scale_.4s_var(--ns-ease-rebound),translate_.4s_var(--ns-ease-rebound),rotate_.4s_var(--ns-ease-rebound)]", on ? "scale-100 opacity-100" : "scale-[.4] opacity-0")}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          </button>
        )
      })}
      <Announcer message={message} />
    </div>
  )
})

export { copyLinkTarget, emailTarget, ShareFan, ShareIcons, type ShareFanProps, type ShareTarget }
