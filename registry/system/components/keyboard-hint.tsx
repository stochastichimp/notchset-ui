// Notchset keyboard-hint 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Keyboard hint: keycaps for a shortcut ("⌘K", or ["G", "S"] for a sequence). Hidden on touch screens, where
 * there is no keyboard to press. The shortcut must work: printing a key nobody bound is a bug.
 */
type KeyboardHintProps = { keys: string | string[]; className?: string | undefined };

/** Apple keyboards say ⌘; everyone else presses Ctrl. Write shortcuts with ⌘ and they print right everywhere. */
const isApple = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const modKey = () => (isApple() ? "⌘" : "Ctrl");
const keyLabel = (k: string) => (isApple() ? k : k.replace(/⌘\s?/g, "Ctrl "));

const never = () => () => {};
function KeyboardHint({ keys, className }: KeyboardHintProps) {
  /* a server-rendered page says Ctrl, then the browser says ⌘ where it should: the first render matches the server's */
  const apple = React.useSyncExternalStore(never, isApple, () => false);
  const list = (Array.isArray(keys) ? keys : [keys]).map((k) => (apple ? k : k.replace(/⌘\s?/g, "Ctrl ")));
  return (
    <span data-slot="keyboard-hint" className={cn("inline-flex items-center gap-1 pointer-coarse:hidden", className)}>
      {list.map((key) => (
        <kbd
          key={key}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1.5 font-[family-name:var(--ns-font-mono)] text-[length:var(--ns-text-meta)] leading-none font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-3)] shadow-[inset_0_0_0_1px_var(--ns-line)]"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

export { KeyboardHint, keyLabel, modKey, type KeyboardHintProps };
