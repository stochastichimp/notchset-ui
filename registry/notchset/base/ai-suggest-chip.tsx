"use client"

/**
 * AI Suggestion Chip (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/ai-suggest-chip
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Announcer } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * AI Suggestion Chip: press it and the sparkles spin while it thinks (soft bubbles), then the
 * suggestion types itself out as your stream arrives, and Retry and Accept fade up. Accepting sparkles
 * and shows Applied · Undo; pressing that reverts. The chip's width follows each state.
 */

type ChipState = "idle" | "thinking" | "typing" | "applied"

interface AiSuggestChipProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * Produces a suggestion: call `emit(chunk)` as text streams in (or once with the whole text), and
   * resolve when it's complete. `attempt` counts retries from 0; `signal` aborts when superseded.
   */
  onSuggest: (emit: (chunk: string) => void, context: { attempt: number; signal: AbortSignal }) => Promise<unknown>
  /** Runs with the suggestion when it's accepted. */
  onAccept?: ((text: string) => void) | undefined
  /** Runs when Applied · Undo is pressed. */
  onUndo?: (() => void) | undefined
  onError?: ((error: unknown) => void) | undefined
  label?: React.ReactNode | undefined
  sound?: boolean | undefined
}

/** Characters typed per tick, and the tick (ms): the suggestion types at a readable pace however fast it streams. */
const TYPE_MS = 26

const Sparkles = ({ state, done }: { state: ChipState; done: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={cn(
      "size-[15px] shrink-0",
      state === "thinking" && "animate-[ns-spin_1s_cubic-bezier(.5,0,.5,1)_infinite]",
      state === "typing" && !done && "animate-[ns-twinkle_.8s_ease-in-out_infinite]"
    )}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
)

const AiSuggestChip = React.forwardRef<HTMLDivElement, AiSuggestChipProps>(function AiSuggestChip(
  { onSuggest, onAccept, onUndo, onError, label = "Suggest a title", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [state, setState] = React.useState<ChipState>("idle")
  const [shown, setShown] = React.useState("")
  const [complete, setComplete] = React.useState(false)
  const received = React.useRef("")
  const streamDone = React.useRef(false)
  const attempt = React.useRef(0)
  const controller = React.useRef<AbortController | null>(null)
  const typer = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const bubbles = React.useRef<ReturnType<typeof setTimeout>[]>([])

  const stopTimers = () => {
    if (typer.current) clearInterval(typer.current)
    typer.current = null
    for (const t of bubbles.current) clearTimeout(t)
    bubbles.current = []
  }
  React.useEffect(
    () => () => {
      stopTimers()
      controller.current?.abort()
    },
    []
  )

  const run = async (n: number) => {
    stopTimers()
    controller.current?.abort()
    const ctrl = new AbortController()
    controller.current = ctrl
    attempt.current = n
    received.current = ""
    streamDone.current = false
    setShown("")
    setComplete(false)
    setState("thinking")
    for (let i = 0; i < 6; i++) bubbles.current.push(setTimeout(() => sfx.tone(700 + Math.random() * 700, 0.05, "sine", 0.022), i * 130))
    let typed = 0
    const startTyping = () => {
      if (typer.current) return
      setState("typing")
      typer.current = setInterval(() => {
        if (typed < received.current.length) {
          typed += 1
          if (typed % 2) sfx.tone(1900 + Math.random() * 500, 0.012, "triangle", 0.012)
          setShown(received.current.slice(0, typed))
        } else if (streamDone.current) {
          if (typer.current) clearInterval(typer.current)
          typer.current = null
          setComplete(true)
        }
      }, TYPE_MS)
    }
    const emit = (chunk: string) => {
      if (ctrl.signal.aborted) return
      received.current += chunk
      startTyping()
    }
    try {
      await onSuggest(emit, { attempt: n, signal: ctrl.signal })
      if (ctrl.signal.aborted) return
      streamDone.current = true
      startTyping()
    } catch (error) {
      if (ctrl.signal.aborted) return
      stopTimers()
      sfx.buzz()
      setState("idle")
      onError?.(error)
    }
  }

  const press = () => {
    if (state === "thinking" || state === "typing") return
    if (state === "applied") {
      sfx.drop()
      setState("idle")
      onUndo?.()
      return
    }
    void run(attempt.current)
  }

  const ready = state === "typing" && complete
  return (
    <div
      ref={ref}
      data-slot="ai-suggest-chip"
      data-notchset=""
      data-state={state}
      className={cn(
        "inline-flex h-[38px] max-w-full items-center gap-1 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] px-[3px] text-[var(--secondary-foreground)] [transition:max-width_.55s_var(--ns-ease-settle)]",
        state === "thinking" ? "max-w-[170px]" : state === "typing" ? "max-w-[360px]" : "max-w-[220px]",
        className
      )}
      {...props}
    >
      <button
        type="button"
        aria-busy={state === "thinking" || (state === "typing" && !complete) || undefined}
        onClick={press}
        className="inline-flex h-[30px] min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-[var(--radius)] ps-2 pe-2.5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap outline-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[var(--ns-press-depth)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      >
        <Sparkles state={state} done={complete} />
        {state === "idle" && <span className="animate-[ns-fade-up_.3s_both]">{label}</span>}
        {state === "thinking" && (
          <span className="animate-[ns-shimmer_1.1s_linear_infinite] bg-[linear-gradient(90deg,var(--muted-foreground)_0%,var(--muted-foreground)_35%,var(--foreground)_50%,var(--muted-foreground)_65%,var(--muted-foreground)_100%)] [background-size:200%_100%] bg-clip-text text-transparent">
            Thinking
          </span>
        )}
        {state === "typing" && (
          <span className="truncate">
            {shown}
            {!complete && <span aria-hidden="true" className="ms-0.5 inline-block h-3.5 w-[1.5px] animate-[ns-blink_.8s_steps(1)_infinite] bg-current align-[-2px]" />}
          </span>
        )}
        {state === "applied" && <span className="animate-[ns-fade-up_.3s_both]">Applied · Undo</span>}
      </button>
      {ready && (
        <span className="flex shrink-0 animate-[ns-fade-up_.3s_both] gap-0.5">
          <button
            type="button"
            aria-label="Try another"
            onClick={() => {
              sfx.tick()
              void run(attempt.current + 1)
            }}
            className="grid size-[30px] cursor-pointer place-items-center rounded-[var(--radius)] outline-none [transition:background-color_.15s,transform_.15s,scale_.15s,translate_.15s,rotate_.15s] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.88] active:-rotate-90 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Use suggestion"
            onClick={() => {
              sfx.sparkle()
              setState("applied")
              onAccept?.(received.current)
            }}
            className="grid size-[30px] cursor-pointer place-items-center rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-foreground)] outline-none [transition:transform_.15s,scale_.15s,translate_.15s,rotate_.15s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.88] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
        </span>
      )}
      <Announcer message={state === "thinking" ? "Thinking" : ready ? `Suggestion: ${shown}` : state === "applied" ? "Applied" : ""} />
    </div>
  )
})

export { AiSuggestChip, type AiSuggestChipProps }
