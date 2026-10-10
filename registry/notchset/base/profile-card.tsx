"use client"

/**
 * Profile Card (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/profile-card
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { DrawCheck, RollingLabel } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Profile Card: a full-bleed photo with a solid plate at the bottom (no glass). At rest the plate shows
 * the name, a verified badge and the rating; hover or focus grows the stats and actions out below it.
 * Follow rolls into Following and the follower count rolls with it.
 */

interface ProfileCardProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  name: string
  /** Role and place: "Product designer · Accra". */
  subtitle?: string | undefined
  photo?: string | undefined
  verified?: boolean | undefined
  rating?: number | undefined
  /** The follower count, yours included when following. */
  followers: number
  following: boolean
  onFollowChange: (following: boolean) => void
  onMessage?: (() => void) | undefined
  /** More stats after followers. */
  stats?: readonly { label: string; value: string | number }[] | undefined
  locale?: string | undefined
  sound?: boolean | undefined
}

const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(function ProfileCard(
  { name, subtitle, photo, verified, rating, followers, following, onFollowChange, onMessage, stats = [], locale = "en-US", sound = true, className, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [hover, setHover] = React.useState(false)
  const [focus, setFocus] = React.useState(false)
  const up = hover || focus
  const lift = () => {
    if (!up) sfx.swooshIn()
  }

  return (
    <div
      ref={ref}
      data-slot="profile-card"
      data-notchset=""
      data-state={up ? "open" : "closed"}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          lift()
          setHover(true)
        }
        onPointerEnter?.(event)
      }}
      onPointerLeave={(event) => {
        setHover(false)
        onPointerLeave?.(event)
      }}
      onFocus={(event) => {
        lift()
        setFocus(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocus(false)
        onBlur?.(event)
      }}
      onClick={() => {
        // Touch has no hover: a tap on the photo opens the plate.
        if (!up) {
          lift()
          setHover(true)
        }
      }}
      className={cn("relative mx-auto h-[380px] w-[300px] max-w-full overflow-hidden rounded-[24px] bg-[var(--muted)] bg-cover bg-[center_20%] shadow-[0_24px_50px_-24px_rgba(0,0,0,.4)]", className)}
      style={photo ? { backgroundImage: `url(${photo})` } : undefined}
      {...props}
    >
      <div className="absolute inset-x-2.5 bottom-2.5 flex flex-col rounded-[16px] bg-[var(--card)] px-3.5 py-3 text-[var(--card-foreground,var(--foreground))] shadow-[0_8px_24px_-10px_rgba(0,0,0,.3)]">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 flex-col leading-[1.3]">
            <span className="flex items-center gap-1.5 text-[15px] font-semibold">
              <span className="truncate">{name}</span>
              {verified && (
                <span role="img" aria-label="Verified" className="grid size-3.5 shrink-0 place-items-center rounded-full bg-[var(--chart-1)] text-white">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[9px]" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
            </span>
            {subtitle && <span className={cn("truncate text-[12.5px]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{subtitle}</span>}
          </span>
          {rating !== undefined && (
            <span className="flex shrink-0 items-center gap-1 text-[length:var(--ns-type-label)] font-semibold tabular-nums">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[13px] text-[var(--chart-4)]" fill="currentColor">
                <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
              </svg>
              <span className="sr-only">Rated </span>
              {rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
          )}
        </div>
        <div className={cn("grid [transition:grid-template-rows_.5s_var(--ns-ease-settle)] motion-reduce:transition-none", up ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
          {/* Kept reachable by Tab even while folded: focusing into it is what opens it for keyboard users. */}
          <div className="flex min-h-0 flex-col gap-2.5 overflow-hidden pt-2.5">
            <div className={cn("grid gap-2 border-y border-[var(--border)] py-2.5 [transition:opacity_.3s_.1s]", up ? "opacity-100" : "opacity-0")} style={{ gridTemplateColumns: `repeat(${stats.length + 1},minmax(0,1fr))` }}>
              <span className="flex flex-col items-center">
                <span className="text-[15px] font-semibold tabular-nums">
                  <NumberFlow value={followers.toLocaleString(locale)} />
                </span>
                <span className={cn("text-[11px]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>followers</span>
              </span>
              {stats.map((s) => (
                <span key={s.label} className="flex flex-col items-center">
                  <span className="text-[15px] font-semibold tabular-nums">{s.value}</span>
                  <span className={cn("text-[11px]", "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>{s.label}</span>
                </span>
              ))}
            </div>
            <div className={cn("flex gap-2 [transition:opacity_.3s_.15s]", up ? "opacity-100" : "opacity-0")}>
              <button
                type="button"
                onClick={() => {
                  sfx.tick()
                  onMessage?.()
                }}
                className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3.5 text-[length:var(--ns-type-label)] font-medium text-[var(--foreground)] outline-none [transition:scale_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
                Message
              </button>
              <button
                type="button"
                aria-pressed={following}
                aria-label={following ? `Following ${name}` : `Follow ${name}`}
                onClick={() => {
                  if (!following) {
                    sfx.pop()
                    window.setTimeout(() => sfx.ding(3), 80)
                  } else sfx.drop()
                  onFollowChange(!following)
                }}
                className={cn(
                  "inline-flex h-9 flex-1 cursor-pointer items-center justify-center rounded-[var(--radius)] border px-3.5 text-[length:var(--ns-type-label)] font-medium outline-none [transition:scale_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color),color_var(--ns-time-color),border-color_.2s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95",
                  following ? "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]" : "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]"
                )}
              >
                <RollingLabel
                  index={following ? 1 : 0}
                  rows={[
                    <React.Fragment key="follow">Follow</React.Fragment>,
                    <React.Fragment key="following">
                      <DrawCheck shown={following} className="size-[13px]" />
                      Following
                    </React.Fragment>,
                  ]}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export { ProfileCard, type ProfileCardProps }
