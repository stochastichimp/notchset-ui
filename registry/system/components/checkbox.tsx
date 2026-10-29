// Notchset checkbox 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Checkbox as Base } from "@base-ui/react/checkbox";
import { cn } from "@/lib/utils";

/*
 * Checkbox: 16px, a rounded square with a 1.5px ink-3 edge that darkens on hover. Checked fills with ink;
 * tone="done" fills with the ok colour, for finishing a task, and pops once when ticked. Mixed shows a dash.
 * Children become its label (the whole row toggles). On touch screens the hit area grows to 40px.
 */
type CheckboxProps = Omit<React.ComponentPropsWithoutRef<typeof Base.Root>, "className"> & {
  tone?: "ink" | "done" | undefined;
  className?: string | undefined;
  children?: React.ReactNode;
};

function Checkbox({ tone = "ink", className, children, ...props }: CheckboxProps) {
  const box = (
    <Base.Root
      data-slot="checkbox"
      className={cn(
        "relative grid size-[var(--ns-check)] shrink-0 cursor-pointer place-items-center rounded-[5px] shadow-[inset_0_0_0_1.5px_var(--ns-ink-3)] outline-hidden [transition:background-color_150ms,box-shadow_150ms]",
        "hover:shadow-[inset_0_0_0_1.5px_var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] data-disabled:cursor-default data-disabled:opacity-45",
        "pointer-coarse:after:absolute pointer-coarse:after:-inset-3 pointer-coarse:after:content-['']",
        tone === "done"
          ? "data-checked:bg-[var(--ns-ok)] data-checked:text-white data-checked:shadow-none data-checked:[animation:ns-pop_420ms_var(--ns-ease-pop)]"
          : "data-checked:bg-[var(--ns-ink)] data-checked:text-[var(--ns-canvas)] data-checked:shadow-none",
        "data-indeterminate:bg-[var(--ns-ink)] data-indeterminate:text-[var(--ns-canvas)] data-indeterminate:shadow-none",
        className,
      )}
      data-ns-still=""
      {...props}
    >
      <Base.Indicator
        keepMounted
        render={(p, state) => (
          <span {...p} className="grid place-items-center data-unchecked:hidden">
            {state.indeterminate ? (
              <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden>
                <path d="M2.5 5h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden>
                <path d="M2.2 5.2 4.2 7.1 7.9 3" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        )}
      />
    </Base.Root>
  );
  if (!children) return box;
  return (
    <label data-slot="checkbox-label" className="inline-flex cursor-pointer items-center gap-2.5 text-[var(--ns-ink)] has-data-disabled:cursor-default">
      {box}
      <span className="min-w-0">{children}</span>
    </label>
  );
}

export { Checkbox, type CheckboxProps };
