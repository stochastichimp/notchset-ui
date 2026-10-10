"use client"

/**
 * File Dropzone (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/file-dropzone
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { NumberFlow } from "@/lib/notchset/number-flow"
import { useSound } from "@/lib/notchset/sound"

/*
 * File Dropzone: a 164px zone that comes alive under a drag (solid info border, 7% wash, the disc
 * fills and pulses, the arrow lifts, the zone grows 1.5%) and folds to a 76px strip once files land.
 * Each file is a tile whose outline is its progress; done greens the outline, fades it and pops a check
 * onto the type block; failed dashes it red, shakes, and offers Retry. Your upload code drives the
 * files; × removes a tile.
 */

type UploadStatus = "uploading" | "done" | "failed"

interface UploadFile {
  id: string
  name: string
  /** Bytes. */
  size: number
  /** 0–100. */
  progress: number
  status: UploadStatus
}

interface FileDropzoneProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onDrop"> {
  files: readonly UploadFile[]
  onFiles: (files: File[]) => void
  onRetry: (id: string) => void
  onRemove: (id: string) => void
  accept?: string | undefined
  title?: string | undefined
  hint?: React.ReactNode | undefined
  /** Tints per extension, e.g. { JPG: "var(--chart-1)" }. */
  tints?: Record<string, string> | undefined
  sound?: boolean | undefined
}

const fmt = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const ext = (n: string) => (n.split(".").pop() ?? "file").toUpperCase().slice(0, 4)

const FileDropzone = React.forwardRef<HTMLDivElement, FileDropzoneProps>(function FileDropzone(
  { files, onFiles, onRetry, onRemove, accept, title = "Drop files here", hint = "or click to browse", tints = {}, sound = true, className, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const input = React.useRef<HTMLInputElement>(null)
  const [over, setOver] = React.useState(false)
  const [leaving, setLeaving] = React.useState<string[]>([])
  const prev = React.useRef(new Map<string, UploadStatus>())
  React.useEffect(() => {
    let k = 0
    for (const f of files) {
      const was = prev.current.get(f.id)
      if (was && was !== f.status) {
        if (f.status === "done") window.setTimeout(() => sfx.ding(2), k++ * 90)
        else if (f.status === "failed") sfx.buzz()
      }
      prev.current.set(f.id, f.status)
    }
  }, [files, sfx])
  React.useEffect(() => {
    if (!leaving.length) return
    const t = window.setTimeout(() => {
      leaving.forEach(onRemove)
      setLeaving([])
    }, 380)
    return () => window.clearTimeout(t)
  }, [leaving, onRemove])

  const has = files.length > 0
  const take = (list: FileList | null) => {
    const arr = Array.from(list ?? [])
    setOver(false)
    if (!arr.length) return
    sfx.pop()
    onFiles(arr)
  }

  return (
    <div ref={ref} data-slot="file-dropzone" data-notchset="" className={cn("flex w-full max-w-[440px] flex-col gap-3", className)} {...props}>
      <input ref={input} type="file" multiple accept={accept} className="hidden" onChange={(e) => {
        take(e.target.files)
        e.target.value = ""
      }} />
      <div
        role="button"
        tabIndex={0}
        aria-label={`${title}. ${typeof hint === "string" ? hint : "Upload files"}`}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return
          e.preventDefault()
          input.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!over) {
            setOver(true)
            sfx.open()
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          take(e.dataTransfer.files)
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[22px] border-[1.5px] outline-none [transition:height_.55s_cubic-bezier(.2,1.2,.3,1),gap_.45s,border-color_var(--ns-time-color),background-color_var(--ns-time-color),scale_.3s_cubic-bezier(.2,1.4,.3,1)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] motion-reduce:transition-none",
          over ? "scale-[1.015] border-solid border-[var(--info,var(--chart-1))] bg-[color-mix(in_oklab,var(--info,var(--chart-1))_7%,var(--background))]" : "border-dashed border-[color-mix(in_oklab,var(--foreground)_22%,var(--border))] bg-[var(--background)]",
          has ? "h-[76px] gap-1.5" : "h-[164px] gap-3"
        )}
      >
        <span className={cn("relative grid shrink-0 place-items-center rounded-full [transition:width_.45s_var(--ns-ease-reshape),height_.45s_var(--ns-ease-reshape),background-color_var(--ns-time-color),color_var(--ns-time-color)]", over ? "bg-[var(--info,var(--chart-1))] text-white" : "bg-[var(--muted)] text-[var(--foreground)]", has ? "size-[30px]" : "size-11")}>
          {over && <span aria-hidden="true" className="absolute -inset-1.5 animate-[ns-halo-ring_1.4s_ease-out_infinite] rounded-full border-2 border-[var(--info,var(--chart-1))] opacity-0 motion-reduce:hidden" />}
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 [transition:translate_.45s_var(--ns-ease-pop)]" style={{ translate: over ? "0 -3px" : "0 0" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
          </svg>
        </span>
        <span className="flex flex-col items-center gap-[3px]">
          <span className="text-[length:var(--ns-type-copy)] font-semibold whitespace-nowrap">{over ? "Let go to upload" : title}</span>
          <span className="overflow-hidden text-[12.5px] whitespace-nowrap text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] [transition:max-height_.4s,opacity_.25s]" style={{ maxHeight: has ? 0 : 20, opacity: has ? 0 : 1 }}>
            {hint}
          </span>
        </span>
      </div>
      {has && (
        <ul className="m-0 grid list-none grid-cols-3 gap-2.5 p-0 max-[400px]:grid-cols-2">
          {files.map((f) => {
            const ok = f.status === "done"
            const fail = f.status === "failed"
            const x = ext(f.name)
            const tint = tints[x] ?? "var(--chart-3)"
            const gone = leaving.includes(f.id)
            return (
              <li
                key={`${f.id}-${fail ? "f" : "a"}`}
                className={cn("relative flex min-h-[124px] flex-col gap-2 rounded-[16px] p-3 [transition:opacity_.25s,scale_.4s_var(--ns-ease-reshape),background-color_.3s]", fail ? "animate-[ns-shake_.42s] bg-[color-mix(in_oklab,var(--destructive)_6%,var(--background))]" : "animate-[ns-drop-in-face_.45s_var(--ns-ease-pop)_both] bg-[var(--background)]", "motion-reduce:animate-none")}
                style={{ opacity: gone ? 0 : 1, scale: gone ? ".6" : "1" }}
              >
                <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
                  <rect x=".5" y=".5" rx="15.5" fill="none" stroke="var(--border)" strokeWidth="1" style={{ width: "calc(100% - 1px)", height: "calc(100% - 1px)" }} />
                  <rect
                    x="1"
                    y="1"
                    rx="15"
                    fill="none"
                    strokeWidth="2"
                    pathLength={1}
                    strokeDasharray={fail ? ".03 .02" : "1"}
                    strokeDashoffset={fail ? 0 : 1 - f.progress / 100}
                    className="[transition:stroke-dashoffset_.15s_linear,stroke_.3s,opacity_.5s_.5s]"
                    style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)", stroke: fail ? "var(--destructive)" : ok ? "var(--success,var(--chart-3))" : "var(--info,var(--chart-1))", opacity: ok ? 0 : 1 }}
                  />
                </svg>
                <div className="relative flex items-start justify-between">
                  <span className="relative grid size-10 place-items-center rounded-[11px] font-mono text-[9.5px] font-bold" style={{ background: `color-mix(in oklab, ${tint} 16%, transparent)`, color: `color-mix(in oklab, ${tint} 75%, var(--foreground))` }}>
                    {x}
                    <span aria-hidden="true" className="absolute -end-[5px] -bottom-[5px] grid size-[18px] place-items-center rounded-full bg-[var(--success,var(--chart-3))] text-[var(--success-foreground,#fff)] shadow-[0_0_0_2px_var(--background)] [transition:opacity_.2s,scale_.4s_var(--ns-ease-rebound)]" style={{ opacity: ok ? 1 : 0, scale: ok ? "1" : ".4" }}>
                      <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => {
                      sfx.drop()
                      setLeaving((l) => [...l, f.id])
                    }}
                    className="-me-1 -mt-1 grid size-[26px] cursor-pointer place-items-center rounded-full text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))] outline-none hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))]"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
                <span className="relative mt-auto flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[12.5px] font-semibold">{f.name}</span>
                  <span
                    aria-live="polite"
                    className={cn("flex items-center gap-1 font-mono text-[10.5px] whitespace-nowrap", ok && "text-[color-mix(in_oklab,var(--success,var(--chart-3))_75%,var(--foreground))]", fail && "text-[var(--destructive)]", !ok && !fail && "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]")}
                  >
                    {f.status === "uploading" && (
                      <span className="inline-flex">
                        <NumberFlow value={`${Math.round(f.progress)}%`} />
                      </span>
                    )}
                    {ok ? `${fmt(f.size)} · done` : fail ? `Dropped at ${Math.round(f.progress)}%` : ` · ${fmt(f.size)}`}
                  </span>
                  {fail && (
                    <button
                      type="button"
                      onClick={() => {
                        sfx.tone(600, 0.1, "sine", 0.035, 0, 900)
                        onRetry(f.id)
                      }}
                      className="mt-0.5 flex h-[26px] animate-[ns-chip_.4s_var(--ns-ease-pop)_both] cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--destructive)] text-[length:var(--ns-type-note)] font-semibold text-white outline-none focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] active:scale-95"
                    >
                      Retry
                    </button>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
})

export { FileDropzone, type FileDropzoneProps, type UploadFile, type UploadStatus }
