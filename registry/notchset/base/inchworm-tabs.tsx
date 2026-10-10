"use client"

/**
 * Inchworm Tabs (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/inchworm-tabs
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"
import { Tabs } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"
import { InchwormGlyph, InchwormIndicator, useInchworm, type InchwormItem } from "@/lib/notchset/inchworm"

/*
 * Inchworm Tabs (Base UI build): a segmented control whose indicator inches over: the edge in the
 * direction of travel moves first and the trailing edge follows 110ms later, and the new tab's icon
 * draws itself in. Arrow keys move between tabs. Put InchwormTabsPanel children after it for content.
 */

interface InchwormTabsProps extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "dir"> {
  items: readonly InchwormItem[]
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  /** The tab list's accessible name. */
  label?: string | undefined
  sound?: boolean | undefined
}

const InchwormTabs = React.forwardRef<HTMLDivElement, InchwormTabsProps>(function InchwormTabs(
  { items, value, defaultValue, onValueChange, label = "View", sound = true, className, children, ...props },
  ref
) {
  const { current, list, edges, play, select } = useInchworm({ items, value, defaultValue, onValueChange, sound })
  return (
    <Tabs.Root ref={ref} data-slot="inchworm-tabs" data-notchset="" value={current} onValueChange={(next) => select(String(next))} className={cn("flex flex-col items-center gap-4", className)} {...props}>
      <Tabs.List
        ref={list}
        data-slot="inchworm-tabs-list"
        aria-label={label}
        activateOnFocus
        className="relative inline-flex max-w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] p-1"
      >
        <InchwormIndicator edges={edges} />
        {items.map((item) => {
          const active = item.value === current
          return (
            <Tabs.Tab
              key={item.value}
              data-inchworm-value={item.value}
              value={item.value}
              data-slot="inchworm-tabs-tab"
              className={cn(
                "relative z-[1] flex h-9 cursor-pointer items-center justify-center gap-[7px] rounded-[max(calc(var(--radius)-4px),2px)] px-5 text-[length:var(--ns-type-label)] font-medium whitespace-nowrap outline-none [transition:color_.3s,transform_.15s,scale_.15s,translate_.15s,rotate_.15s] active:scale-95 focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                active ? "text-[var(--foreground)]" : "text-[color:var(--ns-ink-support,color-mix(in_oklab,var(--muted-foreground)_85%,var(--foreground)))]"
              )}
            >
              <InchwormGlyph icon={item.icon} active={active} play={play} />
              {item.label}
            </Tabs.Tab>
          )
        })}
      </Tabs.List>
      {children}
    </Tabs.Root>
  )
})

function InchwormTabsPanel({ className, ...props }: React.ComponentProps<typeof Tabs.Panel>) {
  return <Tabs.Panel data-slot="inchworm-tabs-panel" className={cn("w-full outline-none", className)} {...props} />
}

export { InchwormTabs, InchwormTabsPanel, type InchwormItem, type InchwormTabsProps }
