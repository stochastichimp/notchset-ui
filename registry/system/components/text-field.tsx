// Notchset text-field 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Field, FieldControl, fieldSurface, type FieldProps } from "@/components/ui/notchset/field";

/*
 * Text field and text area: a Field with a native input or textarea in the system's well. Everything a native
 * input takes passes through (type, autoComplete, inputMode, required), so browsers and password managers keep
 * working. Give a label; without one, pass aria-label.
 */
type Shared = Omit<FieldProps, "children" | "className"> & { className?: string | undefined; fieldClassName?: string | undefined };
type TextFieldProps = Shared & Omit<React.ComponentPropsWithoutRef<"input">, "className" | "disabled" | "name">;
type TextAreaProps = Shared & Omit<React.ComponentPropsWithoutRef<"textarea">, "className" | "disabled" | "name">;

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, disabled, name, className, fieldClassName, type = "text", ...props },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} disabled={disabled} name={name} className={fieldClassName}>
      <FieldControl ref={ref} type={type} data-slot="text-field" className={cn(fieldSurface, "h-[var(--ns-field)]", className)} {...props} />
    </Field>
  );
});

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, disabled, name, className, fieldClassName, rows = 4, ...props },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} disabled={disabled} name={name} className={fieldClassName}>
      <FieldControl
        render={<textarea ref={ref} rows={rows} />}
        data-slot="text-area"
        className={cn(fieldSurface, "block resize-y p-2.5 leading-[1.5]", className)}
        {...(props as React.ComponentPropsWithoutRef<"input">)}
      />
    </Field>
  );
});

export { TextArea, TextField, type TextAreaProps, type TextFieldProps };
