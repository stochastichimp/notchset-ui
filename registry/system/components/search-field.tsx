// Notchset search-field 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KeyboardHint } from "@/components/ui/notchset/keyboard-hint";

/*
 * Search field: filters what is on the page as you type. Esc clears it (then leaves it); a clear button
 * appears once there is text. Dense (28px) beside a table's tabs, or wide (32px) at the top of a list.
 * `shortcut` prints the key that focuses it, and binds it: a printed key always works.
 */
type SearchFieldProps = Omit<React.ComponentPropsWithoutRef<"input">, "onChange" | "value" | "defaultValue" | "size"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** A single key that focuses the field from anywhere on the page ("/"). */
  shortcut?: string | undefined;
  size?: "dense" | "wide" | undefined;
};

const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onValueChange, shortcut, size = "dense", className, placeholder = "Search", "aria-label": ariaLabel, onKeyDown, disabled, readOnly, ...props },
  forwarded,
) {
  const inner = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(forwarded, () => inner.current!);
  /* a disabled or read-only field can't be changed from anywhere: not by typing, Esc, the clear button or the shortcut */
  const locked = !!disabled || !!readOnly;
  React.useEffect(() => {
    if (!shortcut || disabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== shortcut || e.metaKey || e.ctrlKey || e.altKey || t.closest("input,textarea,select,[contenteditable=true]")) return;
      e.preventDefault();
      inner.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut, disabled]);
  return (
    <span
      data-slot="search-field"
      className={cn(
        "inline-flex items-center gap-[7px] rounded-[var(--ns-radius)] bg-[var(--ns-well)] px-[9px] text-[var(--ns-ink-3)] shadow-[inset_0_0_0_1px_var(--ns-line)] [transition:box-shadow_var(--ns-time-color)]",
        "focus-within:shadow-[inset_0_0_0_1px_var(--ns-ink-2),0_0_0_3px_color-mix(in_oklab,var(--ns-ink)_10%,transparent)]",
        size === "wide" ? "h-[var(--ns-control)] w-full" : "h-[var(--ns-control-sm)] w-[220px] max-[960px]:w-full",
        className,
      )}
    >
      <Search className="size-3.5 shrink-0" aria-hidden />
      <input
        ref={inner}
        type="search"
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        aria-label={ariaLabel ?? (typeof placeholder === "string" ? placeholder : "Search")}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.key === "Escape" && value && !locked) {
            e.preventDefault();
            e.stopPropagation();
            onValueChange("");
          } else if (e.key === "Escape" && !value) inner.current?.blur();
        }}
        className="min-w-0 flex-1 bg-transparent text-[length:var(--ns-text-body)] text-[var(--ns-ink)] outline-hidden placeholder:text-[var(--ns-ink-3)] pointer-coarse:text-[16px] [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          disabled={locked}
          onClick={() => {
            if (locked) return;
            onValueChange("");
            inner.current?.focus();
          }}
          className="-mr-1 grid size-5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 place-items-center rounded-[5px] text-[var(--ns-ink-3)] outline-hidden hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] pointer-coarse:size-8"
        >
          <X className="size-3" aria-hidden />
        </button>
      ) : shortcut ? (
        <KeyboardHint keys={shortcut} />
      ) : null}
    </span>
  );
});

export { SearchField, type SearchFieldProps };
