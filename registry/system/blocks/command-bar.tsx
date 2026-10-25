// Notchset command-bar 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Check, CornerDownLeft, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Command bar: say what you want in plain words and see what it will do before it does it. The host registers
 * verbs, each with a parser and a preview; typing "move stripe to procurement" turns into chips (Move · Stripe ·
 * → Procurement) and one line of consequence ("Weighted $193k → $214k"). Enter runs it, Tab completes the word
 * the verb suggests, Esc clears. It's pattern matching the host writes, not a guess: a sentence that doesn't
 * match says so and shows what does.
 *
 *   const move: CommandVerb<{ deal: Deal; stage: Stage }> = {
 *     id: "move", example: "move stripe to procurement",
 *     parse: (q) => ..., preview: (v) => `Weighted ${a} → ${b}`, run: (v) => setStage(v.deal.id, v.stage) };
 *   <CommandBar label="Do something" verbs={[move]} />
 */
type CommandPart = { text: string; kind?: "verb" | "object" | "target" | "value" | undefined };
type CommandMatch<T> = { parts: CommandPart[]; value: T };
type CommandVerb<T = unknown> = {
  id: string;
  /** a sentence that works, shown when nothing matches */
  example: string;
  /** the words, or null when this verb doesn't read them */
  parse: (query: string) => CommandMatch<T> | null;
  /** one line saying what will happen */
  preview?(value: T): React.ReactNode;
  /** the rest of the sentence Tab fills in, from what's typed so far (or null) */
  complete?: ((query: string) => string | null) | undefined;
  /** runs it; false means it was refused and the words stay */
  run(value: T): void | boolean;
};
type CommandBarProps = {
  label: string;
  /** each verb carries its own value type (preview and run are methods, so a CommandVerb<X> is a CommandVerb) */
  verbs: CommandVerb[];
  placeholder?: string | undefined;
  className?: string | undefined;
};

const CHIP: Record<NonNullable<CommandPart["kind"]>, string> = {
  verb: "bg-[var(--ns-ink)] text-[var(--ns-canvas)]",
  object: "bg-[var(--ns-raised)] text-[var(--ns-ink)] shadow-[inset_0_0_0_1px_var(--ns-line)]",
  target: "bg-[var(--ns-raised)] text-[var(--ns-ink)] shadow-[inset_0_0_0_1px_var(--ns-line)]",
  value: "bg-[var(--ns-raised)] text-[var(--ns-ink)] shadow-[inset_0_0_0_1px_var(--ns-line)] tabular-nums",
};

function CommandBar({ label, verbs, placeholder = "Type what you want to do…", className }: CommandBarProps) {
  const [q, setQ] = React.useState("");
  const [done, setDone] = React.useState<string | null>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const hintId = React.useId();
  const query = q.trim();
  /* the first verb that reads the words wins; the host orders them */
  let found: { verb: CommandVerb<unknown>; match: CommandMatch<unknown> } | null = null;
  for (const verb of verbs) {
    const match = query ? verb.parse(query) : null;
    if (match) {
      found = { verb, match };
      break;
    }
  }
  const completion = query && !found ? verbs.map((v) => v.complete?.(q) ?? null).find((x): x is string => !!x && x.toLowerCase() !== q.toLowerCase()) : null;
  const run = () => {
    if (!found) return;
    const ok = found.verb.run(found.match.value);
    if (ok === false) return;
    setDone(found.match.parts.map((p) => p.text).join(" "));
    setQ("");
  };
  return (
    <div data-slot="command-bar" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label className="flex h-11 items-center gap-2.5 rounded-[var(--ns-radius-lg)] bg-[var(--ns-raised)] px-3.5 shadow-[inset_0_0_0_1px_var(--ns-line),var(--ns-lift)] [transition:box-shadow_var(--ns-time-color)] focus-within:shadow-[inset_0_0_0_1.5px_var(--ns-signal),var(--ns-lift)]">
        <Sparkle aria-hidden className="size-3.5 shrink-0 text-[var(--ns-ink-3)]" />
        <span className="sr-only">{label}</span>
        <span className="relative min-w-0 flex-1">
          {/* the rest of the sentence Tab would fill in, ghosted behind the words */}
          {completion && completion.toLowerCase().startsWith(q.toLowerCase()) && (
            <span aria-hidden className="pointer-events-none absolute inset-0 truncate whitespace-pre text-[length:var(--ns-text-body)] text-[var(--ns-ink-3)] opacity-60">
              <span className="invisible">{q}</span>
              {completion.slice(q.length)}
            </span>
          )}
          <input
            ref={input}
            value={q}
            placeholder={placeholder}
            aria-describedby={hintId}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setQ(e.target.value);
              setDone(null);
            }}
            onKeyDown={(e) => {
              /* while an input method is composing, Enter and Escape confirm or cancel its candidate: never a run or a clear */
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              if (e.key === "Enter") {
                e.preventDefault();
                run();
              } else if (e.key === "Escape") {
                if (q) e.preventDefault();
                setQ("");
                setDone(null);
              } else if (e.key === "Tab" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && completion) {
                /* only a plain Tab completes; Shift+Tab is the way back to the previous control */
                e.preventDefault();
                setQ(completion);
              }
            }}
            className="relative w-full bg-transparent text-[length:var(--ns-text-body)] text-[var(--ns-ink)] outline-hidden placeholder:text-[var(--ns-ink-3)] pointer-coarse:text-[16px]"
          />
        </span>
        <kbd aria-hidden className={cn("inline-flex h-6 items-center gap-1 rounded-[6px] px-1.5 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] shadow-[inset_0_0_0_1px_var(--ns-line)] [transition:opacity_var(--ns-time-color)] pointer-coarse:hidden", !found && "opacity-0")}>
          <CornerDownLeft className="size-3" />
          Run
        </kbd>
      </label>
      {/* what the words mean and what they'll do, or what does work */}
      <div id={hintId} aria-live="polite" className="flex min-h-14 flex-col gap-1.5 px-1">
        {found ? (
          <>
            <span className="flex flex-wrap items-center gap-1.5">
              {found.match.parts.map((p, i) => (
                <span
                  key={`${i}-${p.text}`}
                  data-ns-moves=""
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={cn("inline-flex h-6 items-center rounded-[6px] px-2 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] [animation:ns-rise_var(--ns-time-menu)_var(--ns-ease)_both]", CHIP[p.kind ?? "object"])}
                >
                  {p.kind === "target" ? `→ ${p.text}` : p.text}
                </span>
              ))}
            </span>
            {found.verb.preview && <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)] tabular-nums">{found.verb.preview(found.match.value)}</span>}
          </>
        ) : done ? (
          <span data-ns-moves="" className="inline-flex items-center gap-1.5 text-[length:var(--ns-text-small)] text-[var(--ns-ok-ink)] [animation:ns-rise_var(--ns-time-menu)_var(--ns-ease)]">
            <Check aria-hidden className="size-3.5" />
            Done: {done}
          </span>
        ) : query ? (
          <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">
            Nothing reads that yet. Try “{verbs[0]?.example}”{completion ? <>, or press Tab</> : null}.
          </span>
        ) : (
          <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">
            Try {verbs.slice(0, 2).map((v, i) => (
              <React.Fragment key={v.id}>
                {i > 0 && " or "}
                <button type="button" onClick={() => (setQ(v.example), input.current?.focus())} className="cursor-pointer rounded-[4px] text-[var(--ns-ink-2)] underline decoration-[var(--ns-line)] underline-offset-[3px] outline-hidden hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]">
                  “{v.example}”
                </button>
              </React.Fragment>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

export { CommandBar, type CommandBarProps, type CommandMatch, type CommandPart, type CommandVerb };
