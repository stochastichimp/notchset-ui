// Notchset model-selector 2.0.0 · https://notchset.dev/changelog
"use client";
import { Menu as Base } from "@base-ui/react/menu";
import { Check, ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/notchset/button";
import { Menu } from "@/components/ui/notchset/menu";
import { popupItem } from "@/lib/notchset/popup";

/*
 * Model selector: which model answers, named by what it's for. Up to four choices ("Fast", "Balanced", "Deep
 * thinking", "Long documents"), each with one line on when to pick it and the model's own name under it; no hidden
 * Auto. A choice that can't answer right now stays listed, disabled, with the reason ("Busy right now"). An assistant
 * that fixes its model shows it as set, with who set it, instead of a menu. Every reply then names what answered
 * (Message's model line), so a fallback is never silent.
 *
 * The host owns the choice and the shortcut that opens it (⌘⇧M in the template), through open and onOpenChange.
 */
type ModelChoice = {
  id: string;
  /** what it's for, the name a person reads: "Balanced" */
  purpose: string;
  /** when to pick it: "Most questions; thinks longer when it helps" */
  note: string;
  /** the model's own name: "Claude Sonnet 5.5" */
  name: string;
  /** why it can't answer right now; shown, and the choice is disabled */
  unavailable?: string | undefined;
};
type ModelSelectorProps = {
  choices: ModelChoice[];
  value: string;
  onValueChange: (id: string) => void;
  /** who fixed the model ("Support assistant"): no menu, the choice is said as set */
  lockedBy?: string | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
};

function ModelSelector({ choices, value, onValueChange, lockedBy, open, onOpenChange, className }: ModelSelectorProps) {
  const current = choices.find((c) => c.id === value) ?? choices[0];
  if (!current) return null;
  if (lockedBy)
    return (
      <span data-slot="model-selector" data-locked="" className={cn("inline-flex h-[var(--ns-control-sm)] items-center gap-1.5 px-2 text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]", className)}>
        <Lock aria-hidden className="size-3" />
        {current.purpose}
        <span className="text-[var(--ns-ink-3)] max-[600px]:hidden">· set by {lockedBy}</span>
      </span>
    );
  return (
    <Menu
      open={open}
      onOpenChange={onOpenChange}
      className="w-[min(300px,calc(100vw-16px))]"
      trigger={
        <Button data-slot="model-selector" size="sm" variant="ghost" aria-label={`Model: ${current.purpose}. Change model`} aria-keyshortcuts="Meta+Shift+M Control+Shift+M" className={cn("text-[var(--ns-ink-2)]", className)}>
          {current.purpose}
          <ChevronDown aria-hidden />
        </Button>
      }
    >
      <Base.RadioGroup value={value} onValueChange={(v) => onValueChange(String(v))}>
        {choices.map((c) => (
          <Base.RadioItem key={c.id} value={c.id} disabled={!!c.unavailable} closeOnClick className={cn(popupItem, "items-start py-2 data-disabled:opacity-100 data-disabled:[&_span]:text-[var(--ns-ink-3)]")}>
            <span className="mt-[3px] grid size-3.5 shrink-0 place-items-center">
              <Base.RadioItemIndicator>
                <Check aria-hidden className="size-3.5" />
              </Base.RadioItemIndicator>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{c.purpose}</span>
                <span className="truncate text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{c.name}</span>
              </span>
              <span className="text-[length:var(--ns-text-small)] whitespace-normal text-[var(--ns-ink-2)]">{c.unavailable ?? c.note}</span>
            </span>
          </Base.RadioItem>
        ))}
      </Base.RadioGroup>
    </Menu>
  );
}

export { ModelSelector, type ModelChoice, type ModelSelectorProps };
