// Notchset tabs 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Tabs as Base } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

/*
 * Tabs: the saved slices of one list (All 17 · Mine 3 · Closing in Q4 7). The chosen tab is raised; a count
 * sits beside each label. Arrow keys move between tabs. When there are more tabs than room, the strip scrolls
 * sideways and fades at the edge instead of wrapping, only while more tabs lie past that edge (useMoreToRight).
 * Pair with TabPanel when tabs swap content; for tabs that filter a table in place, the list alone is enough.
 */

/** True while a sideways-scrolling strip has content past its right edge: the end fade shows only then, so the last
    tab, scrolled to or one that fits, is never faded. Rechecked on scroll, resize and every render. */
function useMoreToRight(ref: React.RefObject<HTMLElement | null>) {
  const [more, setMore] = React.useState(false);
  const check = React.useCallback(() => {
    const el = ref.current;
    if (el) setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, [ref]);
  React.useEffect(check);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", check, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro?.disconnect();
    };
  }, [ref, check]);
  return more;
}
type TabItem<V extends string> = { value: V; label: React.ReactNode; count?: number | undefined; icon?: React.ReactNode };
type TabsProps<V extends string> = {
  tabs: TabItem<V>[];
  value: V;
  onValueChange: (value: V) => void;
  /** Names the tab list for screen readers ("Company views"). */
  label: string;
  children?: React.ReactNode;
  className?: string | undefined;
};

function Tabs<V extends string>({ tabs, value, onValueChange, label, children, className }: TabsProps<V>) {
  const strip = React.useRef<HTMLDivElement>(null);
  const more = useMoreToRight(strip);
  return (
    <Base.Root value={value} onValueChange={(v) => onValueChange(v as V)} className={cn("min-w-0", className)}>
      <Base.List
        ref={strip}
        aria-label={label}
        data-slot="tabs"
        data-more={more || undefined}
        className="flex min-w-0 gap-0.5 overflow-x-auto [scrollbar-width:none] max-[960px]:data-more:[mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => (
          <Base.Tab
            key={t.value}
            value={t.value}
            className={cn(
              "inline-flex h-[var(--ns-control-sm)] shrink-0 cursor-pointer items-center gap-[7px] rounded-[var(--ns-radius)] px-2.5 font-[family-name:var(--ns-font-body)] text-[length:var(--ns-text-body)] font-[number:var(--ns-weight-medium)] whitespace-nowrap text-[var(--ns-ink-2)] outline-hidden [transition:background-color_var(--ns-time-color),color_var(--ns-time-color),box-shadow_var(--ns-time-color)]",
              "hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ns-signal)] data-active:bg-[var(--ns-raised)] data-active:text-[var(--ns-ink)] data-active:shadow-[var(--ns-bezel)] [&_svg]:size-3.5",
            )}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && <span className="font-[family-name:var(--ns-font-display)] text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] tabular-nums">{t.count}</span>}
          </Base.Tab>
        ))}
      </Base.List>
      {children}
    </Base.Root>
  );
}

const TabPanel = Base.Panel;

export { TabPanel, Tabs, useMoreToRight, type TabItem, type TabsProps };
