// Notchset inline-edit 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Inline edit: a value you change where you read it (a deal's amount, a close date). It reads as text; hover
 * shows it can be edited; a click or Enter turns it into a field. Enter or leaving the field saves, Esc puts
 * it back. If onCommit returns words, the value was refused: the field stays open, marked, and says why; if it
 * throws, the field says it couldn’t save and Enter retries. A save that settles after you pressed Esc, reopened
 * or kept typing leaves the newer edit alone.
 * size="figure" is the large number at the top of a record.
 */
type InlineEditProps = {
  value: string;
  /** Save the new value. Return (or resolve) an error message to refuse it. */
  onCommit: (next: string) => string | void | Promise<string | void>;
  /** What is being edited, for screen readers ("Deal amount"). */
  label: string;
  /** How the value reads when not editing (formatting, an icon). Defaults to the value. */
  display?: React.ReactNode;
  /** Shown, quieter, when there is no value ("Add a close date"). */
  placeholder?: string | undefined;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  size?: "default" | "figure" | undefined;
  className?: string | undefined;
};

function InlineEdit({ value, onCommit, label, display, placeholder = "Add", inputMode, size = "default", className }: InlineEditProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const errorId = React.useId();
  /* each open is a session; a save that settles after its session ended (Esc, reopen) changes nothing */
  const session = React.useRef(0);
  const busy = React.useRef(false);
  /* what the field holds right now, kept beside the state so a late save can compare without a re-render */
  const latest = React.useRef(draft);
  const edit = (v: string) => {
    latest.current = v;
    setDraft(v);
  };

  React.useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  const open = () => {
    session.current++;
    edit(value);
    setError(null);
    setEditing(true);
  };
  const close = (refocus: boolean) => {
    session.current++;
    setEditing(false);
    setError(null);
    if (refocus) requestAnimationFrame(() => trigger.current?.focus());
  };
  const commit = async (refocus: boolean) => {
    if (busy.current) return;
    if (draft === value) return close(refocus);
    const mine = session.current;
    const sent = draft;
    busy.current = true;
    setSaving(true);
    let refused: string | void;
    try {
      refused = await onCommit(sent);
    } catch {
      refused = "Couldn’t save that change. Try again.";
    } finally {
      busy.current = false;
      setSaving(false);
    }
    /* stale: the editor was closed or reopened meanwhile, or you kept typing; leave the newer work alone */
    if (mine !== session.current || latest.current !== sent) return;
    if (refused) {
      setError(refused);
      input.current?.focus();
      return;
    }
    close(refocus);
  };

  const figure = size === "figure";
  if (editing) {
    return (
      <span data-slot="inline-edit" data-editing="" className={cn("inline-flex flex-col gap-1", className)}>
        <input
          ref={input}
          value={draft}
          aria-label={label}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-busy={saving || undefined}
          onChange={(e) => {
            edit(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (e.key === "Enter") {
              e.preventDefault();
              void commit(true);
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              edit(value);
              close(true);
            }
          }}
          onBlur={() => void commit(false)}
          className={cn(
            "rounded-[7px] border-0 bg-[var(--ns-panel)] px-2 text-[var(--ns-ink)] outline-hidden pointer-coarse:text-[16px]",
            "shadow-[inset_0_0_0_1px_var(--ns-ink-3),0_0_0_3px_color-mix(in_oklab,var(--ns-ink)_10%,transparent)] aria-invalid:shadow-[inset_0_0_0_1px_var(--ns-bad),0_0_0_3px_color-mix(in_oklab,var(--ns-bad)_18%,transparent)]",
            figure
              ? "h-10 w-[200px] font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-page)] font-[number:var(--ns-weight-medium)] tracking-[-0.02em] tabular-nums"
              : "h-[30px] w-[160px] font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-medium)]",
          )}
        />
        {error && (
          <span id={errorId} role="alert" className="text-[length:var(--ns-text-meta)] text-[var(--ns-bad-ink)]">
            {error}
          </span>
        )}
      </span>
    );
  }
  return (
    <button
      ref={trigger}
      type="button"
      data-slot="inline-edit"
      aria-label={`${label}: ${value || "empty"}. Edit`}
      onClick={open}
      className={cn(
        "inline-flex cursor-text items-center gap-2 rounded-[6px] text-left text-[var(--ns-ink)] outline-hidden [transition:background-color_var(--ns-time-color),box-shadow_var(--ns-time-color)]",
        "hover:bg-[var(--ns-hover)] hover:shadow-[inset_0_0_0_1px_var(--ns-line)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] [&_svg]:text-[var(--ns-ink-3)]",
        figure
          ? "-mx-1.5 -my-1 self-start px-1.5 py-1 font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-page)] leading-none font-[number:var(--ns-weight-medium)] tracking-[-0.02em] tabular-nums"
          : "-mx-1.5 -my-[3px] px-1.5 py-[3px] pointer-coarse:min-h-9",
        className,
      )}
    >
      {value ? (display ?? value) : <span className="text-[var(--ns-ink-3)]">{placeholder}</span>}
    </button>
  );
}

export { InlineEdit, type InlineEditProps };
