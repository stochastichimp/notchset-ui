// Notchset explain 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Popover } from "@base-ui/react/popover";
import { BookOpen, CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { popupPositioner, popupSurface } from "@/lib/notchset/popup";
import { usePortalContainer } from "@/lib/notchset/portal";
import { useReturnFocus } from "@/lib/notchset/return-focus";

/*
 * Explain: "What is this?" where the word is. A quiet ? beside a hard term (Commit, Weighted pipeline, Velocity)
 * opens two sentences on what it means, what counts and what doesn't, and one link to more in Help. A popover on
 * a desktop, the standard bottom sheet on a phone. It opens on press, Enter or Space; Escape or a press outside
 * closes it and focus goes back to the ?.
 *
 * The words come from one glossary the app configures, so a term reads the same on every page:
 *
 *   <GlossaryProvider glossary={{ commit: { means: "Deals their owner is confident will close this quarter.", counts: "Open deals marked Commit", not: "Best case, pipeline, won", more: { label: "Forecast categories in Help", href: "/help/forecast" } } }}>
 *     Commit <Explain term="Commit" />
 *
 * Props given on the Explain win over the glossary's entry.
 */

export type GlossaryEntry = {
  /** What it means, in one or two sentences. */
  means: React.ReactNode;
  /** What is counted in it. */
  counts?: React.ReactNode;
  /** What is easily mistaken for it but isn't counted. */
  not?: React.ReactNode;
  /** One way to read more: a Help page. */
  more?: { label: string; href?: string | undefined; onClick?: (() => void) | undefined } | undefined;
};
/** The app's glossary, keyed by a term's id (lower case: "commit", "weighted-pipeline"). */
export type Glossary = Readonly<Record<string, GlossaryEntry>>;

const GlossaryContext = React.createContext<Glossary>({});

function GlossaryProvider({ glossary, children }: { glossary: Glossary; children: React.ReactNode }) {
  return <GlossaryContext.Provider value={glossary}>{children}</GlossaryContext.Provider>;
}

const idOf = (term: string) => term.trim().toLowerCase().replace(/\s+/g, "-");

type ExplainProps = Partial<GlossaryEntry> & {
  /** The term as the page writes it ("Commit"); names the ? for screen readers ("What is Commit?"). */
  term: string;
  /** The glossary key, when it isn't the term in lower case with dashes. */
  id?: string | undefined;
  /** Also write the term before the ?, for a label that has no text of its own. */
  showTerm?: boolean | undefined;
  align?: "start" | "center" | "end" | undefined;
  className?: string | undefined;
};

function Explain({ term, id, showTerm = false, means, counts, not, more, align = "start", className }: ExplainProps) {
  const glossary = React.useContext(GlossaryContext);
  const portalContainer = usePortalContainer();
  const returnFocus = useReturnFocus();
  const entry = glossary[id ?? idOf(term)];
  const m = means ?? entry?.means;
  const c = counts ?? entry?.counts;
  const n = not ?? entry?.not;
  const link = more ?? entry?.more;
  /* nothing to say: no ? at all, rather than one that opens empty */
  if (!m) return showTerm ? <span className={className}>{term}</span> : null;
  return (
    <span data-slot="explain" className={cn("inline-flex items-center gap-1 align-middle", className)}>
      {showTerm && <span>{term}</span>}
      <Popover.Root>
        <Popover.Trigger
          aria-label={`What is ${term}?`}
          className="-m-0.5 inline-grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-[var(--ns-ink-3)] outline-hidden [transition:color_var(--ns-time-color)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] data-popup-open:text-[var(--ns-ink)] pointer-coarse:m-0 pointer-coarse:size-8 [&_svg]:size-3.5"
        >
          <CircleHelp aria-hidden />
        </Popover.Trigger>
        <Popover.Portal container={portalContainer}>
          <Popover.Positioner side="bottom" align={align} sideOffset={6} collisionPadding={8} className={popupPositioner}>
            <Popover.Popup data-slot="explain-popup" data-ns-layer="" data-ns-moves="" finalFocus={returnFocus} className={cn(popupSurface, "w-[min(300px,calc(100vw-16px))] !p-3.5 max-[600px]:w-auto max-[600px]:!px-4 max-[600px]:!pt-6 max-[600px]:!pb-4")}>
              <div className="flex flex-col gap-2">
                <Popover.Title className="m-0 font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-strong)] text-[var(--ns-ink)]">{term}</Popover.Title>
                <Popover.Description className="m-0 text-pretty text-[var(--ns-ink-2)]">{m}</Popover.Description>
                {(c || n) && (
                  <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-[var(--ns-line-soft)] pt-2 text-[length:var(--ns-text-small)]">
                    {c && (
                      <>
                        <dt className="text-[var(--ns-ink-3)]">Counts</dt>
                        <dd className="m-0">{c}</dd>
                      </>
                    )}
                    {n && (
                      <>
                        <dt className="text-[var(--ns-ink-3)]">Not</dt>
                        <dd className="m-0">{n}</dd>
                      </>
                    )}
                  </dl>
                )}
                {link && (
                  <a
                    href={link.href ?? "#"}
                    onClick={
                      link.onClick
                        ? (e) => {
                            e.preventDefault();
                            link.onClick!();
                          }
                        : undefined
                    }
                    className="inline-flex items-center gap-1.5 self-start pt-1 text-[length:var(--ns-text-small)] text-[var(--ns-ink)] underline decoration-[var(--ns-line)] underline-offset-4 outline-hidden hover:decoration-[var(--ns-ink-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] [&_svg]:size-3.5 [&_svg]:text-[var(--ns-ink-3)]"
                  >
                    <BookOpen aria-hidden />
                    {link.label}
                  </a>
                )}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </span>
  );
}

export { Explain, GlossaryProvider, type ExplainProps };
