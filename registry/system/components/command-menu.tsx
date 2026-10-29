// Notchset command-menu 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Dialog as Base } from "@base-ui/react/dialog";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReturnFocus } from "@/lib/notchset/return-focus";
import { scrim } from "@/components/ui/notchset/dialog";
import { KeyboardHint } from "@/components/ui/notchset/keyboard-hint";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Command menu: go anywhere or do anything by typing (⌘K). Results are grouped (Go to, Create, Companies), the
 * first match is chosen, arrows move, Enter runs it and closes. Each typed word matches the start of a word in a
 * label or its keywords. Nothing found says so, with what was typed; given `seeAll`, a last row always offers every
 * result on a page of its own.
 *
 * `anchor="search"` opens it where the app's search field is (the sidebar's, top left), with nothing dimmed: it is
 * a quick jump, not a step that stops the page. Without a sidebar it sits under the top bar.
 */
/** shortcut: the key that does the same outside the menu, printed as a chip so the menu teaches it */
type Command = { id: string; label: string; group: string; hint?: string | undefined; icon?: React.ReactNode; keywords?: string | undefined; shortcut?: string | string[] | undefined; run: () => void };
type CommandMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  /** Bind ⌘K / Ctrl K to open it. */
  shortcut?: boolean | undefined;
  placeholder?: string | undefined;
  /** "center" (a dimmed dialog, the default) or "search" (a popover over the sidebar's search field, nothing dimmed). */
  anchor?: "center" | "search" | undefined;
  /** Tab narrows the search to these groups (search tasks only); Backspace in an empty field widens it again. */
  scope?: { label: string; groups: string[] } | undefined;
  /** With a query, a last row that opens every result on its own page ("See all results for …"). */
  seeAll?: ((query: string) => Command) | undefined;
};

const at = {
  center:
    "top-[12vh] left-1/2 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 rounded-[var(--ns-radius-xl)] shadow-[0_0_0_1px_var(--ns-line),var(--ns-shadow-dialog)] [animation:ns-dialog-in_200ms_var(--ns-ease)] max-[600px]:top-2",
  search:
    "top-[50px] left-2 w-[min(440px,calc(100vw-16px))] origin-top-left rounded-[var(--ns-radius-lg)] shadow-[0_0_0_1px_var(--ns-line),var(--ns-shadow-float)] [animation:ns-menu-in_var(--ns-time-menu)_var(--ns-ease)] max-[960px]:top-[calc(var(--ns-header)+8px)] max-[960px]:right-[var(--ns-gutter)] max-[960px]:left-[var(--ns-gutter)] max-[960px]:mx-auto max-[960px]:w-auto max-[960px]:max-w-[640px] max-[960px]:origin-top max-[600px]:top-[calc(var(--ns-header)+52px)]",
} as const;

const LAYERS = ":is([data-slot=dialog],[data-slot=side-panel])[data-open]";
/* rendered and so focusable in sight (not display:none or visibility:hidden) */
const seen = (el: HTMLElement) => (typeof el.checkVisibility === "function" ? el.checkVisibility({ checkVisibilityCSS: true } as CheckVisibilityOptions) : el.getClientRects().length > 0);
function CommandMenu({ open, onOpenChange, commands, shortcut = true, placeholder = "Search or jump to…", anchor = "center", scope, seeAll }: CommandMenuProps) {
  const portalContainer = usePortalContainer();
  const returnFocus = useReturnFocus();
  /* the layers open when a command ran: only a layer that command opened is handed focus */
  const ranOver = React.useRef<Element[] | null>(null);
  /* what it was opened from, wherever that is, an open panel's own controls included: the last control focused or
     pressed while it was closed (the shared recorder ignores every layer, so it can't say this) */
  const opener = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (open) return;
    const note = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest || t.closest("[data-slot=command-menu]")) return;
      opener.current = t.closest<HTMLElement>("button,a[href],input,select,textarea,[tabindex]") ?? opener.current;
    };
    document.addEventListener("focusin", note, true);
    document.addEventListener("pointerdown", note, true);
    return () => {
      document.removeEventListener("focusin", note, true);
      document.removeEventListener("pointerdown", note, true);
    };
  }, [open]);
  React.useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut, open, onOpenChange]);

  return (
    <Base.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <Base.Portal container={portalContainer}>
        {/* over the sidebar it dims nothing; on a tablet or phone, where it covers the page, it dims like a dialog */}
        <Base.Backdrop className={cn(scrim, anchor === "search" && "min-[960px]:hidden")} />
        <Base.Popup
          data-slot="command-menu"
          data-ns-layer=""
          finalFocus={() => {
            /* a command that opened a dialog or panel hands focus to it; taking it back would leave the new layer
               without focus, and Enter would reach the page behind it. A panel that was already open (cancelling
               over it, or a command that changed its record) opened nothing: focus goes back as usual */
            const before = ranOver.current;
            ranOver.current = null;
            if (before && [...document.querySelectorAll(LAYERS)].some((x) => !before.includes(x))) return false;
            /* back to what it was opened from when that is still there and in sight: inside the top open layer, or
               somewhere that layer doesn't cover (a full-width phone panel covers the page behind it) */
            const layers = [...document.querySelectorAll<HTMLElement>(LAYERS)];
            const top = layers.at(-1);
            const covered = (el: HTMLElement) => {
              if (!top) return false;
              const a = el.getBoundingClientRect(), b = top.getBoundingClientRect();
              return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
            };
            const usable = (el: HTMLElement | null | undefined): el is HTMLElement => !!el && el.isConnected && seen(el) && (!top || top.contains(el) || !covered(el));
            if (usable(opener.current)) return opener.current;
            /* gone (the panel changed record): the first thing in sight inside that layer, else the layer itself */
            if (top) return [...top.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex='-1'])")].find(seen) ?? top;
            /* opened by its shortcut with nothing focused before: back to the search control it belongs to */
            const r = returnFocus();
            if (r !== true && seen(r)) return r;
            return [...document.querySelectorAll<HTMLElement>("[data-slot=sidebar-search],[data-ns-search]")].find((x) => x.offsetParent !== null) ?? true;
          }}
          data-ns-moves=""
          data-anchor={anchor}
          className={cn("fixed z-[41] overflow-hidden bg-[var(--ns-panel)] text-[var(--ns-ink)] outline-hidden data-ending-style:opacity-0 data-ending-style:[transition:opacity_140ms_ease]", at[anchor])}
        >
          <Base.Title className="sr-only">Command menu</Base.Title>
          <CommandSearch commands={commands} placeholder={placeholder} scope={scope} seeAll={seeAll} onRun={(c) => ((ranOver.current = [...document.querySelectorAll(LAYERS)]), onOpenChange(false), c.run())} />
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}

const PER_GROUP = 5;

/** The label with the start of each word a typed word matched drawn in ink weight, so you see why it's there. */
function marked(label: string, words: string[]) {
  if (!words.length) return label;
  return label.split(/([\p{L}\p{N}]+)/u).map((part, i) => {
    const w = words.filter((x) => part.toLowerCase().startsWith(x)).sort((a, b) => b.length - a.length)[0];
    return w ? (
      <React.Fragment key={i}>
        <mark className="bg-transparent font-[number:var(--ns-weight-strong)] text-[var(--ns-ink)]">{part.slice(0, w.length)}</mark>
        {part.slice(w.length)}
      </React.Fragment>
    ) : (
      part
    );
  });
}

/** The search and results. Mounted only while the menu is open, so every opening starts empty. */
function CommandSearch({ commands: all, placeholder, scope, seeAll, onRun }: { commands: Command[]; placeholder: string; scope?: CommandMenuProps["scope"]; seeAll?: CommandMenuProps["seeAll"]; onRun: (c: Command) => void }) {
  const [query, setQuery] = React.useState("");
  const [scoped, setScoped] = React.useState(false);
  const commands = scoped && scope ? all.filter((c) => scope.groups.includes(c.group)) : all;
  const [active, setActive] = React.useState(0);
  const listId = React.useId();

  // every typed word must start a word of the label or its keywords ("new d" finds New deal, not New task). The query
  // splits like the labels do, so "Q-1043" finds Q-1043. A group's name isn't searched: "quo" means the Quotes page,
  // not every quote. With a query, a group shows its best few; typing more narrows it.
  const split = (t: string) => t.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const words = split(query);
  const matched = commands.filter((c) => {
    const hay = split(`${c.label} ${c.keywords ?? ""}`);
    return words.every((w) => hay.some((h) => h.startsWith(w)));
  });
  const found = words.length ? matched.filter((c, i) => matched.slice(0, i).filter((x) => x.group === c.group).length < PER_GROUP) : matched;
  if (seeAll && words.length) found.push(seeAll(query.trim()));
  const groups = [...new Set(found.map((c) => c.group))];
  const ordered = groups.flatMap((g) => found.filter((c) => c.group === g));
  const current = ordered[Math.min(active, ordered.length - 1)];
  /* focus stays in the input, so the list follows the active option: the one Enter would run is always the one in view */
  const currentId = current ? `${listId}-${current.id}` : undefined;
  React.useEffect(() => {
    if (currentId) document.getElementById(currentId)?.scrollIntoView?.({ block: "nearest" });
  }, [currentId]);

  return (
    <>
      <div className="flex h-10 items-center gap-2 border-b border-[var(--ns-line-soft)] px-3 text-[var(--ns-ink-3)] pointer-coarse:h-12">
        <Search className="size-4 shrink-0" aria-hidden />
        {scoped && scope && <span className="inline-flex h-[22px] shrink-0 items-center rounded-[var(--ns-radius-sm)] bg-[var(--ns-selected)] px-1.5 text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{scope.label}</span>}
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={current ? `${listId}-${current.id}` : undefined}
          aria-label={placeholder}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            /* Enter or an arrow that confirms or moves an input method's candidate belongs to it, not the menu */
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (scope && e.key === "Tab" && !e.shiftKey && !scoped) {
              e.preventDefault();
              setScoped(true);
              setActive(0);
              return;
            }
            if (scope && e.key === "Backspace" && scoped && !query) {
              e.preventDefault();
              setScoped(false);
              setActive(0);
              return;
            }
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, ordered.length - 1));
            else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            else if (e.key === "Enter" && current) onRun(current);
            else return;
            e.preventDefault();
          }}
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--ns-ink)] outline-hidden placeholder:text-[var(--ns-ink-3)] pointer-coarse:text-[16px]"
        />
      </div>
      <div id={listId} role="listbox" aria-label="Results" className="max-h-[min(380px,60vh)] overflow-auto overscroll-contain p-1">
        {ordered.length === 0 && !seeAll && <div className="px-2 py-3 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">Nothing matches “{query.trim()}”.</div>}
        {groups.map((g) => (
          <div key={g} role="group" aria-label={g}>
            <div aria-hidden className="px-2 pt-2 pb-1 text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-3)]">{g}</div>
            {ordered
              .filter((c) => c.group === g)
              .map((c) => (
                <div
                  key={c.id}
                  id={`${listId}-${c.id}`}
                  role="option"
                  aria-selected={c === current}
                  aria-label={c.hint ? `${c.label}, ${c.hint}` : c.label}
                  onMouseMove={() => setActive(ordered.indexOf(c))}
                  onClick={() => onRun(c)}
                  className={cn(
                    "flex min-h-8 cursor-pointer items-center gap-[9px] rounded-[7px] px-2 py-1 text-[length:var(--ns-text-body)] pointer-coarse:min-h-11 [&_svg:not([data-slot=company-mark])]:size-3.5 [&_svg]:shrink-0 [&_svg:not([data-slot=company-mark])]:text-[var(--ns-ink-3)]",
                    c === current && "bg-[var(--ns-selected)]",
                  )}
                >
                  {c.icon}
                  <span className="shrink-0">{marked(c.label, words)}</span>
                  {c.hint && <span className="ml-auto min-w-0 truncate pl-3 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{c.hint}</span>}
                  {c.shortcut && <KeyboardHint keys={c.shortcut} className={cn("shrink-0", !c.hint && "ml-auto")} />}
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 border-t border-[var(--ns-line-soft)] px-3.5 py-2.5 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] pointer-coarse:hidden">
        <KeyboardHint keys={["↑", "↓"]} />
        <span className="mr-2">to move</span>
        <KeyboardHint keys="↵" />
        <span className="mr-2">to open</span>
        <KeyboardHint keys="Esc" />
        <span className={scope ? "mr-2" : undefined}>to close</span>
        {scope && (
          <>
            <KeyboardHint keys={scoped ? "⌫" : "Tab"} />
            <span>{scoped ? "to search everything" : `to search ${scope.label.toLowerCase()} only`}</span>
          </>
        )}
      </div>
    </>
  );
}

export { CommandMenu, type Command, type CommandMenuProps };
