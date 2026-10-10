"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { CodeInput } from "@/components/ui/notchset/blocks/auth/code-input"
import { PaneStack } from "@/components/ui/notchset/blocks/auth/pane-stack"
import { PillField } from "@/components/ui/notchset/blocks/auth/pill-field"
import { SegmentSwitch } from "@/components/ui/notchset/blocks/auth/segment-switch"
import { ArrowCta, isArrowCtaFailure } from "@/lib/notchset/arrow-cta"
import { RollingLabel, inertRef } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Sign In: one card for signing in and signing up. Email first (Sign up folds in a name), then a
 * one-time code on the next pane, with passkey and social sign-in one tap away. The panel's title and
 * line roll with the step, and the panel turns success once the code checks out.
 */

type Provider = "google" | "apple" | "github"

interface SignInBlockProps extends Omit<React.ComponentPropsWithoutRef<"section">, "title"> {
  /** Your product's name, in the tag. */
  brand: string
  /** Sends the code (on your server). */
  onRequestCode: (email: string, name?: string) => unknown
  verify: (code: string) => boolean | PromiseLike<boolean>
  /** Called once the code checks out. */
  onSignedIn?: ((email: string) => void) | undefined
  onPasskey?: (() => unknown) | undefined
  onOAuth?: ((provider: Provider) => unknown) | undefined
  defaultMode?: "signin" | "signup" | undefined
  /** The line under the card. */
  terms?: React.ReactNode | undefined
  /** A line under the code boxes, e.g. a hint. */
  codeFootnote?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const PROVIDERS: { id: "passkey" | Provider; label: string; icon: React.ReactNode }[] = [
  {
    id: "passkey",
    label: "Passkey",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-[17px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
        <path d="M16.5 7.5h.01" />
      </svg>
    ),
  },
  {
    id: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-[17px]">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Apple",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-4" fill="currentColor">
        <path d="M16.37 12.63c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84s2.01.84 3.39.81c1.4-.03 2.29-1.27 3.14-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.74-4.12zM13.79 5c.72-.87 1.2-2.08 1.07-3.29-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.09 3.18 1.15.09 2.32-.58 3.04-1.45z" />
      </svg>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-4" fill="currentColor">
        <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.82-.26.82-.57v-2.04c-3.34.73-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 12 .3" />
      </svg>
    ),
  },
]

const SignInBlock = React.forwardRef<HTMLElement, SignInBlockProps>(function SignInBlock(
  { brand, onRequestCode, verify, onSignedIn, onPasskey, onOAuth, defaultMode = "signin", terms = "By continuing you agree to the Terms and Privacy Policy.", codeFootnote, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [mode, setMode] = React.useState(defaultMode)
  const [email, setEmail] = React.useState("")
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState("")
  const [shakes, setShakes] = React.useState(0)
  const [pane, setPane] = React.useState<"email" | "code">("email")
  const [done, setDone] = React.useState(false)
  const [focusKey, setFocusKey] = React.useState(0)
  const cta = React.useRef<HTMLButtonElement>(null)
  const up = mode === "signup"
  const emailOk = EMAIL.test(email)
  const nameOk = name.trim().length > 1
  const ready = emailOk && (!up || nameOk)
  const title = done ? 2 : up ? 1 : 0
  const sub = done ? 2 : pane === "code" ? 3 : up ? 1 : 0

  const refuse = () => {
    setError(up && !nameOk ? "Add your name first" : email ? "That email looks incomplete" : "Enter your email to continue")
    setShakes((n) => n + 1)
  }

  return (
    <section ref={ref} aria-label={up ? "Sign up" : "Sign in"} data-slot="sign-in-block" data-notchset="" className={cn("mx-auto w-full max-w-[460px]", className)} {...props}>
      <div className="rounded-[var(--ns-corner-frame,min(34px,calc(var(--radius,999px)*3.4)))] bg-[var(--muted)] p-2.5">
        <div className="flex flex-col gap-5 rounded-[var(--ns-corner-box,min(26px,calc(var(--radius,999px)*2.6)))] bg-[var(--background)] px-2 pt-2 pb-[22px]">
          <div className="flex flex-col gap-[18px] rounded-[19px] px-[18px] pt-4 pb-[18px] [transition:background-color_.5s]" style={{ background: `color-mix(in oklab, ${done ? "var(--success,var(--foreground))" : "var(--chart-1)"} var(--ns-tint-panel), var(--background))` }}>
            <div className="flex items-center justify-between gap-2.5">
              <span className="flex h-7 items-center gap-2 rounded-full bg-[var(--background)] ps-1.5 pe-3 text-[length:var(--ns-type-label)] font-semibold whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,.06)]">
                <span aria-hidden="true" className="size-[18px] rounded-md bg-[var(--foreground)]" />
                {brand}
              </span>
              <SegmentSwitch
                label="Mode"
                options={[
                  { value: "signin", label: "Sign in" },
                  { value: "signup", label: "Sign up" },
                ]}
                value={mode}
                onValueChange={(v) => {
                  if (pane === "code" || done) return
                  setMode(v)
                  setError("")
                  sfx.tone(v === "signup" ? 900 : 700, 0.04, "triangle", 0.035)
                }}
              />
            </div>
            <div aria-live="polite" className="flex flex-col gap-1.5">
              <h2 className="m-0 text-[26px] font-semibold tracking-[-0.035em]">
                <RollingLabel align="start" index={title} rowHeight={32} rows={["Welcome back", "Create your account", "You are in"]} />
              </h2>
              {/* A sentence may wrap on a phone, so it swaps in (a fade and rise) rather than rolling. */}
              <span key={sub} className="animate-[ns-row-in_.4s_var(--ns-ease-settle)] text-[length:var(--ns-type-copy)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [text-wrap:pretty] motion-reduce:animate-none">
                {["Sign in with a one-time code. No password needed.", "Free for 14 days. No card needed.", "Taking you to your workspace…", "Check your inbox for a 6 digit code."][sub]}
              </span>
            </div>
          </div>
          <PaneStack
            index={pane === "email" ? 0 : 1}
            className="px-3.5"
            panes={[
              <div key="email" className="flex flex-col gap-[18px]">
                <div className="grid [transition:grid-template-rows_.45s_var(--ns-ease-settle)] motion-reduce:transition-none" style={{ gridTemplateRows: up ? "1fr" : "0fr" }}>
                  <div ref={inertRef(!up)} className="min-h-0 overflow-hidden px-0.5 pt-0.5">
                    <div className="pb-4">
                      <PillField
                        label="Your name"
                        value={name}
                        onValueChange={(v) => {
                          setName(v)
                          setError("")
                        }}
                        valid={nameOk}
                        invalid={Boolean(error) && up && !nameOk}
                        shakes={up && !nameOk ? shakes : 0}
                        placeholder="Nadia Rahman"
                        autoComplete="name"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") cta.current?.click()
                        }}
                        sound={sound}
                      />
                    </div>
                  </div>
                </div>
                <PillField
                  label="Work email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onValueChange={(v) => {
                    setEmail(v)
                    setError("")
                  }}
                  valid={emailOk}
                  invalid={Boolean(error) && !emailOk}
                  shakes={!emailOk ? shakes : 0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") cta.current?.click()
                  }}
                  sound={sound}
                />
                <span aria-live="polite" className={cn("-mt-2 min-h-[18px] ps-[18px] text-[length:var(--ns-type-label)] [transition:color_.2s]", error ? "text-[var(--destructive)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}>
                  {error || (emailOk ? "We will email you a 6 digit code" : "")}
                </span>
                <ArrowCta
                  ref={cta}
                  size="lg"
                  variant="primary"
                  blocked={!ready}
                  blockedLook="plain"
                  onBlocked={refuse}
                  labels={[up ? "Create account" : "Continue with email", "Sending a code", "Code sent"]}
                  resetAfter={700}
                  onAction={async () => {
                    // A code that wasn't sent stays here with its message; only a real send moves on.
                    const result = await onRequestCode(email.trim(), up ? name.trim() : undefined)
                    if (isArrowCtaFailure(result)) return result
                    window.setTimeout(() => {
                      setPane("code")
                      setFocusKey((k) => k + 1)
                      sfx.noise(0.3, 0.03, 800, 2600)
                    }, 450)
                  }}
                  sound={sound}
                />
                <div className="flex items-center gap-3 text-[length:var(--ns-type-label)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">
                  <span className="h-px flex-1 bg-[var(--border)]" />
                  or continue with
                  <span className="h-px flex-1 bg-[var(--border)]" />
                </div>
                <div className="grid grid-cols-4 gap-2 max-[420px]:grid-cols-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-label={`Continue with ${p.label}`}
                      onClick={() => {
                        sfx.tone(660, 0.05, "triangle", 0.035)
                        sfx.tone(990, 0.08, "sine", 0.025, 0.06)
                        if (p.id === "passkey") onPasskey?.()
                        else onOAuth?.(p.id)
                      }}
                      className="flex h-[var(--ns-control-roomy)] min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-1 text-[length:var(--ns-type-copy)] font-medium text-[var(--foreground)] outline-none [transition:background-color_.2s,border-color_.2s,scale_var(--ns-time-press)_var(--ns-ease-press)] hover:border-[color-mix(in_oklab,var(--foreground)_20%,var(--border))] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95"
                    >
                      {p.icon}
                      <span className="truncate">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>,
              <div key="code" className="flex flex-col gap-[18px]">
                <button
                  type="button"
                  onClick={() => {
                    setPane("email")
                    setDone(false)
                    sfx.noise(0.3, 0.03, 2600, 800)
                  }}
                  className="-ms-1 flex h-[var(--ns-control-compact)] shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-full ps-2 pe-3 text-[13.5px] font-medium whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] outline-none [transition:background-color_.2s,color_.2s] hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-3.5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" />
                    <path d="m11 18-6-6 6-6" />
                  </svg>
                  Use a different email
                </button>
                <div className="flex flex-col gap-1">
                  <span className="text-[17px] font-semibold tracking-[-0.015em]">Enter the code we sent</span>
                  <span className="truncate text-[length:var(--ns-type-copy)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">to {email || "your email"}</span>
                </div>
                <CodeInput
                  key={focusKey}
                  verify={verify}
                  focusKey={focusKey}
                  onResend={() => onRequestCode(email.trim(), up ? name.trim() : undefined)}
                  onVerified={() => {
                    setDone(true)
                    sfx.tone(1320, 0.12, "sine", 0.03, 0.2)
                    onSignedIn?.(email.trim())
                  }}
                  sound={sound}
                />
                {codeFootnote && <span className="text-[12.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{codeFootnote}</span>}
              </div>,
            ]}
          />
          {terms && <span className="px-3.5 text-center text-[12.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [text-wrap:pretty]">{terms}</span>}
        </div>
      </div>
    </section>
  )
})

export { SignInBlock, type SignInBlockProps }
