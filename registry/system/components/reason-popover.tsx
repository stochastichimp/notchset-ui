// Notchset reason-popover 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Popover } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/notchset/button";
import { popupPositioner, popupSurface } from "@/lib/notchset/popup";
import { useReturnFocus } from "@/lib/notchset/return-focus";
import { TextField } from "@/components/ui/notchset/text-field";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Reason popover: a step that needs one line of why before it runs (deny a request, decline a quote, pause an
 * account), asked right where it was pressed instead of in a dialog. The question, one field, Cancel and the verb.
 * Enter runs it; an empty reason says what to write and keeps the popover open; a refused save keeps what was
 * typed. On a phone it rises as a sheet. Focus starts in the field and returns to the trigger.
 * A red, irreversible step belongs in a Dialog; this is for steps that Undo can take back.
 */
type ReasonPopoverProps = {
  /** The control that opens it: one element that takes a ref. */
  trigger: React.ReactElement;
  /** The question, as a short heading ("Why deny Q-1047?"). */
  title: React.ReactNode;
  /** The field's label. */
  label: string;
  placeholder?: string | undefined;
  /** The verb that runs it ("Deny"). */
  verb: string;
  /** Said when the field is empty and the verb is pressed. */
  required?: string | undefined;
  /** Runs the step; return an error to show (and stay open), or nothing once it ran. */
  onSubmit: (reason: string) => string | null | undefined | void;
  align?: "start" | "center" | "end" | undefined;
  className?: string | undefined;
};

function ReasonPopover({ trigger, title, label, placeholder, verb, required = "Say why, in a few words", onSubmit, align = "end", className }: ReasonPopoverProps) {
  const portalContainer = usePortalContainer();
  const [open, setOpen] = React.useState(false);
  const returnFocus = useReturnFocus();
  return (
    <Popover.Root open={open} onOpenChange={(o) => setOpen(o)}>
      <Popover.Trigger render={trigger} />
      <Popover.Portal container={portalContainer}>
        <Popover.Positioner side="bottom" align={align} sideOffset={6} collisionPadding={8} className={popupPositioner}>
          <Popover.Popup data-slot="reason-popover" data-ns-layer="" data-ns-moves="" finalFocus={returnFocus} className={cn(popupSurface, "w-[min(320px,calc(100vw-16px))] p-3 max-[600px]:w-auto max-[600px]:px-3 max-[600px]:pt-5 max-[600px]:pb-3", className)}>
            {/* mounted only while open, so each opening starts empty */}
            {open && <ReasonForm title={title} label={label} placeholder={placeholder} verb={verb} required={required} onSubmit={onSubmit} onDone={() => setOpen(false)} />}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ReasonForm({ title, label, placeholder, verb, required, onSubmit, onDone }: Omit<ReasonPopoverProps, "trigger" | "align" | "className"> & { onDone: () => void }) {
  const [text, setText] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const run = () => {
    if (!text.trim()) return setErr(required ?? null);
    const e = onSubmit(text.trim());
    if (e) setErr(e);
    else onDone();
  };
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        run();
      }}
    >
      <Popover.Title className="m-0 text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{title}</Popover.Title>
      <TextField label={label} placeholder={placeholder} value={text} error={err} autoFocus onChange={(e) => (setText(e.target.value), setErr(null))} />
      <div className="flex justify-end gap-2">
        <Popover.Close render={<Button size="sm">Cancel</Button>} />
        <Button size="sm" type="submit" variant="primary">
          {verb}
        </Button>
      </div>
    </form>
  );
}

export { ReasonPopover, type ReasonPopoverProps };
