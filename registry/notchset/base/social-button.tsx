"use client"

/**
 * Social Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/social-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { useSound } from "@/lib/notchset/sound"

/*
 * Social Button: one sign-in button with a provider prop and a flourish per provider. Logos sit in
 * currentColor at rest and take their brand colours only on interaction. idle → working (onAuth's
 * promise is pending) → done (shows ~2.8s, then resets) or error (shake and buzz). Apple and X are
 * inverse. Apple sways its leaf and scans with Face ID brackets; Google blooms its colours and spins;
 * GitHub tilts and fills contribution squares; Discord bobs and types; Microsoft flips its tiles;
 * Figma assembles its shapes; X turns with echo rings; Passkey draws a fingerprint while you hold (1.2s,
 * Space or Enter too); Email opens its flap and flies a paper plane. Every success ends on a chime.
 */

type Provider = "apple" | "google" | "github" | "discord" | "microsoft" | "figma" | "x" | "passkey" | "email"
type Phase = "idle" | "working" | "done" | "error" | "short"

interface SocialButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "children" | "onClick"> {
  provider: Provider
  /** Resolve to sign in; reject to show an error. For passkeys, call navigator.credentials.get here. */
  onAuth: () => Promise<unknown>
  /** Labels for idle, working and done. */
  labels?: [string, string, string] | undefined
  /** Google's done state shows the account. */
  account?: { initials: string; email?: string | undefined } | undefined
  sound?: boolean | undefined
}

const BRAND: Record<Provider, string> = {
  apple: "var(--foreground)",
  google: "#4285F4",
  github: "#2da44e",
  discord: "#5865F2",
  microsoft: "#00A4EF",
  figma: "#A259FF",
  x: "var(--foreground)",
  passkey: "var(--success, #2da44e)",
  email: "var(--info, #3b82f6)",
}
const LABELS: Record<Provider, [string, string, string]> = {
  apple: ["Continue with Apple", "Confirming with Face ID", "Signed in with Apple"],
  google: ["Continue with Google", "Choosing an account", "Signed in with Google"],
  github: ["Continue with GitHub", "Authorizing", "Authorized"],
  discord: ["Continue with Discord", "Connecting", "Connected"],
  microsoft: ["Continue with Microsoft", "Signing in", "Welcome back"],
  figma: ["Continue with Figma", "Opening your files", "Connected to Figma"],
  x: ["Continue with X", "Linking account", "Account linked"],
  passkey: ["Hold to use a passkey", "Keep holding", "Verified"],
  email: ["Email me a sign-in link", "Sending the link", "Check your inbox"],
}

const GOOGLE = [
  ["M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", "#4285F4"],
  ["M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", "#34A853"],
  ["M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z", "#FBBC05"],
  ["M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", "#EA4335"],
] as const
const MS = [
  [1, 1, "#F25022", "-1px,-1px"],
  [12.5, 1, "#7FBA00", "1px,-1px"],
  [1, 12.5, "#00A4EF", "-1px,1px"],
  [12.5, 12.5, "#FFB900", "1px,1px"],
] as const
const FIGMA = [
  ["M9 2h3v6H9a3 3 0 0 1 0-6z", "#F24E1E", "-1.2px,-1px"],
  ["M12 2h3a3 3 0 0 1 0 6h-3z", "#FF7262", "1.2px,-1px"],
  ["M9 8h3v6H9a3 3 0 0 1 0-6z", "#A259FF", "-1.5px,0px"],
  ["M18 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z", "#1ABCFE", "1.5px,0px"],
  ["M9 14h3v3a3 3 0 1 1-3-3z", "#0ACF83", "-1.2px,1.2px"],
] as const
const PRINT = ["M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4", "M14 13.12c0 2.38 0 6.38-1 8.88", "M17.29 21.02c.12-.6.43-2.3.5-3.02", "M2 12a10 10 0 0 1 18-6", "M2 16h.01", "M21.8 16c.2-2 .131-5.354 0-6", "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2", "M8.65 22c.21-.66.45-1.32.57-2", "M9 6.8a6 6 0 0 1 9 5.2v2"]
const X_PATH = "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
const GREEN = ["35", "55", "75", "100", "85"]

function Check({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" pathLength={1} className="[stroke-dasharray:1] [transition:stroke-dashoffset_.4s_cubic-bezier(.6,0,.2,1)]" style={{ strokeDashoffset: on ? 0 : 1 }} />
    </svg>
  )
}

function motif(sfx: ReturnType<typeof useSound>["sfx"], p: Provider) {
  const t = sfx.tone
  if (p === "apple") {
    t(660, 0.08, "sine", 0.03)
    t(990, 0.1, "sine", 0.025, 0.12)
  } else if (p === "google") [523, 659, 784, 1047].forEach((f, i) => t(f, 0.09, "sine", 0.03, i * 0.07))
  else if (p === "github") [0, 1, 2, 3, 4].forEach((i) => t(700 + i * 90, 0.025, "triangle", 0.03, i * 0.16))
  else if (p === "discord") [0, 1, 2].forEach((i) => t(1250, 0.02, "triangle", 0.02, i * 0.18))
  else if (p === "microsoft") [0, 1, 2, 3].forEach((i) => t(900 + i * 70, 0.02, "triangle", 0.03, i * 0.12))
  else if (p === "figma") [0, 1, 2, 3, 4].forEach((i) => t(520 + i * 110, 0.04, "sine", 0.03, i * 0.08))
  else if (p === "x") sfx.noise(0.3, 0.04, 700, 3200)
  else if (p === "email") {
    sfx.noise(0.35, 0.035, 900, 3000)
    t(1200, 0.06, "sine", 0.02, 0.3)
  } else t(300, 1.2, "sine", 0.03, 0, 900)
}

const SocialButton = React.forwardRef<HTMLButtonElement, SocialButtonProps>(function SocialButton({ provider: p, onAuth, labels, account, sound = true, className, onPointerEnter, onPointerLeave, ...props }, ref) {
  const { sfx } = useSound(sound)
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [hover, setHover] = React.useState(false)
  const [errors, setErrors] = React.useState(0)
  const hold = React.useRef(0)
  React.useEffect(() => {
    if (phase !== "done" && phase !== "short" && phase !== "error") return
    const t = window.setTimeout(() => setPhase("idle"), phase === "done" ? 2800 : 1500)
    return () => window.clearTimeout(t)
  }, [phase])
  React.useEffect(() => () => window.clearTimeout(hold.current), [])

  const auth = () => {
    setPhase("working")
    onAuth().then(
      () => {
        setPhase("done")
        sfx.chime()
      },
      () => {
        setPhase("error")
        setErrors((n) => n + 1)
        sfx.buzz()
      }
    )
  }
  const press = () => {
    if (phase === "working") return
    if (phase === "done") {
      setPhase("idle")
      sfx.tick()
      return
    }
    motif(sfx, p)
    auth()
  }
  // Passkey: hold for 1.2s.
  const holdStart = () => {
    if (phase === "working" || phase === "done") return
    setPhase("working")
    motif(sfx, p)
    hold.current = window.setTimeout(() => {
      hold.current = 0
      auth()
    }, 1200)
  }
  const holdEnd = () => {
    if (!hold.current) return
    window.clearTimeout(hold.current)
    hold.current = 0
    setPhase("short")
    sfx.tone(420, 0.06, "triangle", 0.035)
  }

  const L = labels ?? LABELS[p]
  const rows = p === "passkey" ? [...L, "Hold a little longer"] : p === "google" && account?.email ? [L[0], L[1], account.email] : L
  const row = phase === "working" ? 1 : phase === "done" ? 2 : phase === "short" ? 3 : 0
  const inverse = p === "apple" || p === "x"
  const brand = BRAND[p]
  const working = phase === "working"
  const done = phase === "done"
  const lit = hover || working || done

  return (
    <button
      ref={ref}
      type="button"
      data-slot="social-button"
      data-notchset=""
      data-provider={p}
      aria-busy={working || undefined}
      onClick={p === "passkey" ? undefined : press}
      onPointerDown={
        p === "passkey"
          ? (e) => {
              if (!e.button) holdStart()
            }
          : undefined
      }
      onPointerUp={p === "passkey" ? holdEnd : undefined}
      onPointerCancel={p === "passkey" ? holdEnd : undefined}
      onKeyDown={
        p === "passkey"
          ? (e) => {
              if ((e.key !== " " && e.key !== "Enter") || e.repeat) return
              e.preventDefault()
              holdStart()
            }
          : undefined
      }
      onKeyUp={
        p === "passkey"
          ? (e) => {
              if (e.key === " " || e.key === "Enter") holdEnd()
            }
          : undefined
      }
      onPointerEnter={(e) => {
        setHover(true)
        onPointerEnter?.(e)
      }}
      onPointerLeave={(e) => {
        setHover(false)
        if (p === "passkey") holdEnd()
        onPointerLeave?.(e)
      }}
      className={cn(
        "relative flex h-[42px] w-full max-w-[264px] cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-full border px-4 text-[13.5px] font-medium outline-none select-none [transition:background-color_.3s,border-color_var(--ns-time-state),scale_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 active:scale-[.97]",
        p === "passkey" && "touch-none",
        inverse && "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]",
        !inverse && !done && hover && "border-[var(--border)] bg-[var(--accent)] text-[var(--foreground)]",
        !inverse && !done && !hover && "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]",
        !inverse && done && "text-[var(--foreground)]",
        errors > 0 && phase === "error" && (errors % 2 ? "animate-[ns-shake_.42s]" : "animate-[ns-shake-b_.42s]"),
        className
      )}
      style={!inverse && done ? { background: `color-mix(in oklab, ${brand} 10%, var(--background))`, borderColor: `color-mix(in oklab, ${brand} 45%, var(--border))` } : undefined}
      {...props}
    >
      <span aria-hidden="true" className="relative size-[18px] shrink-0">
        {p === "apple" && (
          <>
            <span className="absolute inset-0 flex items-center justify-center [transition:opacity_.25s,scale_.4s_var(--ns-ease-pop)]" style={{ opacity: phase === "idle" || phase === "error" ? 1 : 0, scale: phase === "idle" || phase === "error" ? "1" : ".5" }}>
              <svg viewBox="0 0 24 24" className="size-[17px] overflow-visible" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z" />
                <g className={cn("origin-[14px_6px]", hover && phase === "idle" && "animate-[ns-sway_.9s_ease-in-out_infinite] motion-reduce:animate-none")}>
                  <path d="M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                </g>
              </svg>
            </span>
            <span className="absolute -inset-[3px] flex items-center justify-center [transition:opacity_.25s,scale_.45s_cubic-bezier(.2,1.4,.3,1)]" style={{ opacity: working ? 1 : 0, scale: working ? "1" : "1.45" }}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 8V5a2 2 0 0 1 2-2h3" />
                <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
                <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
                <path d="M9 9v1.5" />
                <path d="M15 9v1.5" />
                <path d="M9.5 15.5a3.5 3.5 0 0 0 5 0" />
              </svg>
              <span className={cn("absolute inset-x-[3px] top-1/2 -mt-px h-[1.5px] rounded-[1px] bg-[var(--success,#2da44e)] shadow-[0_0_6px_var(--success,#2da44e)]", working && "animate-[ns-scan-y_1s_ease-in-out_infinite]")} />
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-[var(--success,#2da44e)] [transition:opacity_.25s]" style={{ opacity: done ? 1 : 0 }}>
              <Check on={done} />
            </span>
          </>
        )}
        {p === "google" && (
          <>
            <span className="absolute inset-0 flex [transition:opacity_.25s,scale_.4s_var(--ns-ease-pop)]" style={{ opacity: done ? 0 : 1, scale: done ? ".4" : "1" }}>
              <svg viewBox="0 0 24 24" className={cn("size-[18px]", working && "animate-[ns-spin_.75s_cubic-bezier(.5,0,.3,1)_infinite] motion-reduce:animate-none")}>
                {GOOGLE.map(([d, c], i) => (
                  <path key={c} d={d} className="[transition:fill_.3s]" style={{ fill: lit ? c : "currentColor", transitionDelay: `${i * 70}ms` }} />
                ))}
              </svg>
            </span>
            <span className="absolute inset-0 grid place-items-center rounded-full bg-[color-mix(in_oklab,#4285F4_22%,var(--background))] text-[8px] font-bold text-[color-mix(in_oklab,#4285F4_80%,var(--foreground))] [transition:opacity_.25s,scale_.4s_var(--ns-ease-pop)]" style={{ opacity: done ? 1 : 0, scale: done ? "1" : ".4" }}>
              {account?.initials}
            </span>
          </>
        )}
        {p === "github" && (
          <span className="absolute inset-0 flex items-center justify-center [transition:rotate_.35s_var(--ns-ease-pop),translate_.35s_var(--ns-ease-pop),color_.3s]" style={{ color: done ? "#2da44e" : "currentColor", rotate: hover && phase === "idle" ? "-12deg" : "0deg", translate: hover && phase === "idle" ? "0 -1px" : "0 0" }}>
            <svg viewBox="0 0 24 24" className="size-[17px]" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </span>
        )}
        {p === "discord" && (
          <>
            <span className={cn("absolute inset-0 flex items-center justify-center [transition:color_.3s]", ((hover && phase === "idle") || working) && "animate-[ns-bob_.7s_ease-in-out_infinite] motion-reduce:animate-none")} style={{ color: done ? "#5865F2" : "currentColor" }}>
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor">
                <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.42 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.42 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419Z" />
              </svg>
            </span>
            <span className="absolute -end-1 -top-[3px] size-[9px] rounded-full border-2 bg-[var(--destructive)] [transition:scale_.35s_var(--ns-ease-rebound)]" style={{ scale: done ? "1" : "0", borderColor: done ? "color-mix(in oklab, #5865F2 10%, var(--background))" : "var(--background)" }} />
          </>
        )}
        {p === "microsoft" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="size-4 overflow-visible">
              {MS.map(([x, y, c, off], i) => (
                <rect
                  key={c}
                  x={x}
                  y={y}
                  width="10.5"
                  height="10.5"
                  className={cn("[transform-box:fill-box] origin-center [transition:fill_.01s,translate_.3s_var(--ns-ease-pop)]", working && "animate-[ns-flip-x_.45s_ease-in-out_both] motion-reduce:animate-none")}
                  style={{ fill: working || done ? c : "currentColor", translate: hover && phase === "idle" ? off.replace(",", " ") : "0 0", animationDelay: `${i * 120}ms`, transitionDelay: working ? `${i * 120 + 220}ms` : "0ms" }}
                />
              ))}
            </svg>
          </span>
        )}
        {p === "figma" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="size-[18px] overflow-visible">
              {FIGMA.map(([d, c, off], i) => (
                <path
                  key={c}
                  d={d}
                  className={cn("[transform-box:fill-box] origin-center [transition:fill_.3s,translate_.3s_var(--ns-ease-pop)]", working && "motion-reduce:animate-none", working && i === 0 && "animate-[ns-asm-0_.6s_cubic-bezier(.2,1.4,.3,1)_both]", working && i === 1 && "animate-[ns-asm-1_.6s_cubic-bezier(.2,1.4,.3,1)_both]", working && i === 2 && "animate-[ns-asm-2_.6s_cubic-bezier(.2,1.4,.3,1)_both]", working && i === 3 && "animate-[ns-asm-3_.6s_cubic-bezier(.2,1.4,.3,1)_both]", working && i === 4 && "animate-[ns-asm-4_.6s_cubic-bezier(.2,1.4,.3,1)_both]")}
                  style={{ fill: working || done ? c : "currentColor", translate: hover && phase === "idle" ? off.replace(",", " ") : "0 0", animationDelay: `${i * 80}ms` }}
                />
              ))}
            </svg>
          </span>
        )}
        {p === "x" && (
          <>
            <span className={cn("absolute inset-0 flex items-center justify-center opacity-0", working && "animate-[ns-echo_.9s_ease-out_infinite] motion-reduce:animate-none")}>
              <svg viewBox="0 0 24 24" className="size-[15px]" fill="currentColor">
                <path d={X_PATH} />
              </svg>
            </span>
            <span className="absolute inset-0 flex items-center justify-center [transition:opacity_.25s,rotate_.5s_cubic-bezier(.2,1.4,.3,1)]" style={{ opacity: done ? 0 : 1, rotate: working ? "180deg" : hover && phase === "idle" ? "90deg" : "0deg" }}>
              <svg viewBox="0 0 24 24" className="size-[15px]" fill="currentColor">
                <path d={X_PATH} />
              </svg>
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-[var(--success,#2da44e)] [transition:opacity_.25s]" style={{ opacity: done ? 1 : 0 }}>
              <Check on={done} />
            </span>
          </>
        )}
        {p === "passkey" && (
          <>
            <span className="absolute inset-0 flex opacity-35">
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {PRINT.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
            </span>
            <span className="absolute inset-0 flex text-[var(--success,#2da44e)]">
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {PRINT.map((d) => (
                  <path key={d} d={d} pathLength={1} className={cn("[stroke-dasharray:1]", working ? "[transition:stroke-dashoffset_1.2s_linear]" : "[transition:stroke-dashoffset_.35s_ease-out]")} style={{ strokeDashoffset: working || done ? 0 : 1 }} />
                ))}
              </svg>
            </span>
            <span className="absolute -end-1 -bottom-[3px] grid size-[11px] place-items-center rounded-full bg-[var(--success,#2da44e)] text-[var(--success-foreground,#fff)] [transition:scale_.35s_var(--ns-ease-rebound)]" style={{ scale: done ? "1" : "0" }}>
              <svg viewBox="0 0 24 24" className="size-[7px]" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          </>
        )}
        {p === "email" && (
          <>
            <span className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="size-[18px] overflow-visible" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" className="origin-top [transform-box:fill-box] [transition:scale_.35s_cubic-bezier(.2,1.4,.3,1)]" style={{ scale: working || done ? "1 -1" : "1 1" }} />
              </svg>
            </span>
            <span className={cn("absolute start-0.5 top-px flex text-[var(--info,#3b82f6)] opacity-0 rtl:-scale-x-100", working && "animate-[ns-plane_.9s_cubic-bezier(.4,0,.2,1)_.25s_both] motion-reduce:animate-none")}>
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22 11 13 2 9 22 2z" />
              </svg>
            </span>
            <span className="absolute -end-[3px] -top-0.5 size-2 rounded-full bg-[var(--info,#3b82f6)] [transition:scale_.35s_var(--ns-ease-rebound)]" style={{ scale: done ? "1" : "0" }} />
          </>
        )}
      </span>
      <span aria-live="polite" className="block h-[18px] shrink-0 overflow-hidden">
        <span className="flex flex-col [transition:translate_.5s_var(--ns-ease-reshape)] motion-reduce:transition-none" style={{ translate: `0 ${-row * 18}px` }}>
          {rows.map((r, i) => (
            <span key={i} aria-hidden={i === row ? undefined : true} className="h-[18px] text-center leading-[18px] whitespace-nowrap">
              {r}
            </span>
          ))}
        </span>
      </span>
      {p === "github" && (
        <span aria-hidden="true" className="flex shrink-0 gap-[3px] overflow-hidden [transition:max-width_.35s_cubic-bezier(.2,1.2,.3,1),opacity_.25s]" style={{ maxWidth: working ? 50 : 0, opacity: working ? 1 : 0 }}>
          {GREEN.map((g, i) => (
            <span key={i} className="size-[7px] shrink-0 rounded-[2px] [transition:background-color_.3s]" style={{ background: working ? `color-mix(in oklab, #2da44e ${g}%, var(--muted))` : "var(--muted)", transitionDelay: `${i * 160}ms` }} />
          ))}
        </span>
      )}
      {p === "discord" && (
        <span aria-hidden="true" className="flex shrink-0 gap-[3px] overflow-hidden [transition:max-width_.3s,opacity_.25s]" style={{ maxWidth: working ? 24 : 0, opacity: working ? 1 : 0 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-[5px] shrink-0 animate-[ns-dot3_.9s_ease-in-out_infinite] rounded-full bg-current" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      )}
    </button>
  )
})

export { SocialButton, type Provider, type SocialButtonProps }
