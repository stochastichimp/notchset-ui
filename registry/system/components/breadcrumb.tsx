// Notchset breadcrumb 2.0.0 · https://notchset.dev/changelog
"use client";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Breadcrumb and back: where this page sits, said once in the top bar. Parents are quiet links; the current
 * page is the title. On a phone the parents give way to one Back button to the nearest parent, so the bar
 * never wraps. Back works on its own too (a record opened from a list).
 */
type Crumb = { label: string; href?: string | undefined; onClick?: (() => void) | undefined };
type BreadcrumbProps = { parents: Crumb[]; current: string; className?: string | undefined };

const link =
  "rounded-[5px] text-[var(--ns-ink-3)] no-underline outline-hidden [transition:color_var(--ns-time-color)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]";

function CrumbLink({ crumb, className }: { crumb: Crumb; className?: string | undefined }) {
  return crumb.href ? (
    <a href={crumb.href} onClick={crumb.onClick} className={cn(link, className)}>
      {crumb.label}
    </a>
  ) : (
    <button type="button" onClick={crumb.onClick} className={cn(link, "cursor-pointer", className)}>
      {crumb.label}
    </button>
  );
}

function Breadcrumb({ parents, current, className }: BreadcrumbProps) {
  const up = parents.at(-1);
  return (
    <nav aria-label="Breadcrumb" data-slot="breadcrumb" className={cn("flex min-w-0 items-center gap-2", className)}>
      {up && <BackButton label={up.label} onClick={up.onClick} href={up.href} className="min-[600px]:hidden" />}
      <ol className="m-0 flex min-w-0 list-none items-center gap-2 p-0 text-[14.5px] leading-none font-[number:var(--ns-weight-strong)] tracking-[-0.01em]">
        {parents.map((c) => (
          <li key={c.label} className="flex items-center gap-2 max-[600px]:hidden">
            <CrumbLink crumb={c} />
            <span aria-hidden className="text-[var(--ns-ink-3)]">/</span>
          </li>
        ))}
        <li aria-current="page" className="min-w-0 truncate text-[var(--ns-ink)]">
          {current}
        </li>
      </ol>
    </nav>
  );
}

type BackButtonProps = { label: string; onClick?: (() => void) | undefined; href?: string | undefined; className?: string | undefined };

function BackButton({ label, onClick, href, className }: BackButtonProps) {
  const cls = cn(
    "-ml-1.5 inline-flex h-[var(--ns-control-sm)] cursor-pointer items-center gap-0.5 rounded-[7px] pr-2 pl-1 text-[length:var(--ns-text-body)] leading-none font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-2)] no-underline outline-hidden hover:bg-[var(--ns-hover)] hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]",
    className,
  );
  const body = (
    <>
      <ChevronLeft className="size-4" aria-hidden />
      {label}
    </>
  );
  return href ? (
    <a href={href} onClick={onClick} aria-label={`Back to ${label}`} data-slot="back" className={cls}>
      {body}
    </a>
  ) : (
    <button type="button" onClick={onClick} aria-label={`Back to ${label}`} data-slot="back" className={cls}>
      {body}
    </button>
  );
}

export { BackButton, Breadcrumb, type BreadcrumbProps, type Crumb };
