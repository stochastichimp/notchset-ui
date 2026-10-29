// Notchset secret-reveal 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/notchset/button";

/*
 * Secret reveal: a secret shown the one time it exists outside the server (a new API key, a signing secret). The
 * whole value in the mono face, selectable, one Copy, and a plain line saying it won't be shown again. Copy says
 * Copied in place; where the clipboard is refused, the value is selected so the person can copy it themselves.
 */
type SecretRevealProps = {
  value: string;
  /** What it is, read with the value ("Your new key"). */
  label: string;
  /** Why it's shown once, or what to do with it. */
  note?: React.ReactNode;
  className?: string | undefined;
};

function SecretReveal({ value, label, note = "Copy it now and keep it somewhere safe. You won’t see it again.", className }: SecretRevealProps) {
  const id = React.useId();
  const box = React.useRef<HTMLElement>(null);
  const [copied, setCopied] = React.useState<"" | "yes" | "select">("");
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  /* feedback belongs to the value it was asked for: a new value resets it, and an answer to an older request lands nowhere */
  const generation = React.useRef(0);
  const [seen, setSeen] = React.useState(value);
  if (seen !== value) {
    setSeen(value);
    setCopied("");
  }
  React.useEffect(() => {
    generation.current += 1;
    clearTimeout(timer.current);
  }, [value]);
  const select = () => {
    const r = document.createRange();
    if (!box.current) return;
    r.selectNodeContents(box.current);
    const s = getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
  };
  const copy = async () => {
    const mine = ++generation.current;
    try {
      await navigator.clipboard.writeText(value);
      if (generation.current !== mine) return;
      setCopied("yes");
    } catch {
      if (generation.current !== mine) return;
      select();
      setCopied("select");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(""), 1800);
  };
  return (
    <div data-slot="secret-reveal" className={cn("flex min-w-0 flex-col gap-2", className)}>
      <span id={id} className="text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">
        {label}
      </span>
      <div className="flex min-w-0 items-start gap-2 rounded-[var(--ns-radius)] bg-[var(--ns-well)] py-1.5 pr-1.5 pl-3 shadow-[inset_0_0_0_1px_var(--ns-line-soft)]">
        <code
          ref={box}
          aria-labelledby={id}
          tabIndex={0}
          onFocus={select}
          className="min-w-0 flex-1 self-center py-1 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-small)] break-all text-[var(--ns-ink)] outline-hidden select-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)]"
        >
          {value}
        </code>
        <Button size="sm" onClick={copy} aria-label={copied === "yes" ? "Copied" : `Copy ${label.toLowerCase()}`} className="shrink-0">
          {copied === "yes" ? <Check /> : <Copy />}
          {copied === "yes" ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="m-0 flex items-start gap-2 text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)] [&>svg]:mt-0.5 [&>svg]:size-3.5 [&>svg]:shrink-0" role={copied === "select" ? "status" : undefined}>
        <KeyRound aria-hidden />
        <span>{copied === "select" ? "Your browser didn’t allow copying. The key is selected: copy it with Ctrl C or ⌘ C." : note}</span>
      </p>
    </div>
  );
}

export { SecretReveal, type SecretRevealProps };
