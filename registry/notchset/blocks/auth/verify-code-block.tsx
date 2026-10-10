"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { CodeInput, type CodeStatus } from "@/components/ui/notchset/blocks/auth/code-input"
import { RollingLabel } from "@/lib/notchset/shared"

/*
 * Verification Code: a card that proves an email. The panel names where the code went; its title rolls
 * from Verify your email to Checking…, Email verified or That code did not work, and its tint turns
 * success or destructive with the result. Six boxes on one real input check themselves on the last
 * digit.
 */

interface VerifyCodeBlockProps extends Omit<React.ComponentPropsWithoutRef<"section">, "title"> {
  /** Where the code went. */
  email: string
  verify: (code: string) => boolean | PromiseLike<boolean>
  onVerified?: ((code: string) => void) | undefined
  onResend?: (() => unknown) | undefined
  tag?: string | undefined
  /** A line under the boxes, e.g. a hint. */
  footnote?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const TITLES = ["Verify your email", "Checking…", "Email verified", "That code did not work"]
const AT: Record<CodeStatus, number> = { idle: 0, checking: 1, verified: 2, wrong: 3 }

const VerifyCodeBlock = React.forwardRef<HTMLElement, VerifyCodeBlockProps>(function VerifyCodeBlock({ email, verify, onVerified, onResend, tag = "Check your inbox", footnote, sound = true, className, ...props }, ref) {
  const [status, setStatus] = React.useState<CodeStatus>("idle")
  const tint = status === "verified" ? "var(--success,var(--foreground))" : status === "wrong" ? "var(--destructive)" : "var(--chart-3)"
  return (
    <section ref={ref} aria-label="Verify your email" data-slot="verify-code-block" data-notchset="" className={cn("mx-auto w-full max-w-[460px]", className)} {...props}>
      <div className="rounded-[var(--ns-corner-frame,min(34px,calc(var(--radius,999px)*3.4)))] bg-[var(--muted)] p-2.5">
        <div className="flex flex-col gap-5 rounded-[var(--ns-corner-box,min(26px,calc(var(--radius,999px)*2.6)))] bg-[var(--background)] px-2 pt-2 pb-[22px]">
          <div className="flex flex-col gap-1.5 rounded-[19px] px-5 pt-[18px] pb-5 [transition:background-color_.5s]" style={{ background: `color-mix(in oklab, ${tint} ${status === "wrong" ? "9%" : "var(--ns-tint-panel)"}, var(--background))` }}>
            <span className="mb-3 flex h-7 items-center gap-[7px] self-start rounded-full bg-[var(--background)] ps-2 pe-3 text-[length:var(--ns-type-label)] font-semibold shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v16H4z" />
                <path d="m4 6 8 7 8-7" />
              </svg>
              {tag}
            </span>
            <h2 className="m-0 text-[24px] font-semibold tracking-[-0.03em] max-[420px]:text-[21px]">
              <RollingLabel align="start" index={AT[status]} rows={TITLES} rowHeight={30} />
            </h2>
            <span className="truncate text-[length:var(--ns-type-copy)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">We sent a code to {email}</span>
          </div>
          <div className="flex flex-col gap-3.5 px-3.5">
            <CodeInput verify={verify} onVerified={onVerified} onResend={onResend} onStatusChange={setStatus} size={64} sound={sound} />
            {footnote && <span className="text-[12.5px] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{footnote}</span>}
          </div>
        </div>
      </div>
    </section>
  )
})

export { VerifyCodeBlock, type VerifyCodeBlockProps }
