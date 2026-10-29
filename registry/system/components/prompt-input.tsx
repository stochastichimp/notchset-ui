// Notchset prompt-input 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { ArrowUp, Mic, MicOff, Paperclip, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/notchset/button";
import { IconButton } from "@/components/ui/notchset/icon-button";

/*
 * Prompt input: where you ask. Enter sends, Shift+Enter starts a new line, and keys an input method is composing with
 * stay its own. It grows with what you write. While a reply runs the send button is Stop; a message sent meanwhile
 * waits above the box ("Sends after this reply") with Send now, never refused. Dictation is its own key: while it
 * listens your words appear live as a caption above the box and land in it as you finish each phrase; nothing is
 * sent until you send. With the microphone refused it says how to allow it and typing carries on. At the plan's
 * limit the button becomes "Send when it resets" and the draft is kept; offline, the draft is kept and says so.
 *
 * Files come by the paperclip, by pasting and by dropping onto the box (it says "Drop to attach" while one is over
 * it); the host checks and uploads them and passes their chips back in `attachments`. A message with files ready can
 * go without words; while one is still reading, Send waits.
 *
 * The host owns the draft, the reply's life, dictation (the template's voice adapter) and the files; this piece
 * draws them. Slots: the model selector, a tools menu and the voice button sit in its toolbar, the files' chips above
 * the words, the usage line under it.
 */
type Dictation = {
  state: "off" | "listening" | "blocked" | "unsupported";
  /** the words heard so far in this phrase, not yet in the box */
  interim?: string | undefined;
  onToggle: () => void;
  /** false: the host draws the one voice control itself (the Assistant's Voice menu, dictation and talk in one); the
      composer still says what it hears and when the microphone is blocked */
  button?: boolean | undefined;
};
type PromptInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  /** send (or, while a reply runs, queue) the text */
  onSubmit: (text: string) => void;
  /** a reply is running: the button is Stop */
  running?: boolean | undefined;
  onStop?: (() => void) | undefined;
  /** a message waiting for the reply to finish */
  queued?: { text: string; onSendNow: () => void; onCancel: () => void } | undefined;
  dictation?: Dictation | undefined;
  /**
   * add files (the paperclip, paste, drop); with `refused` the button stays and says why it can't ("This model can't
   * read files"). `count`: files ready, so Send works without words; `busy`: one is still reading, so Send waits.
   */
  attach?: { onFiles: (files: File[]) => void; refused?: string | undefined; count?: number | undefined; busy?: boolean | undefined; /** the file picker's types ("image/*,application/pdf") */ accept?: string | undefined } | undefined;
  /** the attached files' chips, above the words */
  attachments?: React.ReactNode;
  /** a tools menu, after the paperclip (Search the web, Deep research) */
  tools?: React.ReactNode;
  /** at the plan's limit: what it says and the way on */
  limit?: { line: string; onSendWhenReset: () => void } | undefined;
  /** the connection is gone: the draft stays and says it will wait */
  offline?: boolean | undefined;
  /** ↑ in an empty box edits your last message */
  onEditLast?: (() => void) | undefined;
  /** the model selector */
  model?: React.ReactNode;
  /** the voice button */
  voice?: React.ReactNode;
  /** the usage line, under the box */
  footer?: React.ReactNode;
  placeholder?: string | undefined;
  label?: string | undefined;
  className?: string | undefined;
};

/* a layout effect in the browser, an ordinary one on the server (no SSR warning) */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const PromptInput = React.forwardRef<HTMLTextAreaElement, PromptInputProps>(function PromptInput(
  { value, onValueChange, onSubmit, running = false, onStop, queued, dictation, attach, attachments, tools, limit, offline = false, onEditLast, model, voice, footer, placeholder = "Ask anything", label = "Message", className },
  ref,
) {
  const ta = React.useRef<HTMLTextAreaElement | null>(null);
  const file = React.useRef<HTMLInputElement>(null);
  /* the host's ref reaches the textarea (React 18 and 19 alike) */
  React.useImperativeHandle(ref, () => ta.current as HTMLTextAreaElement, []);
  useIsomorphicLayoutEffect(() => {
    const t = ta.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 240)}px`;
  }, [value]);

  const text = value.trim();
  const withFiles = !!attach?.count;
  const ready = (!!text || withFiles) && !attach?.busy;
  const send = () => {
    if (!ready || offline) return;
    if (limit) return limit.onSendWhenReset();
    onSubmit(text);
  };
  const [over, setOver] = React.useState(false);
  const canTake = !!attach && !attach.refused;
  const take = (list: FileList | null | undefined) => {
    const files = [...(list ?? [])];
    if (files.length && attach && !attach.refused) attach.onFiles(files);
    return files.length > 0;
  };
  const listening = dictation?.state === "listening";

  return (
    <div data-slot="prompt-input" className={cn("flex flex-col gap-2", className)}>
      {queued && (
        <div className="flex min-w-0 items-center gap-2 self-start rounded-[var(--ns-radius)] bg-[var(--ns-raised)] py-1 pr-1 pl-3 text-[length:var(--ns-text-small)] shadow-[var(--ns-bezel)] max-w-full">
          <span className="shrink-0 text-[var(--ns-ink-3)]">Sends after this reply</span>
          <span className="min-w-0 truncate text-[var(--ns-ink)]">{queued.text}</span>
          <Button size="sm" variant="ghost" onClick={queued.onSendNow}>
            Send now
          </Button>
          <IconButton size="sm" variant="ghost" label="Don't send" onClick={queued.onCancel}>
            <X aria-hidden />
          </IconButton>
        </div>
      )}
      <div
        data-drop={over || undefined}
        onDragOver={canTake ? (e) => (e.preventDefault(), setOver(true)) : undefined}
        onDragLeave={canTake ? (e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setOver(false) : undefined}
        onDrop={canTake ? (e) => (e.preventDefault(), setOver(false), take(e.dataTransfer?.files)) : undefined}
        className={cn(
          "relative flex flex-col gap-1 rounded-[var(--ns-radius-xl)] bg-[var(--ns-raised)] p-2 shadow-[var(--ns-bezel)] [transition:box-shadow_var(--ns-time-color)] has-[textarea:focus-visible]:shadow-[0_0_0_1px_var(--ns-ink-3),var(--ns-bezel)]",
          over && "shadow-[0_0_0_1.5px_var(--ns-signal),var(--ns-bezel)]",
        )}
      >
        {over && (
          <span aria-hidden className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[inherit] bg-[color-mix(in_oklab,var(--ns-raised)_88%,transparent)] text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">
            Drop to attach
          </span>
        )}
        {attachments}
        {listening && (
          <p data-slot="prompt-caption" aria-live="polite" className="m-0 px-2 pt-1 text-[length:var(--ns-text-body)] text-[var(--ns-ink-3)] [overflow-wrap:anywhere]">
            {dictation.interim ? dictation.interim : "Listening. Speak, then press the microphone again."}
          </p>
        )}
        <textarea
          ref={ta}
          rows={1}
          value={value}
          aria-label={label}
          placeholder={placeholder}
          onChange={(e) => onValueChange(e.target.value)}
          onPaste={canTake ? (e) => take(e.clipboardData?.files) && e.preventDefault() : undefined}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            } else if (e.key === "ArrowUp" && !value && onEditLast) {
              e.preventDefault();
              onEditLast();
            }
          }}
          className="block max-h-[240px] min-h-[44px] w-full resize-none bg-transparent px-2 py-2 font-[family-name:var(--ns-font-body)] text-[length:var(--ns-text-control)] leading-[1.5] text-[var(--ns-ink)] outline-hidden placeholder:text-[var(--ns-ink-3)] pointer-coarse:text-[16px]"
        />
        <div className="flex items-center gap-1">
          {attach && (
            <>
              <IconButton size="sm" variant="ghost" label={attach.refused ?? "Add files and images"} aria-disabled={attach.refused ? true : undefined} onClick={() => !attach.refused && file.current?.click()}>
                <Paperclip aria-hidden />
              </IconButton>
              <input
                ref={file}
                type="file"
                multiple
                hidden
                accept={attach.accept}
                onChange={(e) => {
                  attach.onFiles([...(e.target.files ?? [])]);
                  e.target.value = "";
                }}
              />
            </>
          )}
          {tools}
          {dictation && dictation.state !== "unsupported" && dictation.button !== false && (
            <IconButton size="sm" variant="ghost" label={listening ? "Stop dictating" : "Dictate"} aria-pressed={listening} onClick={dictation.onToggle} className={cn(listening && "bg-[var(--ns-selected)] text-[var(--ns-ink)]")}>
              {dictation.state === "blocked" ? <MicOff aria-hidden /> : <Mic aria-hidden />}
            </IconButton>
          )}
          {model}
          <span className="ml-auto" />
          {voice}
          {running && !text && !withFiles ? (
            <IconButton size="sm" label="Stop" onClick={onStop} aria-keyshortcuts="Escape">
              <Square aria-hidden className="size-3 fill-current" />
            </IconButton>
          ) : limit ? (
            <Button size="sm" variant="primary" disabled={!ready} onClick={send}>
              Send when it resets
            </Button>
          ) : (
            <IconButton size="sm" variant="primary" label={attach?.busy ? "Waiting for files to finish reading" : running ? "Send after this reply" : "Send"} disabled={!ready || offline} onClick={send}>
              <ArrowUp aria-hidden />
            </IconButton>
          )}
        </div>
      </div>
      {(dictation?.state === "blocked" || offline || limit) && (
        <p role="status" className="m-0 px-2 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-2)]">
          {offline
            ? "You're offline. What you wrote stays here; send it when you're back."
            : limit
              ? `${limit.line}. Your message is kept and sends then.`
              : "Microphone blocked: allow it in your browser's site settings, or keep typing."}
        </p>
      )}
      {footer && <div className="px-2">{footer}</div>}
    </div>
  );
});

export { PromptInput, type Dictation, type PromptInputProps };
