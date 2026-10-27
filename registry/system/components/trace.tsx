// Notchset trace 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Popover } from "@base-ui/react/popover";
import { ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";
import { popupPositioner, popupSurface } from "@/lib/notchset/popup";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Trace: "Numbers you can trace", the Health template's identity line (the Assistant's receipt, for a reading). Under
 * every reading one quiet line says where it came from ("Ring · 07:02", "Northside Lab · 16 Oct · page 2"); pressed,
 * it opens the slip: the source, when it was measured, the range it was read against and who set that range. Ink and
 * paper, read like a slip, the receipt's face and rules.
 *
 *   <Trace line={["Northside Lab", "16 Oct", "page 2"]} rows={[["Source", "Northside Lab, follow-up panel"], ["Measured", "16 Oct 2026, 08:10"], ["Read against", "Lab range < 99 mg/dL"], ["Range set by", "Northside Lab"]]} />
 */
type TraceProps = {
  /** the line's parts, said in order */
  line: string[];
  /** the slip's rows: what, then the words */
  rows: [string, React.ReactNode][];
  /** what the slip is about ("HRV, last night") */
  title?: string | undefined;
  /** the line alone, not a button */
  interactive?: boolean | undefined;
  /** on a dark surface, or legible (ink-2) where it carries weight */
  tone?: "default" | "deep" | "legible" | undefined;
  className?: string | undefined;
};

function Line({ parts }: { parts: string[] }) {
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span aria-hidden className="opacity-50">
              /
            </span>
          )}
          <span>{p}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

function Trace({ line, rows, title = "Where this number comes from", interactive = true, tone = "default", className }: TraceProps) {
  const portal = usePortalContainer();
  const face = cn("font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none tabular-nums", tone === "deep" ? "text-[var(--ns-deep-ink-2)]" : tone === "legible" ? "text-[var(--ns-ink-2)]" : "text-[var(--ns-ink-3)]");
  if (!interactive)
    return (
      <span data-slot="trace" className={cn("inline-flex min-w-0 items-center gap-1.5", face, className)}>
        <ReceiptText aria-hidden className="size-3 shrink-0" />
        <Line parts={line} />
      </span>
    );
  return (
    <Popover.Root>
      <Popover.Trigger
        data-slot="trace"
        aria-label={`${line.join(", ")}. Trace this number`}
        className={cn(
          "relative z-[1] -mx-1.5 inline-flex min-h-7 max-w-full cursor-pointer items-center gap-1.5 self-start rounded-[var(--ns-radius-sm)] px-1.5 py-1 text-left outline-hidden [transition:box-shadow_var(--ns-time-color),color_var(--ns-time-color)] hover:shadow-[inset_0_0_0_1px_var(--ns-line)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] data-[popup-open]:shadow-[inset_0_0_0_1px_var(--ns-ink-3)]",
          face,
          className,
        )}
      >
        <ReceiptText aria-hidden className="size-3 shrink-0" />
        <Line parts={line} />
      </Popover.Trigger>
      <Popover.Portal container={portal}>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} collisionPadding={{ top: 8, right: 8, left: 8, bottom: 80 }} className={popupPositioner}>
          <Popover.Popup data-slot="trace-slip" data-ns-layer="" data-ns-moves="" className={cn(popupSurface, "w-[min(360px,calc(100vw-16px))] p-4 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-[1.55] tabular-nums")}>
            <Popover.Title className="m-0 flex items-center gap-1.5 font-[family-name:var(--ns-font-body)] text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-strong)] text-[var(--ns-ink)]">
              <ReceiptText aria-hidden className="size-3.5" />
              {title}
            </Popover.Title>
            <hr aria-hidden className="my-2 border-0 border-t border-dashed border-[var(--ns-line)]" />
            <dl className="m-0">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 py-1">
                  <dt className="text-[var(--ns-ink-3)]">{k}</dt>
                  <dd className="m-0 min-w-0 text-[var(--ns-ink)] [overflow-wrap:anywhere]">{v}</dd>
                </div>
              ))}
            </dl>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export { Trace, type TraceProps };
