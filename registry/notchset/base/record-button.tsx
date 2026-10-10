"use client"

/**
 * Record Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/record-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { Announcer, inertRef, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Record: a button that grows into a live recorder (a blinking dot, a scrolling waveform, a timer and a
 * stop button) and settles into a saved voice note. Clicking the note discards it. The waveform reads
 * `getLevel` (0–1) every 90ms; useMicrophone gives you one from the microphone, plus the recording.
 */

type RecordState = "idle" | "recording" | "saved"

interface RecordButtonProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children" | "onError"> {
  /** Starts recording (e.g. opens the microphone). Reject to stay idle: the button shakes. */
  onStart?: (() => Promise<void> | void) | undefined
  /** Called with the length in seconds when recording stops. */
  onStop?: ((seconds: number) => void) | undefined
  /** Called when the saved note is discarded. */
  onDiscard?: (() => void) | undefined
  /** The input level, 0–1, sampled every 90ms while recording. */
  getLevel?: (() => number) | undefined
  label?: React.ReactNode | undefined
  savedLabel?: React.ReactNode | undefined
  sound?: boolean | undefined
}

const BARS = 22
const WIDTH: Record<RecordState, number> = { idle: 124, recording: 248, saved: 208 }
const flat = () => Array.from({ length: BARS }, () => 3)
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

const RecordButton = React.forwardRef<HTMLDivElement, RecordButtonProps>(function RecordButton(
  { onStart, onStop, onDiscard, getLevel, label = "Record", savedLabel = "Voice note", sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const [state, setState] = React.useState<RecordState>("idle")
  const [levels, setLevels] = React.useState(flat)
  const [seconds, setSeconds] = React.useState(0)
  const [shakes, setShakes] = React.useState(0)
  const [starting, setStarting] = React.useState(false)
  const started = React.useRef(0)
  const levelRef = React.useRef(getLevel)
  const recordRef = React.useRef<HTMLButtonElement | null>(null)
  const stopRef = React.useRef<HTMLButtonElement>(null)
  const savedRef = React.useRef<HTMLButtonElement | null>(null)

  React.useEffect(() => {
    levelRef.current = getLevel
  })

  React.useEffect(() => {
    if (state !== "recording") return
    const id = setInterval(() => {
      const level = Math.max(0, Math.min(1, levelRef.current?.() ?? 0))
      setLevels((l) => [...l.slice(1), Math.max(3, Math.round(3 + level * 19))])
      setSeconds(Math.floor((Date.now() - started.current) / 1000))
    }, 90)
    return () => clearInterval(id)
  }, [state])

  const focusSoon = (target: React.RefObject<HTMLButtonElement | null>) => requestAnimationFrame(() => target.current?.focus())

  const start = async () => {
    if (state !== "idle" || starting) return
    setStarting(true)
    try {
      await onStart?.()
    } catch {
      sfx.buzz()
      setShakes((n) => n + 1)
      return
    } finally {
      setStarting(false)
    }
    sfx.recStart()
    started.current = Date.now()
    setSeconds(0)
    setState("recording")
    focusSoon(stopRef)
  }

  const stop = () => {
    if (state !== "recording") return
    const length = Math.max(1, Math.floor((Date.now() - started.current) / 1000))
    sfx.recStop()
    timeline.after(90, () => sfx.chime())
    setSeconds(length)
    setState("saved")
    onStop?.(length)
    focusSoon(savedRef)
  }

  const discard = () => {
    if (state !== "saved") return
    sfx.drop()
    setLevels(flat())
    setState("idle")
    onDiscard?.()
    focusSoon(recordRef)
  }

  return (
    <div
      ref={ref}
      data-slot="record-button"
      data-notchset=""
      data-state={state}
      className={cn(
        "relative h-11 max-w-full shrink-0 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] [transition:width_.5s_cubic-bezier(.2,1.2,.3,1)]",
        shakes > 0 && (shakes % 2 ? "animate-[ns-shake_.4s]" : "animate-[ns-shake-b_.4s]"),
        className
      )}
      style={{ width: WIDTH[state] }}
      {...props}
    >
      <button
        ref={(node) => {
          recordRef.current = node
          inertRef(state !== "idle")(node)
        }}
        type="button"
        aria-busy={starting}
        onClick={start}
        className={cn(
          "absolute inset-0 inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] whitespace-nowrap outline-none select-none [transition:opacity_.2s,background-color_var(--ns-time-color)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-inset",
          state === "idle" ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <span aria-hidden="true" className="block size-[9px] shrink-0 rounded-full bg-[var(--destructive)]" />
        {label}
      </button>
      <div
        ref={inertRef(state !== "recording")}
        className={cn("absolute inset-0 flex items-center gap-2.5 ps-3.5 pe-[5px] [transition:opacity_.25s]", state === "recording" ? "opacity-100" : "pointer-events-none opacity-0")}
      >
        <span aria-hidden="true" className="block size-[9px] shrink-0 animate-[ns-rec_1s_ease-in-out_infinite] rounded-full bg-[var(--destructive)]" />
        <span aria-hidden="true" className="flex h-6 flex-1 items-center justify-end gap-0.5 overflow-hidden">
          {levels.map((h, i) => (
            <span key={i} className="block w-0.5 shrink-0 rounded-[1px] bg-[var(--foreground)] [transition:height_.09s_linear]" style={{ height: h }} />
          ))}
        </span>
        <span className="w-[30px] font-mono text-[length:var(--ns-type-note)] tabular-nums">
          <span className="sr-only">Recording, </span>
          <NumberFlow value={clock(seconds)} />
        </span>
        <button
          ref={stopRef}
          type="button"
          aria-label="Stop recording"
          onClick={stop}
          className="grid size-[var(--ns-control-compact)] shrink-0 cursor-pointer place-items-center rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-foreground)] outline-none [transition:transform_.15s,scale_.15s,translate_.15s,rotate_.15s] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-[.88] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <span aria-hidden="true" className="block size-2.5 rounded-[2px] bg-current" />
        </button>
      </div>
      <button
        ref={(node) => {
          savedRef.current = node
          inertRef(state !== "saved")(node)
        }}
        type="button"
        aria-label={`${typeof savedLabel === "string" ? savedLabel : "Voice note"}, ${clock(seconds)}. Discard`}
        onClick={discard}
        className={cn(
          "absolute inset-0 inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] whitespace-nowrap outline-none select-none [transition:opacity_.25s,background-color_var(--ns-time-color)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-inset",
          state === "saved" ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 shrink-0 rtl:-scale-x-100" fill="currentColor">
          <path d="M6 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 6 4.5z" />
        </svg>
        {savedLabel}
        <span className="font-mono text-[length:var(--ns-type-note)] text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]">{clock(seconds)}</span>
      </button>
      <Announcer message={state === "recording" ? "Recording" : state === "saved" ? `Saved, ${clock(seconds)}` : shakes > 0 ? "Couldn't start recording" : ""} />
    </div>
  )
})

/**
 * The microphone for RecordButton: `start` asks for it and begins recording, `getLevel` is its loudness
 * (0–1), and `stop` resolves with the recording.
 */
function useMicrophone() {
  const parts = React.useRef<{ stream: MediaStream; context: AudioContext; analyser: AnalyserNode; recorder: MediaRecorder; chunks: Blob[] } | null>(null)
  const buffer = React.useRef<Float32Array<ArrayBuffer> | null>(null)

  const release = React.useCallback(() => {
    const p = parts.current
    if (!p) return
    p.stream.getTracks().forEach((t) => t.stop())
    void p.context.close()
    parts.current = null
  }, [])

  React.useEffect(() => release, [release])

  const start = React.useCallback(async () => {
    release()
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    context.createMediaStreamSource(stream).connect(analyser)
    const recorder = new MediaRecorder(stream)
    const chunks: Blob[] = []
    recorder.ondataavailable = (event) => chunks.push(event.data)
    recorder.start()
    buffer.current = new Float32Array(analyser.fftSize)
    parts.current = { stream, context, analyser, recorder, chunks }
  }, [release])

  const getLevel = React.useCallback(() => {
    const p = parts.current
    const data = buffer.current
    if (!p || !data) return 0
    p.analyser.getFloatTimeDomainData(data)
    let sum = 0
    for (const v of data) sum += v * v
    return Math.min(1, Math.sqrt(sum / data.length) * 4)
  }, [])

  const stop = React.useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const p = parts.current
        if (!p) return resolve(null)
        p.recorder.onstop = () => {
          resolve(new Blob(p.chunks, { type: p.recorder.mimeType }))
          release()
        }
        p.recorder.stop()
      }),
    [release]
  )

  return { start, stop, getLevel }
}

export { RecordButton, useMicrophone, type RecordButtonProps, type RecordState }
