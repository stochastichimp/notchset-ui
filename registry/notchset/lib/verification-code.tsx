"use client"

import * as React from "react"

/*
 * The controller every verification-code input shares: the typed code, the check and its outcome, the
 * wrong-code reset and the resend countdown. Renderers (boxes, underlines, big numerals) own their look
 * and their sounds and call `submit` when the code is complete.
 *
 * - A check's result only lands if no newer check started (a slow server can't overwrite a newer code).
 * - A rejected or thrown check is a wrong code. `false` or a failed Response is wrong; anything else is right.
 * - Typing again cancels a pending clear (the new code is never wiped), and nothing lands after unmount.
 * - A wrong code holds for `clearAfter` ms (long enough to read and shake), then clears and refocuses.
 * - The countdown runs a second at a time and stops once the code is verified.
 */

type VerificationStatus = "idle" | "checking" | "verified" | "wrong"

interface VerificationCodeOptions {
  /** Checks a complete code. Resolve false (or reject) when it's wrong. */
  verify: (code: string) => boolean | void | Response | PromiseLike<boolean | void | Response>
  /** After a right code. */
  onVerified?: ((code: string) => void) | undefined
  /** Every status change (for sounds and announcements in the renderer). */
  onStatusChange?: ((status: VerificationStatus) => void) | undefined
  /** Seconds before a new code can be asked for. 0: no countdown. */
  resendAfter: number
  /** How long a wrong code stays before it clears, ms. */
  clearAfter?: number | undefined
  /** The input to refocus after a wrong code clears. */
  input: React.RefObject<HTMLInputElement | null>
}

function useVerificationCode({ verify, onVerified, onStatusChange, resendAfter, clearAfter = 900, input }: VerificationCodeOptions) {
  const [code, setCode] = React.useState("")
  const [status, setStatusState] = React.useState<VerificationStatus>("idle")
  const [shakes, setShakes] = React.useState(0)
  const [left, setLeft] = React.useState(resendAfter)
  const run = React.useRef(0)
  const timers = React.useRef<number[]>([])
  React.useEffect(
    () => () => {
      // Unmounted: no pending check or clear may land.
      run.current++
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    []
  )
  const later = React.useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id)
      fn()
    }, ms)
    timers.current.push(id)
  }, [])
  // A complete code is sent a beat after its last digit; any keystroke in between cancels that send.
  const queued = React.useRef(0)
  const checking = React.useRef(false)
  const setStatus = (s: VerificationStatus) => {
    setStatusState(s)
    onStatusChange?.(s)
  }

  React.useEffect(() => {
    if (left <= 0 || status === "verified") return
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000)
    return () => window.clearTimeout(t)
  }, [left, status])

  /** Checks a complete code. */
  const submit = async (full: string) => {
    // One check at a time: a second complete code waits for the first to finish.
    if (checking.current) return
    checking.current = true
    const id = ++run.current
    setStatus("checking")
    let ok = false
    try {
      const result = await verify(full)
      ok = result !== false && !(typeof Response !== "undefined" && result instanceof Response && !result.ok)
    } catch {
      ok = false
    }
    checking.current = false
    if (id !== run.current) return
    if (ok) {
      setStatus("verified")
      onVerified?.(full)
      return
    }
    setStatus("wrong")
    setShakes((n) => n + 1)
    later(() => {
      if (id !== run.current) return
      setCode("")
      setStatus("idle")
      input.current?.focus()
    }, clearAfter)
  }

  /** Starts the countdown again (after asking for a new code) and clears what was typed. */
  const restart = () => {
    run.current++
    queued.current++
    setLeft(resendAfter)
    setCode("")
    setStatus("idle")
  }

  /** A typed code; leaving the wrong state when the person starts again. */
  const type = (next: string) => {
    // A new edit owns the field: the wrong code's pending clear and any queued send no longer apply.
    queued.current++
    if (status === "wrong") run.current++
    setCode(next)
    if (status === "wrong") setStatus("idle")
  }

  /** Sends `full` after `ms`, unless the person types again first (then this send is dropped). */
  const queueSubmit = (full: string, ms: number) => {
    const ticket = ++queued.current
    later(() => {
      if (ticket === queued.current) void submit(full)
    }, ms)
  }

  return { code, type, status, shakes, left, submit, queueSubmit, restart, later, locked: status === "checking" || status === "verified" }
}

export { useVerificationCode, type VerificationCodeOptions, type VerificationStatus }
