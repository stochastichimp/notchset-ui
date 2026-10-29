// Notchset toast 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Toast } from "@base-ui/react/toast";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Toast: says what just happened, in two lines: the outcome ("Moved to Proposal"), then the detail ("Dropbox
 * · $48,000"). It offers the one way back (Undo, Reopen) or, on a failure, Retry. One at a time: a new toast
 * replaces the last. It sits low and to the left of the content (set --ns-toast-left past a sidebar), clears a
 * phone's tab bar, is read out politely, pauses while hovered, and can be swiped away.
 *
 *   notify({ title: "Moved to Proposal", detail: "Dropbox · $48,000", action: { label: "Undo", onClick: undo } })
 *
 * Mount <Toaster /> once near the root.
 */
const manager = Toast.createToastManager();

type Notice = {
  title: string;
  detail?: string | undefined;
  action?: { label: string; onClick: () => void; hint?: string | undefined } | undefined;
  /** ok: something finished for real (a reply left): an emerald tick leads the title */
  tone?: "default" | "ok" | "error" | undefined;
  /** A window that runs out (a send you can still take back): the title counts down each second ("Sending in 4")
      and a thin bar drains along the bottom; the toast stays exactly as long. */
  countdown?: { ms: number; label: (seconds: number) => string } | undefined;
};

function notify({ title, detail, action, tone = "default", countdown }: Notice) {
  return manager.add({
    title,
    description: detail,
    type: tone,
    timeout: countdown ? countdown.ms : tone === "error" ? 7000 : 4800,
    priority: tone === "error" ? "high" : "low",
    data: { action, countdown, at: Date.now() },
  });
}

/** Takes a toast away now, hovered or not: an offer whose window has closed (an Undo that has run out) goes with it. */
function dismiss(id: string) {
  manager.close(id);
}

/** The seconds left, ticking; the bar drains in the working colour (work under way, not done). */
function Countdown({ ms, at, label }: { ms: number; at: number; label: (s: number) => string }) {
  const left = () => Math.max(0, Math.ceil((at + ms - Date.now()) / 1000));
  const [s, setS] = React.useState(left);
  React.useEffect(() => {
    const t = setInterval(() => setS(left()), 250);
    return () => clearInterval(t);
  });
  return <>{label(s)}</>;
}

function Toaster() {
  const portalContainer = usePortalContainer();
  return (
    <Toast.Provider toastManager={manager} limit={1}>
      <Toast.Portal container={portalContainer}>
        <Toast.Viewport
          data-slot="toaster"
          className="fixed bottom-6 left-[var(--ns-toast-left)] z-[60] w-max max-w-[calc(100vw-32px)] max-[600px]:right-3 max-[600px]:bottom-[var(--ns-toast-bottom)] max-[600px]:left-3 max-[600px]:w-auto"
        >
          <Toasts />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function Toasts() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((t) => {
    const { action, countdown, at = 0 } = (t.data as { action?: Notice["action"]; countdown?: Notice["countdown"]; at?: number } | undefined) ?? {};
    const error = t.type === "error";
    return (
      <Toast.Root
        key={t.id}
        toast={t}
        data-ns-moves=""
        className={cn(
          "absolute bottom-0 left-0 w-max max-w-[min(520px,calc(100vw-32px))] rounded-[var(--ns-radius-lg)] shadow-[0_14px_34px_-10px_rgba(0,0,0,.45)] select-none max-[960px]:w-full max-[960px]:max-w-none",
          "[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--toast-swipe-movement-y))] [transition:transform_200ms_var(--ns-ease),opacity_180ms_ease]",
          "[animation:ns-toast-in_var(--ns-time-toast)_var(--ns-ease)] data-ending-style:opacity-0 data-limited:opacity-0",
          error ? "bg-[color-mix(in_oklab,var(--ns-bad)_80%,black)] text-white" : "bg-[var(--ns-ink)] text-[var(--ns-canvas)]",
        )}
      >
        <Toast.Content className="flex items-center gap-3 py-2.5 pr-2 pl-4">
          {t.type === "ok" && <Check aria-hidden strokeWidth={2.5} className="-mr-1 size-4 shrink-0 text-[color-mix(in_oklab,var(--ns-ok)_70%,var(--ns-canvas))] [animation:ns-born_var(--ns-time-born)_var(--ns-ease)]" />}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Toast.Title className="m-0 text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-medium)] tabular-nums">{countdown ? <Countdown ms={countdown.ms} at={at} label={countdown.label} /> : undefined}</Toast.Title>
            <Toast.Description className="m-0 text-[length:var(--ns-text-small)] opacity-75" />
          </span>
          {action && (
            <Toast.Action
              onClick={action.onClick}
              title={action.hint}
              className={cn(
                "flex h-7 shrink-0 cursor-pointer items-center rounded-[7px] px-2.5 text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-medium)] outline-hidden focus-visible:outline-2 focus-visible:outline-offset-1 pointer-coarse:h-9",
                error ? "bg-white/15 text-white focus-visible:outline-white" : "bg-[color-mix(in_oklab,var(--ns-canvas)_14%,transparent)] text-[var(--ns-canvas)] focus-visible:outline-[var(--ns-canvas)]",
              )}
            >
              {action.label}
            </Toast.Action>
          )}
        </Toast.Content>
        {countdown && <span aria-hidden data-ns-glide="" className="absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-[var(--ns-signal)] [animation:ns-drain_linear_forwards]" style={{ animationDuration: `${countdown.ms}ms` }} />}
      </Toast.Root>
    );
  });
}

export { dismiss, notify, Toaster, type Notice };
