// Notchset combobox 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Combobox as Base } from "@base-ui/react/combobox";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldSurface } from "@/components/ui/notchset/field";
import { popupEmpty, popupItem, popupPositioner, popupSurface } from "@/lib/notchset/popup";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Combobox: pick one of a long list by typing (a company, an owner). The first match is highlighted, so
 * type-then-Enter picks it. Shows what is chosen when closed; says "No matches" rather than an empty box. With
 * `onCreate`, a name that matches nothing exactly is offered as the last item ("Create “Loom”"): the host makes
 * the record and returns its value, which is then chosen, so typing a new name never dead-ends.
 */
type ComboboxOption = { value: string; label: string; icon?: React.ReactNode; hint?: React.ReactNode };
type ComboboxProps = {
  options: ComboboxOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string | undefined;
  "aria-label"?: string | undefined;
  disabled?: boolean | undefined;
  /** Makes a record from the typed name and returns its value (null when refused); offered when nothing matches exactly. */
  onCreate?: ((name: string) => string | null | undefined) | undefined;
  className?: string | undefined;
};
const CREATE = "\u0000create";

function Combobox({ options, value, onValueChange, placeholder = "Search…", disabled, onCreate, className, ...aria }: ComboboxProps) {
  const portalContainer = usePortalContainer();
  const [typed, setTyped] = React.useState("");
  const chosen = options.find((o) => o.value === value) ?? null;
  const name = typed.trim();
  const offer = !!onCreate && !!name && !options.some((o) => o.label.toLowerCase() === name.toLowerCase());
  return (
    <Base.Root
      items={offer ? [...options, { value: CREATE, label: name }] : options}
      value={chosen}
      onInputValueChange={(v) => setTyped(v)}
      onValueChange={(o) => {
        const x = o as ComboboxOption | null;
        if (x?.value === CREATE) {
          const made = onCreate!(x.label);
          if (made) onValueChange(made);
          return;
        }
        onValueChange(x?.value ?? null);
      }}
      itemToStringLabel={(o: ComboboxOption) => o.label}
      isItemEqualToValue={(a: ComboboxOption, b: ComboboxOption) => a.value === b.value}
      autoHighlight
      disabled={disabled}
    >
      <Base.InputGroup data-slot="combobox" className={cn(fieldSurface, "flex h-[var(--ns-field)] items-center gap-2 pr-1.5", className)}>
        {chosen?.icon && <span className="flex shrink-0 [&_svg:not([data-slot=company-mark])]:size-3.5">{chosen.icon}</span>}
        <Base.Input placeholder={placeholder} {...aria} className="h-full min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-[var(--ns-ink-3)]" />
        <Base.Trigger aria-label="Show options" className="group grid size-6 cursor-pointer place-items-center rounded-[5px] text-[var(--ns-ink-3)] outline-hidden hover:text-[var(--ns-ink)]">
          <ChevronDown className="size-3.5 [transition:rotate_160ms_var(--ns-ease)] group-data-popup-open:rotate-180" />
        </Base.Trigger>
      </Base.InputGroup>
      <Base.Portal container={portalContainer}>
        <Base.Positioner sideOffset={4} collisionPadding={8} className={popupPositioner}>
          <Base.Popup data-slot="combobox-popup" data-ns-moves="" className={popupSurface}>
            <Base.Empty className={popupEmpty}>No matches</Base.Empty>
            <Base.List>
              {(o: ComboboxOption) => (
                <Base.Item key={o.value} value={o} className={popupItem}>
                  {o.value === CREATE ? <Plus aria-hidden /> : o.icon}
                  <span className="min-w-0 flex-1 truncate">{o.value === CREATE ? `Create “${o.label}”` : o.label}</span>
                  {o.hint && <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{o.hint}</span>}
                  <Base.ItemIndicator className="ml-2">
                    <Check />
                  </Base.ItemIndicator>
                </Base.Item>
              )}
            </Base.List>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

export { Combobox, type ComboboxOption, type ComboboxProps };
