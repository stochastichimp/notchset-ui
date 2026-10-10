"use client"


import { cn } from "@/lib/utils"

/*
 * Code parts: a small tokenizer for JS/TS/JSX, CSS, JSON and shell (no dependency; for full
 * grammars pass pre-tokenized lines from shiki), the token colours (keywords chart-2, strings chart-3,
 * tags and numbers chart-1, attributes chart-4, functions foreground, punctuation and comments muted),
 * and the copy icon that turns into a green check.
 */

type TokenKind = "kw" | "str" | "num" | "tag" | "attr" | "fn" | "com" | "pun" | "tx"
type Token = { text: string; kind: TokenKind }
type Language = "ts" | "tsx" | "js" | "jsx" | "css" | "json" | "sh" | "text"

const KEYWORDS = new Set([
  "import", "export", "from", "default", "const", "let", "var", "function", "return", "if", "else", "for", "while", "await", "async", "new", "class", "extends", "type", "interface", "as", "in", "of", "true", "false", "null", "undefined", "typeof", "void", "try", "catch", "throw", "switch", "case", "break", "continue",
])

/** Splits one line into coloured tokens. */
function tokenizeLine(line: string, lang: Language): Token[] {
  if (lang === "text") return [{ text: line, kind: "tx" }]
  const out: Token[] = []
  const rules: [RegExp, TokenKind | ((m: string, rest: string) => TokenKind)][] = [
    [lang === "sh" || lang === "css" ? /^#.*$/ : /^\/\/.*$/, "com"],
    [/^\/\*.*?(\*\/|$)/, "com"],
    [/^"(?:\\.|[^"\\])*"?|^'(?:\\.|[^'\\])*'?|^`(?:\\.|[^`\\])*`?/, "str"],
    [/^<\/?[A-Za-z][\w.-]*/, "tag"],
    [/^-?\b\d[\d_.]*(?:px|ms|s|%|em|rem)?\b/, "num"],
    [/^[A-Za-z_$][\w$-]*(?==)/, "attr"],
    [/^[A-Za-z_$][\w$]*/, (m, rest) => (KEYWORDS.has(m) ? "kw" : /^\s*\(/.test(rest) ? "fn" : lang === "css" && /^\s*:/.test(rest) ? "attr" : "tx")],
    [/^[{}()[\];,.:=<>/+*?!&|-]+/, "pun"],
    [/^\s+/, "tx"],
    [/^./, "tx"],
  ]
  let rest = line
  while (rest.length) {
    for (const [re, kind] of rules) {
      const m = re.exec(rest)
      if (!m || !m[0]) continue
      const text = m[0]
      const after = rest.slice(text.length)
      const k = typeof kind === "function" ? kind(text, after) : kind
      const last = out[out.length - 1]
      if (last && last.kind === k && (k === "tx" || k === "pun")) last.text += text
      else out.push({ text, kind: k })
      rest = after
      break
    }
  }
  return out
}

function TokenSpan({ token }: { token: Token }) {
  return (
    <span
      className={cn(
        token.kind === "kw" && "text-[color-mix(in_oklab,var(--chart-2,var(--foreground))_78%,var(--foreground))]",
        token.kind === "str" && "text-[color-mix(in_oklab,var(--chart-3,var(--foreground))_80%,var(--foreground))]",
        (token.kind === "num" || token.kind === "tag") && "text-[color-mix(in_oklab,var(--chart-1,var(--foreground))_72%,var(--foreground))]",
        token.kind === "attr" && "text-[color-mix(in_oklab,var(--chart-4,var(--foreground))_75%,var(--foreground))]",
        token.kind === "fn" && "text-[var(--foreground)]",
        (token.kind === "com" || token.kind === "pun") && "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]",
        token.kind === "tx" && "text-[var(--foreground)]"
      )}
    >
      {token.text}
    </span>
  )
}

/** The copy icon crossing into a green check. */
function CopyMark({ copied }: { copied: boolean }) {
  return (
    <span aria-hidden="true" className="relative block size-3.5 shrink-0">
      <svg viewBox="0 0 24 24" className={cn("absolute inset-0 size-full [transition:transform_.4s_var(--ns-ease-rebound),scale_.4s_var(--ns-ease-rebound),translate_.4s_var(--ns-ease-rebound),rotate_.4s_var(--ns-ease-rebound),opacity_.2s]", copied ? "scale-[.4] opacity-0" : "scale-100 opacity-100")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
      <svg viewBox="0 0 24 24" className={cn("absolute inset-0 size-full text-[var(--success,var(--foreground))] [transition:transform_.4s_var(--ns-ease-rebound),scale_.4s_var(--ns-ease-rebound),translate_.4s_var(--ns-ease-rebound),rotate_.4s_var(--ns-ease-rebound),opacity_.2s]", copied ? "scale-100 opacity-100" : "scale-[.4] opacity-0")} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  )
}

export { CopyMark, tokenizeLine, TokenSpan, type Language, type Token, type TokenKind }
