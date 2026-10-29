// Notchset select 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Select as Base } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldSurface } from "@/components/ui/notchset/field";
import { popupItem, popupPositioner, popupSurface } from "@/lib/notchset/popup";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Select: pick one of a short, known list. The list drops below the control (it never jumps over it) and is
 * a bottom sheet on a phone. kind="field" sits in a form, drawn like a text field; kind="property" is the
 * compact raised chip a record's side panel uses for a value you change in place (Forecast: Commit ⇅).
 * More than ~10 options, or options people type to find: use Combobox.
 */
type SelectOption<V extends string> = { value: V; label: string; icon?: React.ReactNode; hint?: React.ReactNode; disabled?: boolean | undefined };
type SelectProps<V extends string> = {
  options: SelectOption<V>[];
  value: V | null;
  onValueChange: (value: V) => void;
  placeholder?: string | undefined;
  kind?: "field" | "property" | undefined;
  /** For a select with no visible label (a property row's term labels it visually: pass the same words). */
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
};

function Select<V extends string>({ options, value, onValueChange, placeholder = "Choose…", kind = "field", disabled, className, ...aria }: SelectProps<V>) {
  const portalContainer = usePortalContainer();
  const chosen = options.find((o) => o.value === value);
  return (
    <Base.Root
      items={options.map((o) => ({ value: o.value, label: o.label }))}
      value={value}
      onValueChange={(v) => v !== null && onValueChange(v as V)}
      disabled={disabled}
    >
      <Base.Trigger
        data-slot="select"
        data-kind={kind}
        {...aria}
        className={cn(
          "group inline-flex cursor-pointer items-center gap-2 text-left outline-hidden select-none [&_svg:not([data-slot=company-mark])]:size-3.5 [&_svg]:shrink-0",
          kind === "field"
            ? cn(fieldSurface, "h-[var(--ns-field)] hover:shadow-[inset_0_0_0_1px_var(--ns-ink-3)] data-popup-open:shadow-[inset_0_0_0_1px_var(--ns-ink-2),0_0_0_3px_color-mix(in_oklab,var(--ns-ink)_10%,transparent)] focus-visible:shadow-[inset_0_0_0_1px_var(--ns-ink-2),0_0_0_3px_color-mix(in_oklab,var(--ns-ink)_10%,transparent)]")
            : "h-6 rounded-[7px] bg-[var(--ns-raised)] px-2 text-[length:var(--ns-text-body)] text-[var(--ns-ink)] shadow-[var(--ns-bezel)] hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] pointer-coarse:h-9 max-[960px]:h-9 data-disabled:opacity-45",
          className,
        )}
      >
        <span className={cn("flex min-w-0 flex-1 items-center gap-2 truncate", !chosen && "text-[var(--ns-ink-3)]")}>
          {chosen?.icon}
          {chosen ? chosen.label : placeholder}
        </span>
        <Base.Icon className="text-[var(--ns-ink-3)]">
          {kind === "field" ? <ChevronDown className="[transition:rotate_160ms_var(--ns-ease)] group-data-popup-open:rotate-180" /> : <ChevronsUpDown className="!size-3" />}
        </Base.Icon>
      </Base.Trigger>
      <Base.Portal container={portalContainer}>
        <Base.Positioner alignItemWithTrigger={false} sideOffset={4} collisionPadding={8} className={popupPositioner}>
          <Base.Popup data-slot="select-popup" data-ns-layer="" data-ns-moves="" className={popupSurface}>
            <Base.List>
              {options.map((o) => (
                <Base.Item key={o.value} value={o.value} disabled={o.disabled} className={popupItem}>
                  {o.icon}
                  <Base.ItemText className="min-w-0 flex-1 truncate">{o.label}</Base.ItemText>
                  {o.hint && <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{o.hint}</span>}
                  <Base.ItemIndicator className="ml-2 text-[var(--ns-ink)]">
                    <Check />
                  </Base.ItemIndicator>
                </Base.Item>
              ))}
            </Base.List>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

export { Select, type SelectOption, type SelectProps };
