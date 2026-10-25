// Notchset card 2.0.0 · https://notchset.dev/changelog
import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Card: a section of a page on the panel surface, 12px corners and a hairline. Its header says what it holds, a
 * quiet count, and at most one link to the page it summarises ("Pipeline ↗"). A footer sits at the bottom edge.
 */
function Card({ className, children, ...props }: React.ComponentPropsWithoutRef<"section">) {
  return (
    <section data-slot="card" className={cn("flex min-w-0 flex-col rounded-[var(--ns-radius-lg)] bg-[var(--ns-panel)] shadow-[0_0_0_1px_var(--ns-line),0_1px_2px_rgba(0,0,0,.06)]", className)} {...props}>
      {children}
    </section>
  );
}

type CardHeaderProps = { title: React.ReactNode; count?: React.ReactNode; link?: { label: string; href: string } | undefined; aside?: React.ReactNode; className?: string | undefined };

function CardHeader({ title, count, link, aside, className }: CardHeaderProps) {
  return (
    <header data-slot="card-header" className={cn("flex min-h-11 shrink-0 flex-wrap items-center gap-x-2 gap-y-0.5 border-b py-2 border-[var(--ns-line-soft)] px-4 font-[number:var(--ns-weight-medium)]", className)}>
      <h2 className="m-0 text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-medium)]">{title}</h2>
      {count !== undefined && <span className="text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-3)] tabular-nums">{count}</span>}
      {aside && <span className="ml-auto text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-regular)] text-[var(--ns-ink-3)]">{aside}</span>}
      {link && (
        <a href={link.href} className="ml-auto flex items-center gap-1 rounded-[5px] text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-regular)] text-[var(--ns-ink-3)] no-underline outline-hidden hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]">
          {link.label}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      )}
    </header>
  );
}

function CardFooter({ className, children }: { className?: string | undefined; children: React.ReactNode }) {
  return <footer data-slot="card-footer" className={cn("mt-auto flex min-h-[var(--ns-header)] shrink-0 flex-wrap items-center gap-x-7 gap-y-1 border-t py-2 border-[var(--ns-line-soft)] px-4 text-[length:var(--ns-text-small)] text-[var(--ns-ink-3)]", className)}>{children}</footer>;
}

export { Card, CardFooter, CardHeader };
