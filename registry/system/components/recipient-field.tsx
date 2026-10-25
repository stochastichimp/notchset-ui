// Notchset recipient-field 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Combobox as Base } from "@base-ui/react/combobox";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/notchset/avatar";
import { fieldSurface } from "@/components/ui/notchset/field";
import { popupEmpty, popupItem, popupPositioner, popupSurface } from "@/lib/notchset/popup";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Recipient field: who an email goes to. Each person is a chip with their avatar and name; type to find
 * someone (by name or address), Enter adds the first match, Backspace in the empty input takes off the last
 * chip, and a comma adds what you typed. A full address nobody has yet can be added as itself. Chips say their
 * address on hover. Matches are ranked: names that start with what you typed, then a later word of a name, then
 * an address or the line under it (a role, "Emailed before"). A chip marked `fresh` is someone new to the
 * conversation and is drawn with a dashed edge.
 */
type Recipient = { id: string; name: string; email: string; src?: string | undefined; hue?: number | undefined; sub?: string | undefined; fresh?: boolean | undefined };
type RecipientFieldProps = {
  people: Recipient[];
  value: Recipient[];
  onValueChange: (value: Recipient[]) => void;
  /** Addresses already in the envelope's other fields (Cc, Bcc): typing one exactly adds nothing, never moves it. */
  elsewhere?: Recipient[] | undefined;
  "aria-label"?: string | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The people a query finds, ranked, plus the typed address itself when it's new. */
function matchRecipients(people: Recipient[], value: Recipient[], query: string, elsewhere: Recipient[] = []): Recipient[] {
  const q = query.trim().toLowerCase();
  const chosen = new Set(value.map((p) => p.id));
  const toks = q.split(/\s+/).filter(Boolean);
  const words = (p: Recipient) => `${p.name} ${p.email} ${p.sub ?? ""}`.toLowerCase().split(/[\s.@·,()-]+/);
  /* an exact address always comes first, so Enter or comma never takes a longer one that starts with it */
  const rank = (p: Recipient) => (q && p.email.toLowerCase() === q ? -1 : !q || p.name.toLowerCase().startsWith(q) ? 0 : p.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(toks[0]!)) ? 1 : 2);
  const matches = people
    /* a typed address (or the start of one) finds its person as well as any word of their name does */
    .filter((p) => !chosen.has(p.id) && (p.email.toLowerCase().startsWith(q) || toks.every((t) => words(p).some((w) => w.startsWith(t)))))
    .map((p, i) => [p, rank(p), i] as const)
    .sort((a, b) => a[1] - b[1] || a[2] - b[2])
    .map((x) => x[0])
    .slice(0, toks.length ? 7 : 5);
  const known = people.some((p) => p.email.toLowerCase() === q) || value.some((p) => p.email.toLowerCase() === q);
  if (!EMAIL.test(q)) return matches;
  /* a whole address means that address: itself first (or as new), never a longer one that starts with it; already
     added means nothing to add */
  if ([...value, ...elsewhere].some((p) => p.email.toLowerCase() === q)) return [];
  const exact = matches.filter((p) => p.email.toLowerCase() === q);
  return known ? exact : [{ id: q, name: q, email: q }];
}

function RecipientField({ people, value, onValueChange, elsewhere, placeholder = "Add a name or address", className, ...aria }: RecipientFieldProps) {
  const portalContainer = usePortalContainer();
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const items = matchRecipients(people, value, query, elsewhere);

  return (
    <Base.Root
      multiple
      items={items}
      filter={null}
      value={value}
      onValueChange={(next) => {
        onValueChange(next as Recipient[]);
        setQuery("");
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringLabel={(p: Recipient) => p.name}
      isItemEqualToValue={(a: Recipient, b: Recipient) => a.id === b.id}
      autoHighlight
    >
      <Base.InputGroup data-slot="recipient-field" className={cn(fieldSurface, "flex min-h-9 cursor-text flex-wrap items-center gap-1.5 px-2 py-[5px]", className)}>
        <Base.Chips className="contents">
          {value.map((p) => (
            <Base.Chip
              key={p.id}
              title={p.fresh ? `${p.email || p.name} · new to this conversation` : p.email}
              aria-label={p.fresh ? `${p.name}, new to this conversation` : p.name}
              className={cn(
                "inline-flex h-6 items-center gap-1.5 rounded-full bg-[var(--ns-well)] px-1 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] shadow-[inset_0_0_0_1px_var(--ns-line-soft)] outline-hidden data-highlighted:shadow-[inset_0_0_0_1px_var(--ns-ink-2)] pointer-coarse:h-8",
                p.fresh && "bg-transparent shadow-none outline-1 -outline-offset-1 outline-[var(--ns-ink-3)] outline-dashed",
              )}
            >
              <Avatar name={p.name} src={p.src} hue={p.hue} size={18} />
              <span className="max-w-[180px] truncate">{p.name}</span>
              <Base.ChipRemove
                aria-label={`Remove ${p.name}`}
                className="grid size-[18px] cursor-pointer place-items-center rounded-full text-[var(--ns-ink-3)] hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] pointer-coarse:size-7"
              >
                <X className="size-3" aria-hidden />
              </Base.ChipRemove>
            </Base.Chip>
          ))}
          <Base.Input
            placeholder={value.length ? "" : placeholder}
            onKeyDown={(e) => {
              if (e.key !== "," || !q) return;
              e.preventDefault();
              const first = items[0];
              if (first) onValueChange([...value, first]);
              /* an address that's already added just clears the box */
              if (first || EMAIL.test(q.trim())) setQuery("");
            }}
            {...aria}
            className="h-6 min-w-24 flex-1 bg-transparent outline-hidden placeholder:text-[var(--ns-ink-3)] pointer-coarse:h-8"
          />
        </Base.Chips>
      </Base.InputGroup>
      <Base.Portal container={portalContainer}>
        <Base.Positioner sideOffset={4} collisionPadding={8} className={popupPositioner}>
          <Base.Popup data-slot="recipient-popup" data-ns-moves="" className={popupSurface}>
            <Base.Empty className={popupEmpty}>{q ? "No one matches. Type a full address to add it." : "Everyone is already added."}</Base.Empty>
            <Base.List>
              {(p: Recipient) => (
                <Base.Item key={p.id} value={p} className={popupItem}>
                  <Avatar name={p.name} src={p.src} hue={p.hue} size={20} />
                  {p.id === p.email && !people.some((x) => x.id === p.id) ? (
                    <span className="min-w-0 flex-1 truncate">
                      Send to <b className="font-[number:var(--ns-weight-medium)]">{p.email}</b>
                    </span>
                  ) : (
                    <span className="flex min-w-0 flex-1 flex-col gap-px py-0.5">
                      <span className="truncate font-[number:var(--ns-weight-medium)]">{p.name}</span>
                      <span className="truncate text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{[p.email !== p.name ? p.email : "", p.sub].filter(Boolean).join(" · ")}</span>
                    </span>
                  )}
                </Base.Item>
              )}
            </Base.List>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

export { RecipientField, matchRecipients, type Recipient, type RecipientFieldProps };
