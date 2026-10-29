// Notchset operation 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Banner } from "@/components/ui/notchset/banner";
import { Button } from "@/components/ui/notchset/button";
import { opError, toOpError, type OpError } from "@/lib/notchset/op-error";
import { Spinner } from "@/components/ui/notchset/spinner";
import { notify } from "@/components/ui/notchset/toast";

/*
 * Operation: one lifecycle for every change a person makes (create, edit, delete, import, send). LANGUAGE.md §2
 * and §7, "Async work belongs to the operation".
 *
 *   const save = useOperation((v: string, signal) => adapter.updateDeal(id, { value: v }, { signal }), { key: `deal:${id}:value` });
 *   save.run("164000");        // pending → done (save.result is the stored record) or failed (save.error: OpError)
 *   <OpStatus op={save} was="Was $148,000." onUndo={…} />
 *
 * - The draft (the last input) is kept until the server acknowledges it; retry() sends it again.
 * - One operation per key: a second hook with the same key (a panel closed and opened again) sees the same
 *   operation, still running; a late answer, success or refusal, never overrides a newer run on that key.
 * - optimistic(input) applies the change at once and returns how to undo it; a refusal rolls back to the newest
 *   state not refused (a newer run still pending or done keeps its value).
 * - Pending, done and failed are announced politely, once, from one shared live region.
 * - A write has no timeout: past OP_DEFAULTS.slowMs the status says "Still saving…" and the operation keeps waiting
 *   (a timed-out write that is still running lands anyway, and Retry would make a duplicate). A caller may opt into
 *   timeoutMs only when it also passes the signal to its request, so the timeout truly aborts it.
 */

/**
 * The founder's three switches (Go-live concept, 28 Oct 2026). Each is one value, read by every piece below.
 * failedVerb "keep": a failed create keeps its footer verb ("Create deal") and offers Retry and Edit in the banner;
 * "retry" swaps the verb to "Try again" and keeps only Edit in the banner. savedWordMs: how long an inline field
 * says a quiet "Saved" (0: say nothing, the value is the proof). createdToast: a new row lands with its mark and a
 * toast with Open (false: the mark only).
 */
export const OP_DEFAULTS: { failedVerb: "keep" | "retry"; savedWordMs: number; createdToast: boolean; timeoutMs: number; slowMs: number } = {
  failedVerb: "keep",
  savedWordMs: 2000,
  createdToast: true,
  timeoutMs: 0,
  slowMs: 15_000,
};

export type OpState = "idle" | "pending" | "done" | "failed";

/** What a run came to: done with the stored record, failed with the reason, or stale (a newer run, or a reset, took its place). */
export type OpOutcome<R> = { state: "done"; result: R } | { state: "failed"; error: OpError } | { state: "stale" };

type Words<I, R> = {
  pending?: string | ((input: I) => string) | undefined;
  done?: string | ((result: R, input: I) => string) | undefined;
  failed?: string | ((error: OpError, input: I) => string) | undefined;
};

export type OperationOptions<I, R> = {
  /** One operation per key (a record id, "deal:42:value"): it outlives the component and is shared by every hook with the key. */
  key?: string | undefined;
  /** Polite live-region words; false says nothing (when the change is announced by what it changes). */
  announce?: Words<I, R> | false | undefined;
  /** Applies the change at once; returns how to put it back if the server refuses. */
  optimistic?: ((input: I) => (() => void) | void) | undefined;
  onDone?: ((result: R, input: I) => void) | undefined;
  onError?: ((error: OpError, input: I) => void) | undefined;
  /** Fails as a timeout after this long; 0 (the default) waits. Opt in only when `fn` passes its signal to the request, so the timeout really aborts it. */
  timeoutMs?: number | undefined;
};

export type Operation<I, R> = {
  state: OpState;
  pending: boolean;
  /** The last input, kept until the server acknowledges it. */
  draft: I | undefined;
  /** The stored record the server answered with. */
  result: R | undefined;
  /** The last failure; kept while a retry runs, cleared when one lands. */
  error: OpError | undefined;
  /** When the last answer arrived (ms), so a "Saved" word can time itself. */
  at: number | undefined;
  /** Still running after OP_DEFAULTS.slowMs: the status says "Still saving…". */
  slow: boolean;
  /** Retry is offered: failed with a retryable error. */
  canRetry: boolean;
  run: (input: I) => Promise<OpOutcome<R>>;
  retry: () => Promise<OpOutcome<R>> | undefined;
  /** Back to idle: drops the draft and the error, stops a run in flight (its answer lands nowhere). */
  reset: () => void;
  /** The validation line for one field, when the server put it there. */
  fieldError: (field: string) => string | undefined;
};

/* ---------- the shared store: one slot per key ---------- */

type Snap = { slow?: boolean | undefined; state: OpState; draft?: unknown; result?: unknown; error?: OpError | undefined; at?: number | undefined };
type Entry = { seq: number; status: "pending" | "done" | "failed"; rollback?: (() => void) | undefined };
type Handlers = { onDone?: ((r: unknown, i: unknown) => void) | undefined; onError?: ((e: OpError, i: unknown) => void) | undefined };
type Slot = { snap: Snap; listeners: Set<() => void>; seq: number; entries: Entry[]; ctrls: Set<AbortController>; handlers: React.RefObject<Handlers> | null; mounts: number; local: boolean };

const IDLE: Snap = { state: "idle" };
const slots = new Map<string, Slot>();

function slotOf(key: string, local: boolean): Slot {
  let s = slots.get(key);
  if (!s) slots.set(key, (s = { snap: IDLE, listeners: new Set(), seq: 0, entries: [], ctrls: new Set(), handlers: null, mounts: 0, local }));
  return s;
}
function put(s: Slot, snap: Snap) {
  s.snap = snap;
  for (const l of s.listeners) l();
}
/* a keyed slot nobody shows and nothing runs in is forgotten, unless it failed: reopening shows the failure and its draft */
function sweep(key: string, s: Slot) {
  if (s.mounts === 0 && s.listeners.size === 0 && s.ctrls.size === 0 && (s.local || s.snap.state !== "failed")) slots.delete(key);
}
/* the newest state not refused: undo refused runs from the newest down, stopping at one still pending or done */
function settle(s: Slot) {
  while (s.entries.length && s.entries.at(-1)!.status === "failed") s.entries.pop()!.rollback?.();
  if (!s.entries.some((e) => e.status === "pending")) s.entries = [];
}

/** Forgets every operation (tests, sign-out): nothing in flight lands afterwards. */
export function resetOperations() {
  for (const s of slots.values()) {
    s.seq++;
    for (const c of s.ctrls) c.abort();
  }
  slots.clear();
}

/* ---------- the one polite live region ---------- */

let live: HTMLElement | null = null;
/** Says words once, politely, from the shared live region (created on first use). */
export function announce(text: string) {
  if (typeof document === "undefined" || !text) return;
  if (!live || !live.isConnected) {
    live = document.createElement("div");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    live.setAttribute("data-slot", "op-announcer");
    Object.assign(live.style, { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" });
    document.body.appendChild(live);
  }
  /* the same words twice still read twice */
  live.textContent = live.textContent === text ? `${text} ` : text;
}

const say = <A extends unknown[]>(w: string | ((...a: A) => string) | undefined, fallback: string, ...a: A) => (w === undefined ? fallback : typeof w === "function" ? w(...a) : w);

/* ---------- the hook ---------- */

// useLayoutEffect warns during server render; fall back to useEffect there.
const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

function useOperation<I, R>(fn: (input: I, signal: AbortSignal) => Promise<R>, opts: OperationOptions<I, R> = {}): Operation<I, R> {
  const id = React.useId();
  const key = opts.key ?? `local:${id}`;
  const local = opts.key === undefined;
  const latest = React.useRef({ fn, opts });
  const handlers = React.useRef<Handlers>({});
  useIsoLayoutEffect(() => {
    latest.current = { fn, opts };
    handlers.current = { onDone: opts.onDone as Handlers["onDone"], onError: opts.onError as Handlers["onError"] };
  });
  React.useEffect(() => {
    const s = slotOf(key, local);
    s.mounts++;
    s.handlers = handlers;
    return () => {
      s.mounts--;
      if (s.handlers === handlers) s.handlers = null;
      sweep(key, s);
    };
  }, [key, local]);
  const snap = React.useSyncExternalStore(
    React.useCallback(
      (l: () => void) => {
        const s = slotOf(key, local);
        s.listeners.add(l);
        return () => {
          s.listeners.delete(l);
          sweep(key, s);
        };
      },
      [key, local],
    ),
    () => slots.get(key)?.snap ?? IDLE,
    () => IDLE,
  );

  const run = React.useCallback(
    async (input: I): Promise<OpOutcome<R>> => {
      const { fn: go, opts: o } = latest.current;
      const s = slotOf(key, local);
      const seq = ++s.seq;
      const entry: Entry = { seq, status: "pending", rollback: o.optimistic?.(input) ?? undefined };
      s.entries.push(entry);
      const words = o.announce === false ? null : (o.announce ?? {});
      /* the last reason stays readable while it runs again (a LoadError keeps its place until a retry lands) */
      put(s, { state: "pending", draft: input, result: s.snap.result, error: s.snap.error, at: s.snap.at });
      if (words) announce(say(words.pending, "Saving…", input));
      const ctrl = new AbortController();
      s.ctrls.add(ctrl);
      const ms = o.timeoutMs ?? OP_DEFAULTS.timeoutMs;
      const slowTimer = OP_DEFAULTS.slowMs > 0 ? setTimeout(() => { if (s.seq === seq && s.snap.state === "pending") put(s, { ...s.snap, slow: true }); }, OP_DEFAULTS.slowMs) : undefined;
      const timer = ms > 0 ? setTimeout(() => ctrl.abort(opError("timeout", `The server didn't answer within ${Math.round(ms / 1000)} seconds. Everything you typed is still here.`)), ms) : undefined;
      const stopped = new Promise<never>((_, reject) => ctrl.signal.addEventListener("abort", () => reject(ctrl.signal.reason), { once: true }));
      let outcome: { ok: true; r: R } | { ok: false; e: OpError };
      try {
        outcome = { ok: true, r: await Promise.race([go(input, ctrl.signal), stopped]) };
      } catch (err) {
        outcome = { ok: false, e: toOpError(err) };
      } finally {
        clearTimeout(timer);
        clearTimeout(slowTimer);
        s.ctrls.delete(ctrl);
      }
      entry.status = outcome.ok ? "done" : "failed";
      settle(s);
      const current = slots.get(key) === s && s.seq === seq;
      if (!current) {
        sweep(key, s);
        return { state: "stale" };
      }
      const h = s.handlers?.current;
      if (outcome.ok) {
        put(s, { state: "done", result: outcome.r, at: Date.now() });
        if (words) announce(say(words.done, "Saved", outcome.r, input));
        if (s.mounts > 0) h?.onDone?.(outcome.r, input);
        sweep(key, s);
        return { state: "done", result: outcome.r };
      }
      const e = outcome.e;
      put(s, { state: "failed", draft: input, result: s.snap.result, error: e, at: Date.now() });
      if (words) announce(say(words.failed, `Not saved: ${e.message}`, e, input));
      if (s.mounts > 0) h?.onError?.(e, input);
      sweep(key, s);
      return { state: "failed", error: e };
    },
    [key, local],
  );

  const reset = React.useCallback(() => {
    const s = slots.get(key);
    if (!s) return;
    s.seq++;
    for (const c of s.ctrls) c.abort(opError("unknown", "Stopped."));
    put(s, IDLE);
  }, [key]);

  const canRetry = snap.state === "failed" && !!snap.error?.retryable;
  const retry = React.useCallback(() => {
    const s = slots.get(key)?.snap;
    if (!s || s.state !== "failed" || !s.error?.retryable) return undefined;
    return run(s.draft as I);
  }, [key, run]);

  const error = snap.error;
  return {
    state: snap.state,
    pending: snap.state === "pending",
    slow: snap.state === "pending" && !!snap.slow,
    draft: snap.draft as I | undefined,
    result: snap.result as R | undefined,
    error,
    at: snap.at,
    canRetry,
    run,
    retry,
    reset,
    fieldError: (field: string) => (error && error.code === "validation" && error.field === field ? error.message : undefined),
  };
}

/* ---------- what an operation looks like ---------- */

type OpLike = Pick<Operation<never, unknown>, "state" | "error" | "canRetry" | "at"> & { slow?: boolean | undefined; retry: () => unknown };

type OpStatusProps = {
  /** The operation it reports (from useOperation). */
  op: OpLike;
  /** While it runs ("Saving…", "Archiving…"). */
  pending?: string | undefined;
  /** Said quietly for OP_DEFAULTS.savedWordMs once it lands ("Saved"). */
  done?: string | undefined;
  /** Leads the reason when it fails ("Not saved", "Couldn't archive"). */
  failed?: string | undefined;
  /** What the value was before, so the person knows what Undo puts back ("Was $148,000."). */
  was?: React.ReactNode;
  /** Puts the old value back (offered beside Retry when it failed). */
  onUndo?: (() => void) | undefined;
  /** How long "Saved" shows; 0 says nothing. Defaults to OP_DEFAULTS.savedWordMs. */
  savedMs?: number | undefined;
  className?: string | undefined;
};

/**
 * The status an inline change carries beside its value: "Saving…" with the notch, a quiet "Saved" that leaves on
 * its own, or the reason it failed on its own line with Retry and Undo. Nothing when idle. Words only: the value
 * itself is the proof, so success never turns green. Not a live region; the operation announces.
 */
function OpStatus({ op, pending = "Saving…", done = "Saved", failed = "Not saved", was, onUndo, savedMs = OP_DEFAULTS.savedWordMs, className }: OpStatusProps) {
  /* the answer whose "Saved" has had its moment */
  const [quiet, setQuiet] = React.useState<number | undefined>(undefined);
  const fresh = op.state === "done" && savedMs > 0 && quiet !== op.at;
  React.useEffect(() => {
    if (!fresh) return;
    const t = setTimeout(() => setQuiet(op.at), savedMs);
    return () => clearTimeout(t);
  }, [fresh, op.at, savedMs]);
  if (op.state === "pending")
    return (
      <span data-slot="operation" data-state="pending" className={cn("inline-flex items-center gap-1.5 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]", className)}>
        <Spinner size={12} />
        {op.slow ? stillWord(pending) : pending}
      </span>
    );
  if (op.state === "done" && fresh)
    return (
      <span data-slot="operation" data-state="done" className={cn("text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] [animation:ns-fade_var(--ns-time-color)_var(--ns-ease)]", className)}>
        {done}
      </span>
    );
  if (op.state === "failed" && op.error)
    return (
      <div data-slot="operation" data-state="failed" className={cn("flex basis-full flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-[length:var(--ns-text-meta)] text-[var(--ns-bad-ink)]", className)}>
        <span className="min-w-0">
          {failed}: {lower(op.error.message)}
          {was ? <> {was}</> : null}
        </span>
        {(op.canRetry || onUndo) && (
          <span className="flex gap-1">
            {op.canRetry && (
              <Button size="sm" variant="ghost" className="text-[var(--ns-ink)]" onClick={() => void op.retry()}>
                Retry
              </Button>
            )}
            {onUndo && (
              <Button size="sm" variant="ghost" onClick={onUndo}>
                Undo
              </Button>
            )}
          </span>
        )}
      </div>
    );
  /* at rest it says nothing, and takes no room */
  return <span data-slot="operation" data-state={op.state} hidden className={className} />;
}

/* "Saving…" reads on as "Still saving…" */
const stillWord = (w: string) => `Still ${w[0]!.toLowerCase()}${w.slice(1)}`;

/* "The connection dropped." reads on from "Not saved: the connection dropped." */
const lower = (m: string) => (/^[A-Z][a-z]/.test(m) && !/^(I|I'm|You're)\b/.test(m) ? m[0]!.toLowerCase() + m.slice(1) : m);

type OpBannerProps = {
  op: OpLike;
  /** The fact first: "Couldn't create the deal". */
  title: React.ReactNode;
  /** Back to the form: focuses the field to change. */
  onEdit?: (() => void) | undefined;
  className?: string | undefined;
};

/**
 * The form-level failure at the top of a dialog or sheet: the fact, the reason, then Retry (when it can help and
 * the footer verb was kept, OP_DEFAULTS.failedVerb) and Edit. A validation error that names a field says its line
 * on that field instead, so this stays away.
 */
function OpBanner({ op, title, onEdit, className }: OpBannerProps) {
  if (op.state !== "failed" || !op.error || (op.error.code === "validation" && op.error.field)) return null;
  const retry = op.canRetry && OP_DEFAULTS.failedVerb === "keep";
  return (
    <Banner
      tone="bad"
      title={title}
      className={className}
      actions={
        retry || onEdit ? (
          <>
            {retry && (
              <Button size="sm" onClick={() => void op.retry()}>
                <RotateCcw />
                Retry
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="ghost" onClick={onEdit}>
                Edit
              </Button>
            )}
          </>
        ) : undefined
      }
    >
      {op.error.message}
    </Banner>
  );
}

/**
 * A form's one verb, wired to its operation for Dialog's `verb`: busy while pending (fields lock, nothing clears),
 * and, when OP_DEFAULTS.failedVerb is "retry", "Try again" after a retryable failure.
 */
function opVerb(op: OpLike, label: string, busyLabel: string, onClick: () => void) {
  const again = OP_DEFAULTS.failedVerb === "retry" && op.canRetry;
  return { label: again ? "Try again" : label, busyLabel, busy: op.state === "pending", onClick: again ? () => void op.retry() : onClick };
}

/** Marks a row that just arrived (the signal mark) or came back refused (one bad pulse); the mark clears itself. */
function markRow(el: Element | null | undefined, how: "landed" | "refused") {
  if (!el) return;
  const attr = how === "landed" ? "data-ns-landed" : "data-ns-refused";
  el.setAttribute(attr, "");
  el.addEventListener("animationend", () => el.removeAttribute(attr), { once: true });
}

/** A new record landed: its toast offers Open (unless OP_DEFAULTS.createdToast is off). */
function notifyCreated({ title, detail, onOpen }: { title: string; detail?: string | undefined; onOpen?: (() => void) | undefined }) {
  if (!OP_DEFAULTS.createdToast) return;
  notify({ title, detail, action: onOpen ? { label: "Open", onClick: onOpen } : undefined });
}

export { markRow, notifyCreated, OpBanner, opVerb, OpStatus, useOperation, type OpBannerProps, type OpStatusProps };
export { opError, OpFailure, opErrorLine, toOpError, type OpError, type OpErrorCode } from "@/lib/notchset/op-error";
