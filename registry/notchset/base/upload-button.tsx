"use client"

/**
 * Upload Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/upload-button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { Announcer, DrawCheck, RollingLabel, useTimeline } from "@/lib/notchset/shared"
import { useSound } from "@/lib/notchset/sound"

/*
 * Upload: the button is its own progress bar. A wash fills it from the start edge with a 2px rail along
 * the bottom while a mono percentage counts up, each tenth ticks a little higher, and a check draws when
 * the upload resolves. Progress comes from your upload (XMLHttpRequest's upload.onprogress, or a fetch
 * stream): call `progress(fraction)` with 0–1.
 */

type UploadState = "idle" | "uploading" | "done"

interface UploadResult {
  /** Shown after the check, e.g. "2.4 MB". Defaults to the file's size. */
  detail?: React.ReactNode | undefined
}

interface UploadButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  /**
   * Runs the upload. `file` is the picked file (undefined with chooseFile={false}); call `progress` with
   * 0–1 as bytes go out. Resolve when it's stored; a rejection shakes the button.
   */
  onUpload: (file: File | undefined, progress: (fraction: number) => void) => Promise<UploadResult | void>
  onError?: ((error: unknown) => void) | undefined
  /** Called as the success state shows (after the work resolves and the minimum time), so anything that follows the button lands with it. */
  onSuccess?: (() => void) | undefined
  /** Open the file picker on press (default). Off: the press calls onUpload straight away, for a file you already hold. */
  chooseFile?: boolean | undefined
  /** The picker's accept list, e.g. ".pdf,image/*". */
  accept?: string | undefined
  /** The name shown while uploading when there is no picked file. */
  fileName?: string | undefined
  label?: React.ReactNode | undefined
  doneLabel?: React.ReactNode | undefined
  /** How long Uploaded shows before the button resets (ms). Default 2600. */
  resetAfter?: number | undefined
  sound?: boolean | undefined
}

const ROW = { idle: 0, uploading: 1, done: 2 } as const

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const UploadButton = React.forwardRef<HTMLButtonElement, UploadButtonProps>(function UploadButton(
  { onUpload, onError, onSuccess, chooseFile = true, accept, fileName = "file", label = "Upload file", doneLabel = "Uploaded", resetAfter = 2600, sound = true, disabled, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const timeline = useTimeline()
  const input = React.useRef<HTMLInputElement>(null)
  const [state, setState] = React.useState<UploadState>("idle")
  const [percent, setPercent] = React.useState(0)
  const [name, setName] = React.useState(fileName)
  const [detail, setDetail] = React.useState<React.ReactNode>(null)
  const [shakes, setShakes] = React.useState(0)
  const decile = React.useRef(0)
  const run = React.useRef(0)

  const start = async (file: File | undefined) => {
    const id = ++run.current
    timeline.clear()
    decile.current = 0
    setName(file?.name ?? fileName)
    setDetail(file ? formatBytes(file.size) : null)
    setPercent(0)
    setState("uploading")
    sfx.press()
    const progress = (fraction: number) => {
      if (id !== run.current || !Number.isFinite(fraction)) return
      const pct = Math.max(0, Math.min(100, Math.floor(fraction * 100)))
      const tenth = Math.floor(pct / 10)
      if (tenth > decile.current) {
        decile.current = tenth
        sfx.tone(800 + tenth * 45, 0.02, "triangle", 0.025)
      }
      setPercent((p) => Math.max(p, pct))
    }
    try {
      const result = await onUpload(file, progress)
      if (id !== run.current) return
      setPercent(100)
      if (result?.detail != null) setDetail(result.detail)
      timeline.after(220, () => {
        onSuccess?.()
        setState("done")
        sfx.chime()
      })
      timeline.after(220 + resetAfter, () => {
        setState("idle")
        setPercent(0)
      })
    } catch (error) {
      if (id !== run.current) return
      sfx.buzz()
      setShakes((n) => n + 1)
      setState("idle")
      setPercent(0)
      onError?.(error)
    }
  }

  const busy = state !== "idle"
  return (
    <>
      <button
        ref={ref}
        type="button"
        data-slot="upload-button"
        data-notchset=""
        data-state={state}
        aria-busy={state === "uploading" || undefined}
        disabled={disabled}
        onClick={() => {
          if (busy) return
          if (chooseFile) input.current?.click()
          else void start(undefined)
        }}
        className={cn(
          "relative inline-flex h-[var(--ns-control-field)] w-[200px] max-w-full shrink-0 cursor-pointer items-center overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-4 text-[length:var(--ns-type-copy)] font-medium tracking-[var(--ns-tracking-control)] text-[var(--foreground)] outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color)] not-disabled:active:scale-[var(--ns-press-depth)] hover:bg-[var(--accent)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          className
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 start-0 bg-[color-mix(in_oklab,var(--foreground)_9%,transparent)]",
            state === "idle" ? "opacity-0 [transition:opacity_.45s,width_0s_.45s]" : "opacity-100 [transition:width_.1s_linear]"
          )}
          style={{ width: `${percent}%` }}
        />
        <span
          aria-hidden="true"
          className={cn("absolute start-0 bottom-0 h-0.5 bg-[var(--foreground)]", state === "idle" ? "opacity-0 [transition:opacity_.45s,width_0s_.45s]" : "opacity-100 [transition:width_.1s_linear]")}
          style={{ width: `${percent}%` }}
        />
        <span key={shakes} className={cn("relative block w-full", shakes > 0 && "animate-[ns-shake_.42s]")}>
          <RollingLabel
            index={ROW[state]}
            rows={[
              <span key="idle" className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="m17 8-5-5-5 5" />
                  <path d="M12 3v12" />
                </svg>
                {label}
              </span>,
              <span key="uploading" className="flex w-full items-center justify-between gap-2 font-mono text-[length:var(--ns-type-note)]">
                <span className="min-w-0 truncate">{name}</span>
                <NumberFlow value={`${percent}%`} />
              </span>,
              <span key="done" className="flex items-center gap-2">
                <DrawCheck shown={state === "done"} className="size-[15px]" />
                {doneLabel}
                {detail != null && <span className="font-mono text-[11px] text-[var(--muted-foreground)]">{detail}</span>}
              </span>,
            ]}
          />
        </span>
        <Announcer message={state === "uploading" ? `Uploading ${name}` : state === "done" ? "Uploaded" : ""} />
      </button>
      {chooseFile && (
        <input
          ref={input}
          type="file"
          accept={accept}
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ""
            if (file) void start(file)
          }}
        />
      )}
    </>
  )
})

export { UploadButton, type UploadButtonProps, type UploadResult }
