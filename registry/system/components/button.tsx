// Notchset button 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/notchset/spinner";

/*
 * Button: the one action shape. Secondary (raised, the default), primary (one per region, rightmost), ghost
 * (quiet row actions) and danger (a confirmed destructive step). Two sizes and a square icon form.
 *
 * Busy says it in words: pass `busy` and the label you want shown ("Saving…"); a spinner sits beside it, the
 * button announces aria-busy, and never submits a form or fires onClick while busy. The outcome is said by whatever
 * the action changes (a toast, the row), never by colouring the button.
 */

const base =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap select-none font-[family-name:var(--ns-font-body)] font-[number:var(--ns-weight-medium)] leading-none tracking-[-0.005em] outline-hidden [-webkit-tap-highlight-color:transparent] [transition:background-color_var(--ns-time-color),color_var(--ns-time-color),box-shadow_var(--ns-time-color),filter_var(--ns-time-color),transform_120ms_var(--ns-ease),scale_120ms_var(--ns-ease)] not-disabled:active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] disabled:cursor-default disabled:opacity-45 aria-disabled:cursor-default aria-disabled:opacity-45 aria-disabled:active:scale-100 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5";

const variants = {
  secondary: "bg-[var(--ns-raised)] text-[var(--ns-ink)] shadow-[var(--ns-bezel)] hover:not-disabled:not-aria-disabled:bg-[var(--ns-hover)]",
  primary:
    "px-[max(var(--ns-control-pad),14px)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_88%,#fff),var(--primary))] text-[var(--primary-foreground)] shadow-[var(--ns-lift)] hover:not-disabled:not-aria-disabled:brightness-[1.06]",
  ghost: "bg-transparent text-[var(--ns-ink-3)] hover:not-disabled:not-aria-disabled:bg-[var(--ns-hover)] hover:not-disabled:not-aria-disabled:text-[var(--ns-ink)]",
  danger: "bg-[color-mix(in_oklab,var(--ns-bad)_86%,black)] text-white hover:not-disabled:not-aria-disabled:bg-[color-mix(in_oklab,var(--ns-bad)_80%,black)]",
} as const;

const sizes = {
  default: "h-[var(--ns-control)] rounded-[var(--ns-radius)] px-[var(--ns-control-pad)] text-[length:var(--ns-text-control)]",
  sm: "h-[var(--ns-control-sm)] rounded-[calc(var(--ns-radius)-1px)] px-2.5 text-[length:var(--ns-text-small)]",
} as const;

const square = { default: "w-[var(--ns-control)] px-0", sm: "w-[var(--ns-control-sm)] px-0" } as const;

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: keyof typeof variants | undefined;
  size?: keyof typeof sizes | undefined;
  /** A square button holding only an icon. Give it an aria-label (Icon button does this for you). */
  square?: boolean | undefined;
  /** The action is under way: the label you pass is shown with a spinner, and presses are ignored. */
  busy?: boolean | undefined;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "default", square: isSquare = false, busy = false, type = "button", className, children, onClick, ...props },
  ref,
) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      ref={ref}
      type={type}
      data-slot="button"
      data-variant={variant}
      aria-busy={busy || undefined}
      onClick={handleClick}
      className={cn(base, sizes[size], variants[variant], isSquare && square[size], className)}
      {...props}
    >
      {busy && <Spinner size={size === "sm" ? 12 : 14} />}
      {children}
    </button>
  );
});

export { Button, type ButtonProps };
