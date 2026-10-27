// Notchset message 2.0.0 · https://notchset.dev/changelog
/*
 * The assistant's shared words and shapes (installs to lib/notchset/ui-message.ts with any piece that reads it).
 *
 * Messages are shaped like the AI SDK's UIMessage (an id, a role and parts: text, reasoning, tool-*, source-url,
 * file, data-*), defined here so a piece needs no runtime dependency: a buyer on the AI SDK passes its messages
 * straight in. The figures every piece shows (what answered, how much of a window is used, when it resets) are
 * worked out here, once, so the usage meter, the composer's line and the plan card can never read two ways
 * (docs/design/LANGUAGE.md, "One name, one calculation").
 */

/* ---------- messages ---------- */

export type TextPart = { type: "text"; text: string; state?: "streaming" | "done" | undefined };
export type ReasoningPart = { type: "reasoning"; text: string; state?: "streaming" | "done" | undefined; durationMs?: number | undefined };
/** A tool call, as the AI SDK names its states, approvals included. */
export type ToolState = "input-streaming" | "input-available" | "approval-requested" | "approval-responded" | "output-available" | "output-error" | "output-denied";
export type ToolPart = {
  type: `tool-${string}`;
  toolCallId: string;
  state: ToolState;
  input?: unknown;
  output?: unknown;
  errorText?: string | undefined;
  approval?: { id: string; approved?: boolean | undefined; reason?: string | undefined } | undefined;
};
export type SourceUrlPart = { type: "source-url"; sourceId: string; url: string; title?: string | undefined };
export type FilePart = { type: "file"; mediaType: string; url: string; filename?: string | undefined };
export type DataPart = { type: `data-${string}`; id?: string | undefined; data: unknown };
export type UIMessagePart = TextPart | ReasoningPart | ToolPart | SourceUrlPart | FilePart | DataPart;

export type UIMessage<M = unknown> = { id: string; role: "system" | "user" | "assistant"; parts: UIMessagePart[]; metadata?: M | undefined };

export const isToolPart = (p: UIMessagePart): p is ToolPart => p.type.startsWith("tool-");
export const textOf = (m: Pick<UIMessage, "parts">) =>
  m.parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.text)
    .join("");

/* ---------- what answered (DECISIONS D2: every reply names it) ---------- */

/** The purpose-named choices a picker offers (never "Auto"); each maps to a model and an effort in the adapter. */
export type ModelPurpose = "fast" | "balanced" | "deep" | "long";
export type ModelLine = {
  /** the purpose the person reads: "Balanced" */
  purpose: string;
  /** the model's own name, a second line: "Claude Sonnet 5.5" */
  name: string;
  effort?: "low" | "medium" | "high" | undefined;
  /** how long it thought before answering, when it did */
  thoughtForMs?: number | undefined;
  /** the purpose that was asked for, when another one answered ("Deep thinking was busy") */
  asked?: string | undefined;
  /** why another answered */
  fallbackReason?: string | undefined;
};

/** "14 s", "1 min 5 s": a duration a person reads. */
export function seconds(ms: number) {
  const s = Math.max(1, Math.round(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ""}`;
}

/** The model line under every reply: "Balanced · thought for 9 s", or what answered in another's place. */
export function modelLineWords(m: ModelLine) {
  const lead = m.asked && m.asked !== m.purpose ? `Answered by ${m.purpose}; ${m.asked} ${m.fallbackReason ?? "wasn't available"}` : m.purpose;
  return m.thoughtForMs ? `${lead} · thought for ${seconds(m.thoughtForMs)}` : lead;
}

/* ---------- usage (DECISIONS D8: two windows, said in words) ---------- */

/** What is used of each window, as a share from 0 to 1, and when each resets. Null when nothing measures it. */
export type Usage = { window: number; week: number; windowResetsAt: string; weekResetsAt: string };

/** "4:10 pm" in the reader's own clock. */
export function clockTime(iso: string, locale?: string) {
  return new Date(iso).toLocaleTimeString(locale ?? "en-US", { hour: "numeric", minute: "2-digit" }).replace(/\s?([AP])M$/i, (_, a: string) => ` ${a.toLowerCase()}m`);
}

/** "today at 4:10 pm", "Monday", or a date further out. */
export function resetWords(iso: string, now: Date, locale?: string) {
  const at = new Date(iso);
  const days = Math.round((new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 864e5);
  if (days <= 0) return clockTime(iso, locale);
  if (days === 1) return `tomorrow ${clockTime(iso, locale)}`;
  if (days < 7) return at.toLocaleDateString(locale ?? "en-US", { weekday: "long" });
  return at.toLocaleDateString(locale ?? "en-US", { month: "short", day: "numeric" });
}

/** The reset in a sentence: "at 4:10 pm", "tomorrow at 4:10 pm", "on Monday". */
export function resetPhrase(iso: string, now: Date, locale?: string) {
  const w = resetWords(iso, now, locale);
  return /^\d/.test(w) ? `at ${w}` : w.startsWith("tomorrow ") ? `tomorrow at ${w.slice(9)}` : `on ${w}`;
}

/** Where a figure stands against its limit: the same edges the Meter uses (75% warns, 100% is full). */
export type UsageLevel = "ok" | "near" | "full";

/**
 * Every usage figure the pieces show, from one calculation: each window's share used (a whole percent, rounded
 * down so "100%" only ever means full), its words, its reset, whether to warn (under 20% of the window left) and
 * whether the window is spent. Whichever window runs out first is the one that limits.
 */
export function usageFigures(u: Usage, now: Date, locale?: string) {
  const pct = (x: number) => Math.max(0, Math.min(100, Math.floor(x * 100)));
  const window = pct(u.window), week = pct(u.week);
  const level = (p: number): UsageLevel => (p >= 100 ? "full" : p >= 75 ? "near" : "ok");
  const windowReset = resetWords(u.windowResetsAt, now, locale), weekReset = resetWords(u.weekResetsAt, now, locale);
  const limiting = week >= 100 || (week > window && week >= 80) ? "week" : "window";
  const left = 100 - (limiting === "week" ? week : window);
  const reset = limiting === "week" ? weekReset : windowReset;
  return {
    window,
    week,
    windowLevel: level(window),
    weekLevel: level(week),
    windowLine: `${window}% used · resets ${windowReset}`,
    weekLine: `${week}% of this week · resets ${weekReset}`,
    limiting,
    left,
    reset,
    /** the reset in a sentence ("at 4:10 pm", "on Monday") */
    resetPhrase: resetPhrase(limiting === "week" ? u.weekResetsAt : u.windowResetsAt, now, locale),
    resetsAt: limiting === "week" ? u.weekResetsAt : u.windowResetsAt,
    /** under 20% left: the composer shows its quiet line */
    low: left < 20 && left > 0,
    atLimit: left <= 0,
    /** the composer's line, only when low or spent */
    composerLine: left <= 0 ? `${limiting === "week" ? "You've reached this week's limit" : "You've reached your limit for now"} · resets ${reset}` : `${left}% left${limiting === "week" ? " this week" : ""} · resets ${reset}`,
  };
}

/** How full a chat is against what the model can read at once, in words with no token talk (DEPTH 93). */
export function contextWords(share: number) {
  const p = Math.max(0, Math.min(100, Math.floor(share * 100)));
  if (p >= 90) return { pct: p, line: "This chat is very long: early messages may be left out. Start a new chat to keep answers sharp." };
  if (p >= 60) return { pct: p, line: "This chat is getting long: answers may miss early details." };
  return { pct: p, line: "Room to keep going in this chat." };
}
