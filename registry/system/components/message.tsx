// Notchset message 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Pencil, RotateCcw, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/notchset/button";
import { IconButton } from "@/components/ui/notchset/icon-button";
import { Menu, MenuGroup, MenuItem } from "@/components/ui/notchset/menu";
import { Spinner } from "@/components/ui/notchset/spinner";
import { modelLineWords, seconds, textOf, type ModelLine, type ReasoningPart, type UIMessage } from "@/lib/notchset/ui-message";

/*
 * Message: one turn of a conversation, yours or the assistant's, with its whole life designed.
 *
 * Before the first word the reply holds a calm placeholder (the composer's orb says Thinking; nothing else moves).
 * Words arrive as they stream; Stop works from the first word to the last, and a stopped reply keeps what it had
 * and says so ("Stopped after 14 s") with Continue and Try again. After 8 s it says it is still working. Every reply
 * names what answered under it ("Balanced · thought for 9 s"), including a fallback. An edit or a retry never deletes:
 * versions sit in place ("2 of 3") with All versions beside them. When it finishes, focus moves to the answer if it
 * was on Stop. Screen readers hear it start, still working, done, stopped and failed, once each.
 *
 * Messages are AI SDK UIMessage-shaped (components/ui-message.ts). The host owns the conversation, the timer that
 * streams and the keys (Esc to stop is the page's); tool steps, approvals and sources go in as children.
 */
type ReplyStatus = "submitted" | "streaming" | "done" | "stopped" | "error";
type Version = { id: string; label: string; time: string };
type MessageProps = {
  message: UIMessage;
  /** an assistant reply's life; a message of yours is always done */
  status?: ReplyStatus | undefined;
  /** what answered: every assistant reply has one */
  model?: ModelLine | undefined;
  /** when the reply began (ms), for "Still working" and "Stopped after" */
  startedAt?: number | undefined;
  /** how long it ran before it was stopped */
  stoppedAfterMs?: number | undefined;
  /** why it failed, in words; what you asked is kept */
  error?: string | undefined;
  versions?: { index: number; count: number; list?: Version[] | undefined; onPick: (index: number) => void } | undefined;
  /** "Used 2 things it remembers", opening them */
  memory?: { count: number; onOpen?: (() => void) | undefined } | undefined;
  /** a receipt (blocks/receipt) in place of the model line and memory words: what stands behind the answer */
  receipt?: React.ReactNode;
  onStop?: (() => void) | undefined;
  onContinue?: (() => void) | undefined;
  onRetry?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  /** called after the text was copied (the piece copies it) */
  onCopied?: (() => void) | undefined;
  /** draws a citation marker "[n]" in the text (Sources' Citation); without it markers are left as written */
  cite?: ((n: number) => React.ReactNode) | undefined;
  /** the assistant's name, read by screen readers ("Assistant") */
  name?: string | undefined;
  children?: React.ReactNode;
  className?: string | undefined;
};

/* ---------- the reply's text: paragraphs, headings, lists, bold, code and code blocks ---------- */

function inline(text: string, cite: MessageProps["cite"], key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={`${key}b${i++}`} className="font-[number:var(--ns-weight-strong)]">{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={`${key}c${i++}`} className="rounded-[4px] bg-[var(--ns-well)] px-1 py-px font-[family-name:var(--ns-font-mono)] text-[0.92em]">{t.slice(1, -1)}</code>);
    else out.push(cite ? <React.Fragment key={`${key}n${i++}`}>{cite(Number(t.slice(1, -1)))}</React.Fragment> : t);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div data-slot="message-code" className="relative min-w-0 overflow-hidden rounded-[var(--ns-radius-lg)] bg-[var(--ns-well)] shadow-[inset_0_0_0_1px_var(--ns-line-soft)]">
      <div className="flex h-8 items-center justify-between pr-1 pl-3 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        <span className="font-[family-name:var(--ns-font-mono)]">{lang || "code"}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }, () => setCopied(false));
          }}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      {/* a long line scrolls inside the block, and the keyboard can scroll it too */}
      <pre tabIndex={0} aria-label={`${lang || "Code"} block`} className="m-0 overflow-x-auto px-3 pb-3 outline-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ns-signal)] font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-small)] leading-[1.6]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Response({ text, cite }: { text: string; cite: MessageProps["cite"] }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0, k = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) body.push(lines[i++]!);
      i++;
      blocks.push(<CodeBlock key={k++} lang={lang} code={body.join("\n")} />);
    } else if (/^#{1,3} /.test(line)) {
      blocks.push(<h3 key={k++} className="m-0 mt-1 font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-strong)] font-[number:var(--ns-weight-strong)]">{inline(line.replace(/^#+ /, ""), cite, `h${k}`)}</h3>);
      i++;
    } else if (/^(- |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items: string[] = [];
      while (i < lines.length && /^(- |\d+\. )/.test(lines[i]!)) items.push(lines[i++]!.replace(/^(- |\d+\. )/, ""));
      const L = ordered ? "ol" : "ul";
      blocks.push(<L key={k++} className={cn("m-0 flex flex-col gap-1 pl-5", ordered ? "list-decimal" : "list-disc")}>{items.map((t, j) => <li key={j}>{inline(t, cite, `l${k}-${j}`)}</li>)}</L>);
    } else if (line.trim() === "") i++;
    else {
      const para: string[] = [];
      while (i < lines.length && lines[i]!.trim() !== "" && !/^(```|#{1,3} |- |\d+\. )/.test(lines[i]!)) para.push(lines[i++]!);
      blocks.push(<p key={k++} className="m-0">{inline(para.join(" "), cite, `p${k}`)}</p>);
    }
  }
  return <div data-slot="message-response" className="flex min-w-0 flex-col gap-3 [overflow-wrap:anywhere]">{blocks}</div>;
}

function Reasoning({ part }: { part: ReasoningPart }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  const thinking = part.state === "streaming";
  return (
    <div data-slot="message-reasoning" className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--ns-radius-sm)] px-1 py-0.5 -ml-1 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)] outline-hidden hover:text-[var(--ns-ink-2)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]"
      >
        {thinking && <Spinner size={12} />}
        {thinking ? "Thinking…" : part.durationMs ? `Thought for ${seconds(part.durationMs)}` : "Thought it through"}
        <ChevronDown aria-hidden className={cn("size-3.5 [transition:rotate_var(--ns-time-color)]", open && "rotate-180")} />
      </button>
      {open && (
        <p id={id} className="m-0 border-l-2 border-[var(--ns-line)] pl-3 text-[length:var(--ns-text-small)] leading-[1.6] whitespace-pre-wrap text-[var(--ns-ink-2)]">
          {part.text}
        </p>
      )}
    </div>
  );
}

/** What a screen reader hears for each step of a reply's life, said once each. */
function announcement(status: ReplyStatus, slow: boolean, stoppedAfterMs: number | undefined, error: string | undefined, name: string) {
  if (status === "submitted") return `${name} is answering`;
  if (status === "streaming") return slow ? `${name} is still working` : `${name} is answering`;
  if (status === "done") return `${name} finished answering`;
  if (status === "stopped") return `Stopped${stoppedAfterMs ? ` after ${seconds(stoppedAfterMs)}` : ""}`;
  return `${name} couldn't finish${error ? `: ${error}` : ""}`;
}

function Message({
  message,
  status = "done",
  model,
  startedAt,
  stoppedAfterMs,
  error,
  versions,
  memory,
  receipt,
  onStop,
  onContinue,
  onRetry,
  onEdit,
  onCopied,
  cite,
  name = "Assistant",
  children,
  className,
}: MessageProps) {
  const mine = message.role === "user";
  const text = textOf(message);
  const reasoning = message.parts.find((p): p is ReasoningPart => p.type === "reasoning");
  const running = !mine && (status === "submitted" || status === "streaming");
  const root = React.useRef<HTMLElement>(null);
  const [copied, setCopied] = React.useState(false);

  /* "Still working" after 8 s: a timer for this reply only, gone when it ends */
  const [slowFor, setSlowFor] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!running || startedAt === undefined) return;
    const t = setTimeout(() => setSlowFor(startedAt), Math.max(0, startedAt + 8000 - Date.now()));
    return () => clearTimeout(t);
  }, [running, startedAt]);
  const slow = running && startedAt !== undefined && slowFor === startedAt;

  /* the hand-off: when it finishes, focus that was on Stop moves to the answer; focus you moved elsewhere stays */
  const was = React.useRef(status);
  React.useEffect(() => {
    const prev = was.current;
    was.current = status;
    /* only when the reply ends: done, stopped or failed */
    if (mine || prev === status || (prev !== "streaming" && prev !== "submitted") || status === "streaming" || status === "submitted") return;
    const a = document.activeElement;
    if (root.current && (a === document.body || a === null || (a instanceof Node && root.current.contains(a) && !root.current.isSameNode(a)))) root.current.focus({ preventScroll: true });
  }, [status, mine]);

  /* a reply that arrived finished (from history) says nothing; one that lives here says each step once */
  const [first] = React.useState(status);
  const settled = first === status && status !== "submitted" && status !== "streaming";
  const said = mine || settled ? "" : announcement(status, slow, stoppedAfterMs, error, name);

  const copy = () =>
    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        onCopied?.();
        setTimeout(() => setCopied(false), 1600);
      },
      () => setCopied(false),
    );

  const versionNav = versions && versions.count > 1 && (
    <span data-slot="message-versions" className="inline-flex items-center gap-0.5 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">
      <IconButton size="sm" variant="ghost" label="Previous version" disabled={versions.index <= 0} onClick={() => versions.onPick(versions.index - 1)}>
        <ChevronLeft aria-hidden />
      </IconButton>
      <span aria-live="polite">
        {versions.index + 1} of {versions.count}
      </span>
      <IconButton size="sm" variant="ghost" label="Next version" disabled={versions.index >= versions.count - 1} onClick={() => versions.onPick(versions.index + 1)}>
        <ChevronRight aria-hidden />
      </IconButton>
      {versions.list && (
        <Menu
          align="end"
          trigger={
            <Button size="sm" variant="ghost">
              All versions
            </Button>
          }
        >
          <MenuGroup label={`${versions.count} versions, none deleted`}>
            {versions.list.map((v, i) => (
              <MenuItem key={v.id} onClick={() => versions.onPick(i)} icon={i === versions.index ? <Check aria-hidden /> : <span className="size-3.5" />}>
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate">{v.label}</span>
                  <span className="shrink-0 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{v.time}</span>
                </span>
              </MenuItem>
            ))}
          </MenuGroup>
        </Menu>
      )}
    </span>
  );

  if (mine)
    return (
      <article ref={root} tabIndex={-1} data-slot="message" data-role="user" aria-label="You" className={cn("group/msg flex flex-col items-end gap-1 outline-hidden", className)}>
        <div className="max-w-[min(85%,560px)] rounded-[var(--ns-radius-lg)] bg-[var(--ns-selected)] px-3.5 py-2.5 text-[length:var(--ns-text-body)] leading-[1.6] whitespace-pre-wrap text-[var(--ns-ink)] [overflow-wrap:anywhere]">
          {text}
          {children}
        </div>
        <div className="flex min-h-[var(--ns-control-sm)] items-center gap-0.5 opacity-0 [transition:opacity_var(--ns-time-color)] group-hover/msg:opacity-100 group-focus-within/msg:opacity-100 pointer-coarse:opacity-100 has-[[data-slot=message-versions]]:opacity-100">
          {versionNav}
          {onEdit && (
            <IconButton size="sm" variant="ghost" label="Edit" onClick={onEdit}>
              <Pencil aria-hidden />
            </IconButton>
          )}
          <IconButton size="sm" variant="ghost" label={copied ? "Copied" : "Copy"} onClick={copy}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          </IconButton>
        </div>
      </article>
    );

  return (
    <article
      ref={root}
      tabIndex={-1}
      data-slot="message"
      data-role="assistant"
      data-status={status}
      aria-label={`${name}'s answer`}
      aria-busy={running || undefined}
      className={cn("group/msg flex min-w-0 flex-col gap-3 text-[length:var(--ns-text-body)] leading-[1.65] text-[var(--ns-ink)] outline-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ns-signal)] rounded-[var(--ns-radius-sm)]", className)}
    >
      <span role="status" className="sr-only">
        {said}
      </span>
      {reasoning && <Reasoning part={reasoning} />}
      {status === "submitted" && !text ? (
        <div data-slot="message-placeholder" aria-hidden className="flex flex-col gap-2 py-1">
          <span className="block h-2.5 w-[72%] rounded-full bg-[var(--ns-well)]" />
          <span className="block h-2.5 w-[48%] rounded-full bg-[var(--ns-well)]" />
        </div>
      ) : (
        text && <Response text={text} cite={cite} />
      )}
      {children}
      {status === "stopped" && (
        <div data-slot="message-stopped" className="flex flex-wrap items-center gap-2">
          <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">
            Stopped{stoppedAfterMs ? ` after ${seconds(stoppedAfterMs)}` : ""}
            {text ? ". What it wrote is kept." : "."}
          </span>
          {onContinue && text && (
            <Button size="sm" onClick={onContinue}>
              Continue
            </Button>
          )}
          {onRetry && (
            <Button size="sm" variant="ghost" onClick={onRetry}>
              <RotateCcw aria-hidden />
              Try again
            </Button>
          )}
        </div>
      )}
      {status === "error" && (
        <div data-slot="message-error" className="flex flex-wrap items-center gap-2">
          <span className="text-[length:var(--ns-text-small)] text-[var(--ns-bad-ink)]">Couldn&apos;t finish{error ? `: ${error}` : ""}. Your question is kept.</span>
          {onRetry && (
            <Button size="sm" onClick={onRetry}>
              <RotateCcw aria-hidden />
              Try again
            </Button>
          )}
        </div>
      )}
      {(running || model || text || (versions && versions.count > 1)) && <footer className="flex min-h-[var(--ns-control-sm)] flex-wrap items-center gap-x-1 gap-y-1 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        {running ? (
          <>
            <Button size="sm" onClick={onStop} aria-keyshortcuts="Escape">
              <Square aria-hidden className="size-3 fill-current" />
              Stop
            </Button>
            {slow && <span className="pl-1.5">Still working</span>}
          </>
        ) : (
          <>
            {versionNav}
            {status !== "error" && text && (
              <IconButton size="sm" variant="ghost" label={copied ? "Copied" : "Copy"} onClick={copy}>
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              </IconButton>
            )}
            {onRetry && status === "done" && (
              <IconButton size="sm" variant="ghost" label="Try again" onClick={onRetry}>
                <RotateCcw aria-hidden />
              </IconButton>
            )}
            {receipt ? (
              <span className="pl-1.5">{receipt}</span>
            ) : (
              <>
            {model && (
              <span data-slot="message-model" className="pl-1.5">
                {modelLineWords(model)}
                <span className="max-[600px]:hidden"> · {model.name}</span>
              </span>
            )}
            {memory && memory.count > 0 && (
              <>
                <span aria-hidden className="px-0.5">
                  ·
                </span>
                {memory.onOpen ? (
                  <button type="button" onClick={memory.onOpen} className="inline-flex min-h-6 cursor-pointer items-center rounded-[4px] text-[var(--ns-ink-3)] underline decoration-[var(--ns-line)] underline-offset-2 outline-hidden hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]">
                    Used {memory.count === 1 ? "1 thing" : `${memory.count} things`} it remembers
                  </button>
                ) : (
                  <span>Used {memory.count === 1 ? "1 thing" : `${memory.count} things`} it remembers</span>
                )}
              </>
            )}
              </>
            )}
          </>
        )}
      </footer>}
    </article>
  );
}

export { Message, type MessageProps, type ReplyStatus };
