"use client"

/**
 * Link Unfurl (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/link-unfurl
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { inertRef, RollingLabel } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Link Unfurl: a composer where a pasted link becomes an inline chip that pops in, and a preview card
 * unfolds below it: a breathing skeleton while the Open Graph data loads, then the content arrives out
 * of a blur, either wide (title, description, image) or as a row (thumb, title, description, meta).
 * The chip folds and unfolds the card; Send folds everything and the helper rolls to a confirmation.
 */

interface UnfurlLink {
  /** Changes when a new link is pasted. */
  url: string
  domain: string
  title: string
  description?: string | undefined
  /** A letter for the site tile when there's no favicon. */
  letter?: string | undefined
  /** The tile's colour, e.g. "var(--chart-1)". */
  color?: string | undefined
  image?: string | undefined
  meta?: string | undefined
  layout?: "wide" | "row" | undefined
}

interface LinkUnfurlProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  /** The message text before the chip. */
  message: React.ReactNode
  link: UnfurlLink | null
  /** True until the preview data arrives. */
  loading?: boolean | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onRemove: () => void
  onSend: () => void
  /** The helper line under the composer. */
  helper?: React.ReactNode | undefined
  /** After sending: "Sent to #retreat-planning". */
  sent?: React.ReactNode | undefined
  /** Beside Send: attachment buttons, samples. */
  actions?: React.ReactNode | undefined
  sound?: boolean | undefined
}

function Tile({ link, size }: { link: UnfurlLink; size: number }) {
  const c = link.color ?? "var(--chart-1)"
  return (
    <span aria-hidden="true" className="grid shrink-0 place-items-center font-bold" style={{ width: size, height: size, borderRadius: size > 19 ? 6 : 5, fontSize: 10, background: `color-mix(in oklab, ${c} 18%, transparent)`, color: c }}>
      {link.letter ?? link.domain[0]?.toUpperCase()}
    </span>
  )
}

const LinkUnfurl = React.forwardRef<HTMLDivElement, LinkUnfurlProps>(function LinkUnfurl(
  { message, link, loading = false, open, onOpenChange, onRemove, onSend, helper = "Paste a link to see its preview", sent, actions, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const cardId = React.useId()
  const [shown, setShown] = React.useState(link)
  const [chips, setChips] = React.useState(0)
  // Keep the last link on screen while the card folds away after a remove or send.
  if (link && link !== shown) {
    setShown(link)
    if (link.url !== shown?.url) setChips((n) => n + 1)
  }
  const heard = React.useRef({ url: link?.url, loading })
  React.useEffect(() => {
    const was = heard.current
    heard.current = { url: link?.url, loading }
    if (link && link.url !== was.url) sfx.pop()
    if (link && was.loading && !loading && link.url === was.url) sfx.reveal()
  }, [link, loading, sfx])

  const L = link ?? shown
  const wide = (L?.layout ?? "wide") === "wide"
  const toggle = () => {
    if (!link) return
    if (open) sfx.close()
    else sfx.open()
    onOpenChange(!open)
  }

  return (
    <div ref={ref} data-slot="link-unfurl" data-notchset="" className={cn("flex w-full max-w-[440px] flex-col items-center gap-2.5", className)} {...props}>
      <div className="flex w-full flex-col rounded-[22px] border border-[var(--border)] bg-[var(--background)] px-4 pt-4 pb-3 text-[var(--foreground)] shadow-[0_18px_40px_-28px_rgba(0,0,0,.3)]">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] leading-[1.6]">
          <span>{message}</span>
          {link && (
            <button
              key={chips}
              type="button"
              aria-expanded={open}
              aria-controls={cardId}
              aria-label={`${link.domain}, ${open ? "hide" : "show"} preview`}
              onClick={toggle}
              className="inline-flex h-[26px] animate-[ns-chip_.4s_var(--ns-ease-rebound)_both] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] ps-1 pe-1.5 outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] motion-reduce:animate-none"
            >
              <Tile link={link} size={18} />
              <span className="font-mono text-[length:var(--ns-type-note)]">{link.domain}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-3 [transition:rotate_.4s_var(--ns-ease-pop)]", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          )}
        </div>
        <div id={cardId} className={cn("grid [transition:grid-template-rows_.5s_var(--ns-ease-settle)] motion-reduce:transition-none", link && open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
          <div className="min-h-0 overflow-hidden" ref={inertRef(!(link && open))}>
            {L && (
              <div className="mt-3 flex flex-col gap-2.5 rounded-[16px] border border-[var(--border)] bg-[var(--card,var(--background))] p-3">
                <div className="flex items-center gap-2">
                  <Tile link={L} size={20} />
                  <span className={cn("min-w-0 flex-1 truncate font-mono text-[length:var(--ns-type-note)]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{L.domain}</span>
                  <button type="button" aria-label="Collapse preview" onClick={toggle} className={cn("grid size-[26px] shrink-0 cursor-pointer place-items-center rounded-full outline-none [transition:background-color_.2s,color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-90", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Remove preview"
                    onClick={() => {
                      sfx.drop()
                      onRemove()
                    }}
                    className={cn("grid size-[26px] shrink-0 cursor-pointer place-items-center rounded-full outline-none [transition:background-color_.2s,color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-90", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
                {loading ? (
                  <div aria-label="Loading preview" role="status" className="flex flex-col gap-2">
                    <span className="h-[13px] w-[62%] animate-[ns-skel_1.2s_ease-in-out_infinite] rounded-[5px] bg-[var(--muted)]" />
                    <span className="h-2.5 w-[92%] animate-[ns-skel_1.2s_ease-in-out_.08s_infinite] rounded-[5px] bg-[var(--muted)]" />
                    <span className="h-2.5 w-[70%] animate-[ns-skel_1.2s_ease-in-out_.16s_infinite] rounded-[5px] bg-[var(--muted)]" />
                    {wide && <span className="h-40 animate-[ns-skel_1.2s_ease-in-out_.24s_infinite] rounded-[12px] bg-[var(--muted)]" />}
                  </div>
                ) : wide ? (
                  <div key={L.url} className="flex animate-[ns-reveal_.45s_cubic-bezier(.2,.8,.2,1)_both] flex-col gap-2.5 motion-reduce:animate-none">
                    <div className="flex flex-col gap-[3px]">
                      <span className="text-[15px] font-semibold tracking-[-0.015em]">{L.title}</span>
                      {L.description && <span className={cn("text-[length:var(--ns-type-label)] leading-[var(--ns-leading-prose)] text-pretty", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{L.description}</span>}
                    </div>
                    {L.image && <span aria-hidden="true" className="h-[180px] rounded-[12px] bg-[var(--muted)] bg-cover bg-center" style={{ backgroundImage: `url(${L.image})` }} />}
                  </div>
                ) : (
                  <div key={L.url} className="flex animate-[ns-reveal_.45s_cubic-bezier(.2,.8,.2,1)_both] items-center gap-3 motion-reduce:animate-none">
                    <span
                      aria-hidden="true"
                      className="grid size-[68px] shrink-0 place-items-center rounded-[12px] bg-cover bg-center text-[24px] font-semibold"
                      style={L.image ? { backgroundImage: `url(${L.image})`, backgroundColor: "var(--muted)" } : { background: `color-mix(in oklab, ${L.color ?? "var(--chart-1)"} 16%, transparent)`, color: L.color ?? "var(--chart-1)" }}
                    >
                      {L.image ? null : (L.letter ?? L.domain[0]?.toUpperCase())}
                    </span>
                    <span className="flex min-w-0 flex-col gap-[3px]">
                      <span className="text-[15px] font-semibold tracking-[-0.015em]">{L.title}</span>
                      {L.description && <span className={cn("text-[length:var(--ns-type-label)] leading-[1.45] text-pretty", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{L.description}</span>}
                      {L.meta && (
                        <span className="font-mono text-[11px]" style={{ color: `color-mix(in oklab, ${L.color ?? "var(--chart-1)"} 80%, var(--foreground))` }}>
                          {L.meta}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {actions}
          <button
            type="button"
            aria-label="Send"
            onClick={() => {
              if (!link) {
                sfx.buzz()
                return
              }
              sfx.noise(0.3, 0.04, 700, 3200)
              sfx.pop()
              onSend()
            }}
            className={cn(
              "ms-auto grid size-9 shrink-0 cursor-pointer place-items-center rounded-full outline-none [transition:background-color_.3s,color_.3s,scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-90",
              link ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--muted)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
            )}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>
      <RollingLabel index={sent ? 1 : 0} size="sm" className={cn("text-[length:var(--ns-type-note)]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")} rows={[<React.Fragment key="help">{helper}</React.Fragment>, <React.Fragment key="sent">✓ {sent}</React.Fragment>]} />
    </div>
  )
})

export { LinkUnfurl, type LinkUnfurlProps, type UnfurlLink }
