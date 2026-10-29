// Notchset share-view 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Check, Link2, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/notchset/button";
import { IconButton } from "@/components/ui/notchset/icon-button";
import { RecipientField, type Recipient } from "@/components/ui/notchset/recipient-field";
import { SegmentedControl } from "@/components/ui/notchset/segmented-control";

/*
 * Share this view: the Share pill opens into the panel it was hiding, in place, so you never lose where you were.
 * Copy the link (it says Copied only when it was; otherwise the link is selected to copy by hand), pick who can
 * open it, add people as chips and Send. A send that works closes
 * the panel back into the pill, which now says who has it; a send that fails keeps the panel, the people and the
 * note, says nobody was told, and offers Retry. Escape or the close button folds it back and returns focus to
 * the pill.
 *
 *   <ShareView view="Q4 commit, EMEA" link="https://app.example.com/v/q4-emea" people={team}
 *     access={[{ value: "team", label: "Team" }, { value: "invited", label: "Only invited" }]} onSend={(to, access) => send(to, access)} />
 */
type ShareViewProps = {
  /** the view's name, said in the panel's title */
  view: string;
  link: string;
  people: Recipient[];
  access: { value: string; label: string }[];
  /** people already chosen when it opens */
  defaultTo?: Recipient[] | undefined;
  /** the host's send; reject (or resolve false) to refuse it */
  onSend?: ((to: Recipient[], access: string) => Promise<boolean | void> | boolean | void) | undefined;
  /** where the pill sits and the panel grows from: the middle, or the end of a toolbar */
  align?: "center" | "end" | undefined;
  className?: string | undefined;
};

const PILL_W = 104, PILL_H = 36;
/* before paint in the browser; on the server (where layout effects warn) an ordinary effect */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

function ShareView({ view, link, people, access: levels, defaultTo = [], onSend, align = "center", className }: ShareViewProps) {
  const [open, setOpen] = React.useState(false);
  const [to, setTo] = React.useState<Recipient[]>(defaultTo);
  const [access, setAccess] = React.useState(levels[0]?.value ?? "");
  const [copied, setCopied] = React.useState(false);
  const [state, setState] = React.useState<"idle" | "busy" | "failed">("idle");
  const [sent, setSent] = React.useState<Recipient[]>([]);
  const [h, setH] = React.useState(PILL_H);
  const inner = React.useRef<HTMLDivElement>(null);
  const linkText = React.useRef<HTMLSpanElement>(null);
  const pill = React.useRef<HTMLButtonElement>(null);
  const root = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  /* the share is this view at this link: given another, it starts as that one's own (its default people, first
     access, nothing sent), and an answer still on its way for the one before lands nowhere */
  const share = `${view}\n${link}`;
  const [shown, setShown] = React.useState(share);
  if (shown !== share) {
    setShown(share);
    setTo(defaultTo);
    setAccess(levels[0]?.value ?? "");
    setState("idle");
    setSent([]);
    setCopied(false);
  }
  /* a generation per share change: A, then B, then A again is a new A, so the first A's answer still lands nowhere */
  const generation = React.useRef(0);
  useIsomorphicLayoutEffect(() => {
    generation.current += 1;
  }, [share]);
  /* a send belongs to the share it was made from, not to the panel: it outlives Close, its people and access are
     locked while it runs, and when it lands it only folds a panel that is still open, taking focus back to the
     pill only if focus was still in this share. Unmounted, or the share replaced by another view, it changes nothing */
  const isOpen = React.useRef(open);
  React.useEffect(() => {
    isOpen.current = open;
  }, [open]);
  const alive = React.useRef(true);
  React.useEffect(() => {
    alive.current = true;
    return () => void (alive.current = false);
  }, []);
  /* opening hands focus to the panel's first field, so Escape and Tab start inside it */
  React.useEffect(() => {
    if (open) requestAnimationFrame(() => inner.current?.querySelector<HTMLElement>("input, button:not([disabled])")?.focus({ preventScroll: true }));
  }, [open]);

  /* the panel's height follows what it holds, so a chip or a failure line grows it smoothly */
  React.useEffect(() => {
    const el = inner.current;
    if (!open || !el) return;
    const fit = () => setH(el.offsetHeight);
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const close = () => {
    setOpen(false);
    setH(PILL_H);
    requestAnimationFrame(() => {
      const a = document.activeElement;
      if (!a || a === document.body || !!root.current?.contains(a)) pill.current?.focus();
    });
  };
  const copyGen = React.useRef(0);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => {
    copyGen.current += 1;
    clearTimeout(copyTimer.current);
  }, [share]);
  React.useEffect(() => () => clearTimeout(copyTimer.current), []);
  const copy = async () => {
    const mine = ++copyGen.current;
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(link);
    } catch {
      if (copyGen.current !== mine) return;
      /* not copied, so never "Copied": the link is selected to copy by hand */
      const el = linkText.current, sel = window.getSelection();
      if (el && sel) {
        const r = document.createRange();
        r.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      return;
    }
    if (!alive.current || copyGen.current !== mine) return;
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1800);
  };
  const send = async () => {
    if (!to.length || state === "busy") return;
    const mine = generation.current;
    setState("busy");
    let ok = true;
    try {
      ok = (await onSend?.(to, access)) !== false;
    } catch {
      ok = false;
    }
    if (!alive.current || generation.current !== mine) return;
    if (!ok) return setState("failed");
    setState("idle");
    setSent(to);
    setTo([]);
    if (isOpen.current) close();
  };
  const who = (xs: Recipient[]) => (xs.length === 1 ? xs[0]!.name.split(" ")[0] : `${xs.length} people`);

  return (
    <div ref={root} data-slot="share-view" className={cn("flex w-full flex-col", align === "end" ? "items-end" : "items-center", className)}>
      <div
        data-ns-glide=""
        data-open={open || undefined}
        className={cn(
          "relative overflow-hidden bg-[var(--ns-panel)] [transition:width_var(--ns-time-page)_var(--ns-ease-panel),height_var(--ns-time-page)_var(--ns-ease-panel),border-radius_var(--ns-time-page)_var(--ns-ease-panel),box-shadow_var(--ns-time-color)]",
          open ? "rounded-[var(--ns-radius-xl)] shadow-[var(--ns-shadow-float)]" : "rounded-[18px] shadow-[var(--ns-bezel)]",
        )}
        style={{ width: open ? "100%" : PILL_W + (sent.length ? 40 : 0), maxWidth: 420, height: open ? h : PILL_H }}
      >
        {!open ? (
          <button
            ref={pill}
            type="button"
            aria-expanded={false}
            aria-label={sent.length ? `Share. Shared with ${who(sent)}` : "Share"}
            onClick={() => {
              setOpen(true);
              /* reopened while a send runs, it shows that send, still locked */
              setState((s) => (s === "busy" ? s : "idle"));
            }}
            className="flex size-full cursor-pointer items-center justify-center gap-1.5 text-[length:var(--ns-text-control)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] outline-hidden hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ns-signal)] [&_svg]:size-3.5"
          >
            {sent.length ? <Check className="text-[var(--ns-ok)]" /> : <Share2 />}
            {sent.length ? `Shared · ${who(sent)}` : "Share"}
          </button>
        ) : (
          <div
            ref={inner}
            role="dialog"
            aria-labelledby={titleId}
            onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), close())}
            data-ns-moves=""
            className="absolute inset-x-0 top-0 flex flex-col gap-3 p-4 [animation:ns-island-in_var(--ns-time-dialog)_var(--ns-ease)_120ms_both]"
          >
            <div className="flex items-center gap-2">
              <span id={titleId} className="min-w-0 flex-1 truncate text-[length:var(--ns-text-strong)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">
                Share &ldquo;{view}&rdquo;
              </span>
              <IconButton label="Close" size="sm" variant="ghost" tooltip={false} onClick={close}>
                <X />
              </IconButton>
            </div>
            <div className="flex items-center gap-2 rounded-[var(--ns-radius)] bg-[var(--ns-well)] py-1 pr-1 pl-2.5">
              <Link2 aria-hidden className="size-3.5 shrink-0 text-[var(--ns-ink-3)]" />
              <span ref={linkText} className="min-w-0 flex-1 truncate text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)] select-all">{link}</span>
              <Button size="sm" onClick={() => void copy()} aria-live="polite">
                {copied ? <Check className="text-[var(--ns-ok)]" /> : null}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
            <fieldset disabled={state === "busy"} className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">
                Who can open it
                <SegmentedControl label="Who can open it" size="sm" options={levels} value={access} onValueChange={setAccess} />
              </div>
              <RecipientField aria-label="Send to" placeholder="Add people to tell" people={people} value={to} onValueChange={(v) => (setTo(v), state === "failed" && setState("idle"))} />
            </fieldset>
            <div aria-live="polite" className="flex items-center justify-end gap-3">
              {state === "failed" && (
                <span data-ns-moves="" className="min-w-0 flex-1 text-[length:var(--ns-text-small)] text-[var(--ns-bad-ink)] [animation:ns-island-in_var(--ns-time-dialog)_var(--ns-ease)_both]">
                  Couldn&rsquo;t send. Nobody was told; the people are kept.
                </span>
              )}
              <Button variant="primary" disabled={!to.length} busy={state === "busy"} onClick={() => void send()}>
                {state === "busy" ? "Sending…" : state === "failed" ? "Retry" : to.length ? `Send to ${who(to)}` : "Send"}
              </Button>
            </div>
          </div>
        )}
      </div>
      <span aria-live="polite" className="sr-only">
        {sent.length && !open ? `Sent to ${sent.map((p) => p.name).join(", ")}` : ""}
      </span>
    </div>
  );
}

export { ShareView, type ShareViewProps };
