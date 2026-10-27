// Notchset settings-layout 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchField } from "@/components/ui/notchset/search-field";
import { useMoreToRight } from "@/components/ui/notchset/tabs";

/*
 * Settings (block 40): a list of sections beside the one that's open. Each section is groups of rows: what
 * the setting is and what it does on the left, its control on the right, taking effect the moment it changes.
 * The open section is raised in the list (as the sidebar's page is) and reads in a column of about 780px.
 * On a phone Settings opens as the list of its sections; a section opens on its own, with a way back. Sections
 * can be grouped (Workspace, Developers): a quiet heading starts each group, on a phone as on a desktop. The
 * open section's header is its title, an optional line under it and its one action at the right (Invite people):
 * the same anatomy in every template (APP-RULES 227). With `find`, "Find a setting" tops the list: it matches what
 * each setting does, and the matches replace the open section until the field is cleared or one is chosen.
 */
type NavItem = { key: string; label: string; href: string; /** The group it starts or belongs to; a heading shows where it changes. */ group?: string | undefined };
/** One setting "Find a setting" can reach: its name, the section it's in, what it does, and words people search for. */
type SettingsFindItem = { key: string; label: string; where: string; about: string; words?: string | undefined; href: string };
type SettingsLayoutProps = {
  nav: NavItem[];
  current: string;
  /** On a phone: whether a section was chosen (else the list shows). */
  picked: boolean;
  backHref: string;
  title: React.ReactNode;
  /** One line under the title: what the section holds, or what changed ("8 people · 2 changes this week"). */
  description?: React.ReactNode;
  /** The section's one action at the title's right (Invite people); it wraps under the title on a phone. */
  actions?: React.ReactNode;
  /** Every setting "Find a setting" reaches; without it there's no search. */
  find?: SettingsFindItem[] | undefined;
  children: React.ReactNode;
  className?: string | undefined;
};

/** The settings content column's one width (APP-RULES 227): every section, tab and template reads at it. */
const SETTINGS_COLUMN = "max-w-[780px]";

function SettingsLayout({ nav, current, picked, backHref, title, description, actions, find, children, className }: SettingsLayoutProps) {
  const [q, setQ] = React.useState("");
  const needle = q.trim().toLowerCase();
  const found = find && needle ? find.filter((x) => `${x.where} ${x.label} ${x.words ?? ""} ${x.about}`.toLowerCase().includes(needle)) : [];
  const finding = !!needle;
  return (
    <div data-slot="settings-layout" className={cn("grid min-h-full grid-cols-[220px_minmax(0,1fr)] max-[600px]:block", className)}>
      <nav aria-label="Settings" className={cn("flex flex-col gap-0.5 border-r border-[var(--ns-line-soft)] p-3 max-[600px]:border-0 max-[600px]:p-0", picked && !finding && "max-[600px]:hidden")}>
        {find && (
          <div className="pb-2 max-[600px]:px-[var(--ns-gutter)] max-[600px]:pt-3">
            <SearchField size="dense" aria-label="Find a setting" placeholder="Find a setting" value={q} onValueChange={setQ} className="w-full" />
          </div>
        )}
        {!finding && nav.map((n, i) => (
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
      {finding ? (
        <div className={cn("box-content flex min-w-0 flex-col px-[var(--ns-gutter)] pt-6 pb-16 max-[600px]:pt-2", SETTINGS_COLUMN)}>
          <p aria-live="polite" className="m-0 px-3 pb-2 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">
            {found.length ? `${found.length} ${found.length === 1 ? "setting" : "settings"} for “${q.trim()}”` : `No setting matches “${q.trim()}”.`}
          </p>
          <ul className="m-0 flex list-none flex-col p-0" aria-label="Matching settings">
            {found.map((x) => (
              <li key={x.key}>
                <a href={x.href} onClick={() => setQ("")} className="flex min-h-12 flex-col justify-center gap-0.5 rounded-[var(--ns-radius)] px-3 py-2 text-[var(--ns-ink)] no-underline outline-hidden hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]">
                  <span className="flex items-baseline gap-1.5">
                    <b className="font-[number:var(--ns-weight-medium)]">{x.label}</b>
                    <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">in {x.where}</span>
                  </span>
                  <span className="text-[length:var(--ns-text-small)] text-[var(--ns-ink-2)]">{x.about}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
      <div className={cn("box-content flex min-w-0 flex-col gap-5 px-[var(--ns-gutter)] pt-6 pb-16", SETTINGS_COLUMN, !picked && "max-[600px]:hidden")}>
        <a href={backHref} className="-ml-1 hidden h-9 items-center gap-1 self-start rounded-[var(--ns-radius)] px-1 text-[var(--ns-ink-2)] no-underline outline-hidden focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)] max-[600px]:inline-flex">
          <ChevronLeft aria-hidden className="size-4" />
          Settings
        </a>
        <header data-slot="settings-header" className="flex flex-wrap items-start gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
            <h1 className="m-0 font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-page)] font-[number:var(--ns-weight-strong)] tracking-[var(--ns-tracking-display)]">{title}</h1>
            {description && <p className="m-0 max-w-[60ch] text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
        {children}
      </div>
      )}
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

export { SettingsGroup, SettingsLayout, SettingsNote, SettingsRow, SettingsTabs, type NavItem as SettingsNavItem, type SettingsFindItem, type SettingsLayoutProps, type SettingsRowProps };
