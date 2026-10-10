"use client"

/**
 * Feed Tab Bar (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/feed-tab-bar
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { HeartBurst, HeartIcon } from "@/lib/notchset/heart"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { inertRef, useIsomorphicLayoutEffect } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Feed with Tab Bar: a photo feed in a phone-sized frame. The header tabs slide their underline (width
 * and position, measured) and the posts slide with them. Double-tap a photo for a big heart and the
 * burst of small ones; the Like button does the same from the keyboard. A solid floating tab bar glides
 * its indicator to each tab.
 */

interface FeedPost {
  id: string
  author: string
  place?: string | undefined
  avatar?: string | undefined
  image: string
  caption?: string | undefined
  /** The like count, yours included when liked. */
  likes: number
  liked: boolean
}

interface FeedTabBarProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  /** One header tab per feed; each shows its post. */
  feeds: readonly { label: string; post: FeedPost }[]
  onLike: (post: FeedPost, liked: boolean) => void
  /** The floating bar's tabs. */
  nav: readonly { label: string; icon: React.ReactNode }[]
  navIndex: number
  onNavChange: (index: number) => void
  locale?: string | undefined
  sound?: boolean | undefined
}

const FeedTabBar = React.forwardRef<HTMLDivElement, FeedTabBarProps>(function FeedTabBar({ feeds, onLike, nav, navIndex, onNavChange, locale = "en-US", sound = true, className, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [tab, setTab] = React.useState(0)
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([])
  const [line, setLine] = React.useState<{ x: number; w: number } | null>(null)
  const [pops, setPops] = React.useState<Record<string, number>>({})
  const [bigs, setBigs] = React.useState<Record<string, number>>({})

  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const el = tabs.current[tab]
      if (el) setLine({ x: el.offsetLeft, w: el.offsetWidth })
    }
    measure()
    const ro = new ResizeObserver(measure)
    tabs.current.forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [tab, feeds.length])

  const like = (post: FeedPost, fromPhoto: boolean) => {
    if (fromPhoto) {
      setBigs((b) => ({ ...b, [post.id]: (b[post.id] ?? 0) + 1 }))
      sfx.heart()
      if (post.liked) return
      setPops((p) => ({ ...p, [post.id]: (p[post.id] ?? 0) + 1 }))
      onLike(post, true)
      return
    }
    if (post.liked) {
      sfx.drop()
      onLike(post, false)
      return
    }
    sfx.heart()
    setPops((p) => ({ ...p, [post.id]: (p[post.id] ?? 0) + 1 }))
    onLike(post, true)
  }

  return (
    <div ref={ref} data-slot="feed-tab-bar" data-notchset="" className={cn("relative mx-auto h-[540px] w-[320px] max-w-full overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[0_24px_50px_-28px_rgba(0,0,0,.35)]", className)} {...props}>
      <div className="absolute inset-x-0 top-0 z-[2] bg-[var(--background)] px-[18px] pt-4 pb-2.5">
        <div role="tablist" aria-label="Feeds" className="relative flex gap-[18px]">
          {feeds.map((f, i) => (
            <button
              key={f.label}
              ref={(el) => {
                tabs.current[i] = el
              }}
              type="button"
              role="tab"
              aria-selected={i === tab}
              onClick={() => {
                if (i === tab) return
                sfx.turn(i > tab ? 1 : -1)
                setTab(i)
              }}
              className={cn("cursor-pointer pb-1.5 text-[18px] font-semibold tracking-[-0.02em] outline-none [transition:color_var(--ns-time-color)] focus-visible:rounded-[4px] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]", i === tab ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
            >
              {f.label}
            </button>
          ))}
          {line && (
            <span aria-hidden="true" className="absolute bottom-0 h-[2.5px] rounded-[2px] bg-[var(--foreground)] [transition:left_.45s_cubic-bezier(.2,1.25,.3,1),width_.45s_cubic-bezier(.2,1.25,.3,1)]" style={{ left: line.x, width: line.w }} />
          )}
        </div>
      </div>
      <div className="absolute inset-x-0 top-[62px] bottom-0 overflow-hidden">
        <div className="flex h-full [--sx:-1] [transition:translate_.55s_var(--ns-ease-settle)] motion-reduce:transition-none rtl:[--sx:1]" style={{ width: `${feeds.length * 100}%`, translate: `calc(${(tab * 100) / feeds.length}% * var(--sx)) 0` }}>
          {feeds.map(({ post }, i) => (
            <div key={post.id} ref={inertRef(i !== tab)} className="flex h-full flex-col" style={{ width: `${100 / feeds.length}%` }}>
              <div className="flex items-center gap-2 px-4 pt-1.5 pb-2.5">
                <span aria-hidden="true" className="size-7 shrink-0 rounded-full bg-[var(--muted)] bg-cover bg-center shadow-[0_0_0_1px_var(--border)]" style={post.avatar ? { backgroundImage: `url(${post.avatar})` } : undefined} />
                <span className="text-[length:var(--ns-type-label)] font-semibold">{post.author}</span>
                {post.place && <span className={cn("text-[length:var(--ns-type-note)]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{post.place}</span>}
              </div>
              <div
                role="img"
                aria-label={post.caption ?? `Photo by ${post.author}`}
                onDoubleClick={() => like(post, true)}
                className="relative max-h-[330px] flex-1 cursor-pointer bg-[var(--muted)] bg-cover bg-center select-none"
                style={{ backgroundImage: `url(${post.image})` }}
              >
                {bigs[post.id] ? (
                  <span key={bigs[post.id]} aria-hidden="true" className="absolute start-1/2 top-1/2 -ms-10 -mt-10 animate-[ns-heart_1s_cubic-bezier(.2,.8,.2,1)_both] text-[var(--heart,var(--destructive))] drop-shadow-[0_6px_16px_rgba(0,0,0,.35)] motion-reduce:hidden">
                    <HeartIcon className="size-20" />
                  </span>
                ) : null}
                <span aria-hidden="true" className="absolute end-2.5 top-2.5 rounded-full bg-[color-mix(in_oklab,var(--card)_88%,transparent)] px-2 py-[3px] text-[11px] text-[var(--foreground)]">
                  double-tap
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2.5">
                <span className="relative grid">
                  {pops[post.id] ? <HeartBurst key={pops[post.id]} /> : null}
                  <button
                    key={pops[post.id] ?? 0}
                    type="button"
                    aria-pressed={post.liked}
                    aria-label={`Like, ${post.likes.toLocaleString(locale)}`}
                    onClick={() => like(post, false)}
                    className={cn(
                      "grid cursor-pointer rounded-full outline-none [transition:color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] motion-reduce:animate-none",
                      post.liked ? "text-[var(--heart,var(--destructive))]" : "text-[var(--foreground)]",
                      pops[post.id] && "animate-[ns-squish_.55s]"
                    )}
                  >
                    <HeartIcon filled={post.liked} />
                  </button>
                </span>
                <span aria-hidden="true" className="text-[length:var(--ns-type-label)] font-semibold tabular-nums">
                  <NumberFlow value={post.likes.toLocaleString(locale)} />
                </span>
                {post.caption && <span className={cn("truncate text-[length:var(--ns-type-label)]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{post.caption}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <nav aria-label="App" className="absolute start-1/2 bottom-4 z-[3] flex -translate-x-1/2 rounded-full bg-[var(--foreground)] p-[5px] shadow-[0_12px_28px_-10px_rgba(0,0,0,.45)] rtl:translate-x-1/2">
        <span aria-hidden="true" className="absolute start-[5px] top-[5px] h-10 w-12 rounded-full bg-[color-mix(in_oklab,var(--background)_18%,transparent)] [--sx:1] [transition:translate_.45s_var(--ns-ease-reshape)] motion-reduce:transition-none rtl:[--sx:-1]" style={{ translate: `calc(${navIndex * 48}px * var(--sx)) 0` }} />
        {nav.map((n, i) => (
          <button
            key={n.label}
            type="button"
            aria-label={n.label}
            aria-current={i === navIndex ? "page" : undefined}
            onClick={() => {
              if (i === navIndex) return
              sfx.tone(900 + i * 120, 0.03, "triangle", 0.035)
              onNavChange(i)
            }}
            className={cn("relative grid h-[var(--ns-control-regular)] w-12 cursor-pointer place-items-center rounded-full text-[var(--background)] outline-none [transition:opacity_.25s,scale_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[var(--background)] active:scale-[.88] [&_svg]:size-[19px]", i === navIndex ? "opacity-100" : "opacity-55")}
          >
            {n.icon}
          </button>
        ))}
      </nav>
    </div>
  )
})

export { FeedTabBar, type FeedPost, type FeedTabBarProps }
