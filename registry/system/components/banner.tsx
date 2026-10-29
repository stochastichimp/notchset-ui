// Notchset banner 2.1.0 · https://notchset.dev/changelog
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Banner: something about this page the reader should know before acting ("Close date passed 3 days ago").
 * Bold fact first, then the detail, then at most one action that fixes it. Tone tints the well and the icon;
 * the words carry the meaning. Not a live region: a banner is there when the page arrives, not announced.
 * The card layout is for a record's own status (a quote waiting on Finance): a raised card, the fact on one line
 * and the detail under it, its buttons on their own row on a phone so the words keep their width.
 */
const cardTones = {
  neutral: "bg-[var(--ns-panel)] shadow-[inset_0_0_0_1px_var(--ns-line)] [&>svg]:text-[var(--ns-ink-3)]",
  warn: "bg-[var(--ns-panel)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ns-warn)_45%,var(--ns-line))] [&>svg]:text-[var(--ns-warn)]",
  ok: "bg-[var(--ns-panel)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ns-ok)_45%,var(--ns-line))] [&>svg]:text-[var(--ns-ok)]",
  bad: "bg-[var(--ns-panel)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ns-bad)_45%,var(--ns-line))] [&>svg]:text-[var(--ns-bad-ink)]",
} as const;
const tones = {
  neutral: "bg-[var(--ns-well)] shadow-[inset_0_0_0_1px_var(--ns-line)]",
  warn: "bg-[color-mix(in_oklab,var(--ns-warn)_8%,var(--ns-well))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ns-warn)_25%,transparent)] [&>svg]:text-[var(--ns-warn)]",
  ok: "bg-[color-mix(in_oklab,var(--ns-ok)_8%,var(--ns-well))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ns-ok)_25%,transparent)] [&>svg]:text-[var(--ns-ok)]",
  bad: "bg-[color-mix(in_oklab,var(--ns-bad)_7%,var(--ns-well))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ns-bad)_25%,transparent)] [&>svg]:text-[var(--ns-bad-ink)]",
} as const;

type BannerProps = Omit<React.ComponentPropsWithoutRef<"div">, "title"> & {
  tone?: keyof typeof tones | undefined;
  icon?: React.ReactNode;
  title: React.ReactNode;
  /** The one action that fixes what the banner says. */
  action?: { label: string; onClick: () => void } | undefined;
  /** When it takes a decision rather than one fix (Deny · Approve): the system's own buttons, at the end. */
  actions?: React.ReactNode;
  layout?: "bar" | "card" | undefined;
};

function Banner({ tone = "neutral", icon, title, action, actions, layout = "bar", className, children, ...props }: BannerProps) {
  if (layout === "card")
    return (
      <div
        data-slot="banner"
        data-tone={tone}
        data-layout="card"
        className={cn("flex flex-wrap items-start gap-x-3 gap-y-2.5 rounded-[var(--ns-radius-lg)] px-4 py-3 text-[length:var(--ns-text-body)] text-[var(--ns-ink-2)] [&>svg]:mt-[3px] [&>svg]:size-3.5 [&>svg]:shrink-0", cardTones[tone], className)}
        {...props}
      >
        {icon}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <b className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{title}</b>
          {children ? <span className="text-[length:var(--ns-text-small)]">{children}</span> : null}
        </span>
        {(actions || action) && (
          <span className="flex shrink-0 items-center gap-2 self-center max-[600px]:basis-full max-[600px]:pl-[26px]">
            {actions ?? <button type="button" onClick={action!.onClick} className="h-[30px] cursor-pointer rounded-[var(--ns-radius)] bg-[var(--ns-raised)] px-3 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] shadow-[var(--ns-bezel)] outline-hidden hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] pointer-coarse:h-9">{action!.label}</button>}
          </span>
        )}
      </div>
    );
  return (
    <div
      data-slot="banner"
      data-tone={tone}
      className={cn(
        "flex flex-wrap items-center gap-2.5 rounded-[10px] py-[9px] pr-2.5 pl-3 text-[length:var(--ns-text-body)] text-[var(--ns-ink-2)] [&>svg]:size-3.5 [&>svg]:shrink-0",
        tones[tone],
        className,
      )}
      {...props}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <b className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{title}</b>
        {children ? <> · {children}</> : null}
      </span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="h-[26px] shrink-0 cursor-pointer rounded-[7px] bg-[var(--ns-raised)] px-2.5 text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)] shadow-[var(--ns-bezel)] outline-hidden [transition:background-color_var(--ns-time-color)] hover:bg-[var(--ns-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-signal)] max-[960px]:h-9 pointer-coarse:h-9"
        >
          {action.label}
        </button>
      )}
      {actions && <span className="flex shrink-0 items-center gap-2">{actions}</span>}
    </div>
  );
}

export { Banner, type BannerProps };
