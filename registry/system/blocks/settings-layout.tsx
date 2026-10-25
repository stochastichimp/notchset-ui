// Notchset settings-layout 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMoreToRight } from "@/components/ui/notchset/tabs";

/*
 * Settings (block 40): a list of sections beside the one that's open. Each section is groups of rows: what
 * the setting is and what it does on the left, its control on the right, taking effect the moment it changes.
 * The open section is raised in the list (as the sidebar's page is) and reads in a column of about 780px.
 * On a phone Settings opens as the list of its sections; a section opens on its own, with a way back. Sections
 * can be grouped (Workspace, Developers): a quiet heading starts each group, on a phone as on a desktop.
 */
type NavItem = { key: string; label: string; href: string; /** The group it starts or belongs to; a heading shows where it changes. */ group?: string | undefined };
type SettingsLayoutProps = {
  nav: NavItem[];
  current: string;
  /** On a phone: whether a section was chosen (else the list shows). */
  picked: boolean;
  backHref: string;
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string | undefined;
};

function SettingsLayout({ nav, current, picked, backHref, title, children, className }: SettingsLayoutProps) {
  return (
    <div data-slot="settings-layout" className={cn("grid min-h-full grid-cols-[220px_minmax(0,1fr)] max-[600px]:block", className)}>
      <nav aria-label="Settings" className={cn("flex flex-col gap-0.5 border-r border-[var(--ns-line-soft)] p-3 max-[600px]:border-0 max-[600px]:p-0", picked && "max-[600px]:hidden")}>
        {nav.map((n, i) => (
          <React.Fragment key={n.key}>
            {n.group && n.group !== nav[i - 1]?.group && (
              <span className="px-2.5 pt-3 pb-1 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] first:pt-0 max-[600px]:px-[var(--ns-gutter)] max-[600px]:pt-5 max-[600px]:pb-1.5 max-[600px]:first:pt-3">{n.group}</span>
            )}
            <a
              href={n.href}
              aria-current={n.key === current ? "page" : undefined}
              className={cn(
                "flex h-[34px] items-center rounded-[var(--ns-radius)] px-2.5 text-[var(--ns-ink-2)] no-underline outline-hidden hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]",
                "aria-[current=page]:bg-[var(--ns-raised)] aria-[current=page]:text-[var(--ns-ink)] aria-[current=page]:shadow-[var(--ns-bezel)] aria-[current=page]:hover:bg-[var(--ns-raised)]",
                "max-[600px]:h-[52px] max-[600px]:rounded-none max-[600px]:border-b max-[600px]:border-[var(--ns-line-soft)] max-[600px]:px-[var(--ns-gutter)] max-[600px]:text-[length:var(--ns-text-strong)] max-[600px]:text-[var(--ns-ink)] max-[600px]:aria-[current=page]:bg-transparent max-[600px]:aria-[current=page]:shadow-none",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{n.label}</span>
              <ChevronRight aria-hidden className="hidden size-3.5 text-[var(--ns-ink-3)] max-[600px]:block" />
            </a>
          </React.Fragment>
        ))}
      </nav>
      <div className={cn("box-content flex max-w-[780px] min-w-0 flex-col gap-5 px-[var(--ns-gutter)] pt-6 pb-16", !picked && "max-[600px]:hidden")}>
        <a href={backHref} className="-ml-1 hidden h-9 items-center gap-1 self-start rounded-[var(--ns-radius)] px-1 text-[var(--ns-ink-2)] no-underline outline-hidden focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] max-[600px]:inline-flex">
          <ChevronLeft aria-hidden className="size-4" />
          Settings
        </a>
        <h1 className="m-0 font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-page)] font-[number:var(--ns-weight-strong)] tracking-[var(--ns-tracking-display)]">{title}</h1>
        {children}
      </div>
    </div>
  );
}

/** Sub-sections of one section, as links under its title (Overview · Seats · Invoices). */
type SettingsTabsProps = { items: (NavItem & { count?: number | undefined })[]; current: string; label: string; className?: string | undefined };
function SettingsTabs({ items, current, label, className }: SettingsTabsProps) {
  const strip = React.useRef<HTMLElement>(null);
  const more = useMoreToRight(strip);
  return (
    <nav ref={strip} aria-label={label} data-more={more || undefined} className={cn("-mt-2 flex gap-1 overflow-x-auto border-b border-[var(--ns-line-soft)] [scrollbar-width:none] max-[960px]:data-more:[mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)]", className)}>
      {items.map((t) => (
        <a
          key={t.key}
          href={t.href}
          aria-current={t.key === current ? "page" : undefined}
          className="relative flex h-10 shrink-0 items-center gap-1.5 px-2.5 text-[var(--ns-ink-3)] no-underline outline-hidden hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ns-signal)] aria-[current=page]:text-[var(--ns-ink)] aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-1.5 aria-[current=page]:after:-bottom-px aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-[var(--ns-ink)] aria-[current=page]:after:content-['']"
        >
          {t.label}
          {t.count != null && <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">{t.count}</span>}
        </a>
      ))}
    </nav>
  );
}

type SettingsGroupProps = { title?: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string | undefined };
function SettingsGroup({ title, hint, children, className }: SettingsGroupProps) {
  return (
    <section data-slot="settings-group" className={cn("flex flex-col", className)}>
      {(title || hint) && (
        <header className="flex max-w-[60ch] flex-col gap-0.5 pb-1">
          {title && <h2 className="m-0 text-[length:var(--ns-text-strong)] font-[number:var(--ns-weight-strong)]">{title}</h2>}
          {hint && <p className="m-0 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">{hint}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

type SettingsRowProps = { label: React.ReactNode; hint?: React.ReactNode; lead?: React.ReactNode; children?: React.ReactNode; className?: string | undefined };
/** One setting: what it is and what it does, then its control. The hint says the current effect, not a manual. */
function SettingsRow({ label, hint, lead, children, className }: SettingsRowProps) {
  return (
    <div data-slot="settings-row" className={cn("flex min-h-16 items-center gap-4 border-b border-[var(--ns-line-soft)] py-3 max-[600px]:flex-wrap max-[600px]:gap-y-2.5", className)}>
      {lead}
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
        <span className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{label}</span>
        {hint && <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)] [overflow-wrap:anywhere]">{hint}</span>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2 max-[600px]:ml-auto">{children}</div>}
    </div>
  );
}

/** A quiet line of context under or above a group ("Stage names come from the app config"). */
function SettingsNote({ icon, children, className }: { icon?: React.ReactNode; children: React.ReactNode; className?: string | undefined }) {
  return (
    <p className={cn("m-0 flex items-start gap-2 pt-3 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)] [&>svg]:mt-0.5 [&>svg]:size-3.5 [&>svg]:shrink-0", className)}>
      {icon}
      <span>{children}</span>
    </p>
  );
}

export { SettingsGroup, SettingsLayout, SettingsNote, SettingsRow, SettingsTabs, type NavItem as SettingsNavItem, type SettingsLayoutProps, type SettingsRowProps };
