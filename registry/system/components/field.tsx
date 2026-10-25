// Notchset field 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Field as Base } from "@base-ui/react/field";
import { cn } from "@/lib/utils";

/*
 * Field: a label above a control, then a hint or the error. The label is tied to the control, the hint and
 * error are read with it, and an error marks the control invalid. Every input in the system sits in one.
 *
 * fieldSurface is the well every text control is drawn in (text field, text area, select, combobox, search):
 * a recessed well with a hairline, and on focus an ink hairline with a soft ink halo. Orange is never a focus
 * colour; it means "where you are". On touch screens text is 16px so phones do not zoom into the field.
 */
export const fieldSurface =
  "w-full min-w-0 rounded-[var(--ns-radius)] bg-[var(--ns-well)] px-2.5 font-[family-name:var(--ns-font-body)] text-[length:var(--ns-text-body)] text-[var(--ns-ink)] shadow-[inset_0_0_0_1px_var(--ns-line)] outline-hidden [transition:box-shadow_var(--ns-time-color)] pointer-coarse:text-[16px] [&[type=number]]:[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none " +
  "placeholder:text-[var(--ns-ink-3)] " +
  "focus:shadow-[inset_0_0_0_1px_var(--ns-ink-2),0_0_0_3px_color-mix(in_oklab,var(--ns-ink)_10%,transparent)] focus-within:shadow-[inset_0_0_0_1px_var(--ns-ink-2),0_0_0_3px_color-mix(in_oklab,var(--ns-ink)_10%,transparent)] " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--ns-bad)] data-invalid:shadow-[inset_0_0_0_1px_var(--ns-bad)] " +
  "disabled:cursor-default disabled:opacity-45 data-disabled:opacity-45";

type FieldProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Shown under the control and read with it; also marks the control invalid. */
  error?: React.ReactNode;
  disabled?: boolean | undefined;
  name?: string | undefined;
  className?: string | undefined;
  children: React.ReactNode;
};

function Field({ label, hint, error, disabled, name, className, children }: FieldProps) {
  return (
    <Base.Root
      data-slot="field"
      invalid={Boolean(error)}
      disabled={disabled}
      name={name}
      className={cn("flex min-w-0 flex-col gap-1.5 text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]", className)}
    >
      {label && <Base.Label className="w-fit">{label}</Base.Label>}
      {children}
      {error ? (
        <Base.Error match className="text-[length:var(--ns-text-meta)] text-[var(--ns-bad-ink)]">
          {error}
        </Base.Error>
      ) : hint ? (
        <Base.Description className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{hint}</Base.Description>
      ) : null}
    </Base.Root>
  );
}

/** The control slot of a Field: whatever element is rendered gets the label, hint and error wiring. */
const FieldControl = Base.Control;

export { Field, FieldControl, type FieldProps };
