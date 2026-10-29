// Notchset capability 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/notchset/tooltip";

/*
 * Capability: what the backend can do decides what is drawn. Two different answers, never mixed:
 *
 * - Unsupported (the adapter has no email): `can` is false and the control is not drawn at all: no button, no menu
 *   item, no shortcut, no command. Nothing to press, nothing to explain.
 * - Temporarily unavailable (offline, rate-limited, a provider down): the control is drawn disabled, and its reason
 *   shows on hover, on keyboard focus and on a tap, so a phone can ask why too. It comes back by itself.
 *
 *   <CapabilitiesProvider capabilities={adapter.capabilities} unavailable={{ email: offline ? "You're offline. Email sends once you're back." : null }}>
 *     <Capable cap="email"><Button><Mail />Email</Button></Capable>
 *   </CapabilitiesProvider>
 *
 * A capability counts only when declared true: an adapter says what it supports, and anything it doesn't name is
 * hidden (fail closed). Pages read can()/unavailable() for shortcuts and commands, so a key never runs what isn't drawn.
 */

/** What the backend supports: { email: true, sync: false, import: true }. Undeclared means unsupported. */
export type Capabilities = Readonly<Record<string, boolean | undefined>>;
/** Why a supported capability can't be used right now, in one sentence; null or absent when it can. */
export type Unavailability = Readonly<Record<string, string | null | undefined>>;

/** True only when the backend declares the capability. */
export function can(capabilities: Capabilities | undefined, cap: string): boolean {
  return capabilities?.[cap] === true;
}

/** The reason a supported capability is unavailable right now, or null when it can be used. */
export function unavailable(reasons: Unavailability | undefined, cap: string): string | null {
  return reasons?.[cap] || null;
}

type Ctx = { capabilities?: Capabilities | undefined; unavailable?: Unavailability | undefined };
const CapabilityContext = React.createContext<Ctx>({});

/** Declares, once near the root, what the backend supports and what is unavailable right now. */
function CapabilitiesProvider({ capabilities, unavailable: reasons, children }: Ctx & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ capabilities, unavailable: reasons }), [capabilities, reasons]);
  return <CapabilityContext.Provider value={value}>{children}</CapabilityContext.Provider>;
}

/** can() and unavailable() over the nearest provider, for shortcuts, commands and menus. */
function useCapabilities() {
  const ctx = React.useContext(CapabilityContext);
  return React.useMemo(() => ({ can: (cap: string) => can(ctx.capabilities, cap), unavailable: (cap: string) => (can(ctx.capabilities, cap) ? unavailable(ctx.unavailable, cap) : null) }), [ctx]);
}

type CapableProps = {
  /** The capability the control needs ("email"). */
  cap: string;
  /** The control: one element that takes a ref (a Button, an IconButton). */
  children: React.ReactElement;
  /** Overrides the provider's declaration. */
  capabilities?: Capabilities | undefined;
  /** Overrides the provider's reasons. */
  unavailable?: Unavailability | undefined;
  side?: "top" | "bottom" | undefined;
};

/** Draws its control only when the backend supports it; disabled, with its reason, while it's unavailable. */
function Capable({ cap, children, capabilities, unavailable: reasons, side = "top" }: CapableProps) {
  const ctx = React.useContext(CapabilityContext);
  if (!can(capabilities ?? ctx.capabilities, cap)) return null;
  const why = unavailable(reasons ?? ctx.unavailable, cap);
  if (!why) return children;
  return (
    <WithReason reason={why} side={side}>
      {children}
    </WithReason>
  );
}

type ChildProps = { className?: string; onClick?: (e: React.MouseEvent) => void };

/*
 * Disabled with its reason: aria-disabled rather than disabled, so the control keeps focus (keyboard users can
 * reach the reason) and takes a tap; a press says why instead of acting. The reason is also its description.
 */
function WithReason({ reason, side, children }: { reason: string; side: "top" | "bottom"; children: React.ReactElement }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const child = children as React.ReactElement<ChildProps>;
  const control = React.cloneElement(child, {
    "aria-disabled": true,
    "aria-describedby": id,
    className: cn(child.props.className, "cursor-default"),
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setOpen(false), 2600);
    },
  } as ChildProps);
  return (
    <span data-slot="capability" data-state="unavailable" className="inline-flex">
      <Tooltip label={reason} side={side} open={open} onOpenChange={setOpen}>
        {control}
      </Tooltip>
      <span id={id} hidden>
        {reason}
      </span>
    </span>
  );
}

export { Capable, CapabilitiesProvider, useCapabilities, type CapableProps };
