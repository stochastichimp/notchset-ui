// Notchset person-card 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { PreviewCard as Base } from "@base-ui/react/preview-card";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/notchset/avatar";
import { usePortalContainer } from "@/lib/notchset/portal";

/*
 * Person card: who someone is, on hover or focus of their name or face, without leaving the page: their role and
 * team, the time where they are, and what they have open. The trigger is a link to their page, so a touch (which
 * has no hover) goes straight there, where the same facts are. Read-only: it never holds an action that isn't also
 * on that page.
 *
 *   <PersonCard name="Maya Lindqvist" role="Engineering lead" href="#/person/maya" facts={[["Open", "12"]]}>
 *     <Avatar name="Maya Lindqvist" size={20} />
 *   </PersonCard>
 */
type PersonCardProps = {
  name: string;
  role?: string | undefined;
  /** where their page is; the trigger is this link */
  href: string;
  /** the face on the card; defaults to their initials */
  avatar?: React.ReactNode;
  /** a line under the role: a team, "Invited", "Deactivated" */
  line?: React.ReactNode;
  /** short facts, label then value, in a row of up to three */
  facts?: [string, React.ReactNode][] | undefined;
  /** the trigger's content: a face, a name, or both */
  children: React.ReactNode;
  /** the trigger's own classes (it is an inline link) */
  className?: string | undefined;
};

function PersonCard({ name, role, href, avatar, line, facts = [], children, className }: PersonCardProps) {
  const portalContainer = usePortalContainer();
  return (
    <Base.Root>
      <Base.Trigger
        data-slot="person-card"
        href={href}
        aria-label={name}
        onClick={(e) => e.stopPropagation()}
        className={cn("inline-flex min-w-0 items-center gap-1.5 rounded-full text-inherit no-underline outline-hidden focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ns-signal)]", className)}
      >
        {children}
      </Base.Trigger>
      <Base.Portal container={portalContainer}>
        <Base.Positioner side="bottom" align="start" sideOffset={8} collisionPadding={8} className="z-[70]">
          <Base.Popup
            data-slot="person-card-popup"
            data-ns-layer=""
            className="w-[260px] rounded-[var(--ns-radius-lg)] bg-[var(--ns-raised)] p-3.5 text-[length:var(--ns-text-body)] text-[var(--ns-ink)] shadow-[0_0_0_1px_var(--ns-line),var(--ns-shadow-float)] outline-hidden [transition:opacity_140ms,transform_140ms_var(--ns-ease)] data-starting-style:-translate-y-0.5 data-starting-style:opacity-0 data-ending-style:opacity-0"
          >
            <div className="flex items-center gap-3">
              {avatar ?? <Avatar name={name} size={40} />}
              <div className="flex min-w-0 flex-col">
                <b className="truncate font-[number:var(--ns-weight-strong)]">{name}</b>
                {role && <span className="truncate text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">{role}</span>}
                {line && <span className="truncate text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">{line}</span>}
              </div>
            </div>
            {facts.length > 0 && (
              <dl className="m-0 mt-3 grid grid-cols-3 gap-2 border-t border-[var(--ns-line-soft)] pt-3">
                {facts.slice(0, 3).map(([k, v]) => (
                  <div key={k} className="flex min-w-0 flex-col gap-0.5">
                    <dt className="truncate text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">{k}</dt>
                    <dd className="m-0 truncate font-[number:var(--ns-weight-medium)] tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

export { PersonCard, type PersonCardProps };
