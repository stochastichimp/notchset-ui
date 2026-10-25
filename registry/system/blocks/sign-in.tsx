// Notchset sign-in 2.1.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { ArrowUpRight, Building2, ChevronLeft, Fingerprint, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/notchset/button";
import { RollingNumber } from "@/components/ui/notchset/rolling-number";
import { Spinner } from "@/components/ui/notchset/spinner";
import { TextField } from "@/components/ui/notchset/text-field";

/*
 * Sign in (block 46): two ways in, two different paths. A link is for anyone: it proves the inbox, then sets up
 * a new workspace. A passkey only exists on an account you already have, so it goes straight in. Three states:
 * the form, "check your email" (with the address, how long the link works, send again, use another), and
 * "confirm it's you" while the device asks. Errors say what to type, beside the field.
 */
export type SignInState = "form" | "sent" | "passkey" | "provider";
/** A work account the person signs in with: Google Workspace, Microsoft 365, or their company's own SSO. */
export type SignInProvider = "google" | "microsoft" | "sso";
const PROVIDER: Record<SignInProvider, string> = { google: "Google", microsoft: "Microsoft", sso: "your company’s sign-in" };

/** Google's and Microsoft's own marks, drawn to their brand rules beside their names. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="16" height="16" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
function MicrosoftMark() {
  return (
    <svg viewBox="0 0 21 21" width="15" height="15" aria-hidden>
      <path fill="#F25022" d="M1 1h9v9H1z" />
      <path fill="#7FBA00" d="M11 1h9v9h-9z" />
      <path fill="#00A4EF" d="M1 11h9v9H1z" />
      <path fill="#FFB900" d="M11 11h9v9h-9z" />
    </svg>
  );
}

/** Continue with a work account: Google Workspace and Microsoft 365, side by side above the email form. */
function ProviderButtons({ onProvider, className }: { onProvider: (p: "google" | "microsoft") => void; className?: string | undefined }) {
  return (
    <div data-slot="sign-in-providers" className={cn("grid grid-cols-2 gap-2 max-[380px]:grid-cols-1", className)}>
      <Button onClick={() => onProvider("google")}>
        <GoogleMark />
        Google
      </Button>
      <Button onClick={() => onProvider("microsoft")}>
        <MicrosoftMark />
        Microsoft
      </Button>
    </div>
  );
}

/** The wait while a work account's own page signs you in, with a way back. */
function ProviderWait({ provider, onBack }: { provider: SignInProvider; onBack: () => void }) {
  return (
    <>
      <Head icon={provider === "google" ? <GoogleMark /> : provider === "microsoft" ? <MicrosoftMark /> : <Building2 />} title={`Opening ${PROVIDER[provider]}`} soft wait>
        Finish signing in on the page that opens; you’ll come straight back.
      </Head>
      <div role="status" className="flex h-11 items-center justify-center gap-2.5 rounded-[var(--ns-radius)] bg-[var(--ns-well)] text-[var(--ns-ink-2)] shadow-[inset_0_0_0_1px_var(--ns-line-soft)]">
        <Spinner />
        Waiting…
      </div>
      <Button className="w-full" onClick={onBack}>
        Cancel
      </Button>
    </>
  );
}
/** The wait while the device asks for a passkey, with a way back. */
function PasskeyWait({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Head icon={<Fingerprint className="text-[var(--ns-series)]" />} title="Confirm it’s you" soft wait>
        Use your fingerprint, face or security key when your device asks.
      </Head>
      <div role="status" className="flex h-11 items-center justify-center gap-2.5 rounded-[var(--ns-radius)] bg-[var(--ns-well)] text-[var(--ns-ink-2)] shadow-[inset_0_0_0_1px_var(--ns-line-soft)]">
        <Spinner />
        Waiting for your passkey…
      </div>
      <Button className="w-full" onClick={onBack}>
        Cancel
      </Button>
    </>
  );
}
type SignInProps = {
  state: SignInState;
  email: string;
  onEmail: (v: string) => void;
  error?: string | null | undefined;
  onLink: () => void;
  onPasskey: () => void;
  /** Continue with a work account (Google, Microsoft) or the company's SSO; omit to offer email and passkey only. */
  onProvider?: ((p: SignInProvider) => void) | undefined;
  /** The account being opened while the state is "provider". */
  provider?: SignInProvider | undefined;
  onResend: () => void;
  onBack: () => void;
  /** Stands in for opening the email in a demo; a real app omits it. */
  onOpenLink?: (() => void) | undefined;
  logo: React.ReactNode;
  product: string;
  fine?: React.ReactNode;
  className?: string | undefined;
};

/*
 * A wait's mark breathes: one soft ring of the series violet spreads from the tile and fades, every 2.4 seconds,
 * for as long as the wait runs (ns-glow-pulse, on a layer of its own so the tile keeps its bezel). Less motion
 * holds it still.
 */
function Head({ icon, title, children, soft, wait }: { icon: React.ReactNode; title: string; children: React.ReactNode; soft?: boolean; wait?: boolean }) {
  return (
    <div className="flex items-center gap-3.5 pb-2">
      <span aria-hidden data-wait={wait ? "" : undefined} className={cn("relative grid size-10 shrink-0 place-items-center rounded-[11px] [&>svg]:size-[18px]", soft ? "bg-[var(--ns-raised)] text-[var(--ns-ink)] shadow-[var(--ns-bezel)]" : "bg-[var(--ns-ink)] text-[var(--ns-panel)]")}>
        {wait && <i data-ns-still="" className="pointer-events-none absolute inset-0 rounded-[inherit] [--ns-pulse:var(--ns-series)] [animation:ns-glow-pulse_2400ms_var(--ns-ease)_infinite]" />}
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="m-0 font-[family-name:var(--ns-font-display)] text-[24px] leading-[1.2] font-[number:var(--ns-weight-strong)] tracking-[var(--ns-tracking-display)]">{title}</h1>
        <p className="m-0 text-[var(--ns-ink-2)] text-pretty">{children}</p>
      </div>
    </div>
  );
}

function Or() {
  return <div className="flex items-center gap-3 text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] before:h-px before:flex-1 before:bg-[var(--ns-line-soft)] before:content-[''] after:h-px after:flex-1 after:bg-[var(--ns-line-soft)] after:content-['']">or</div>;
}

function SignIn({ state, email, onEmail, error, onLink, onPasskey, onProvider, provider, onResend, onBack, onOpenLink, logo, product, fine, className }: SignInProps) {
  return (
    <div data-slot="sign-in" className={cn("flex w-full max-w-[400px] flex-col gap-3 [animation:ns-rise_var(--ns-time-page)_var(--ns-ease)]", className)} data-ns-moves="">
      {state === "sent" ? (
        <>
          <Head icon={<Mail />} title="Your sign-in link is on its way" soft>
            We sent a sign-in link to <b className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{email}</b>. It works for 15 minutes.
          </Head>
          {onOpenLink && (
            <Button variant="primary" className="w-full" onClick={onOpenLink}>
              <ArrowUpRight />
              Open the link
            </Button>
          )}
          <Button className="w-full" onClick={onResend}>
            Send it again
          </Button>
          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" size="sm" className="-ml-2.5" onClick={onBack}>
              <ChevronLeft />
              Use a different email
            </Button>
            <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">Nothing yet? Check spam.</span>
          </div>
        </>
      ) : state === "provider" && provider ? (
        <ProviderWait provider={provider} onBack={onBack} />
      ) : state === "passkey" ? (
        <PasskeyWait onBack={onBack} />
      ) : (
        <>
          <Head icon={logo} title={`Sign in to ${product}`}>
            {onProvider ? "Use your work account, email or a passkey." : "Use your work email or a passkey."}
          </Head>
          {onProvider && (
            <>
              <ProviderButtons onProvider={onProvider} />
              <Or />
            </>
          )}
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              onLink();
            }}
          >
            <TextField label="Work email" type="email" autoComplete="email" value={email} error={error} onChange={(e) => onEmail(e.target.value)} />
            <Button type="submit" variant="primary" className="w-full">
              Email me a sign-in link
            </Button>
          </form>
          <Or />
          <Button className="w-full" onClick={onPasskey}>
            <Fingerprint />
            Sign in with a passkey
          </Button>
          {onProvider && (
            <Button variant="ghost" size="sm" className="self-center" onClick={() => onProvider("sso")}>
              <Building2 />
              Use single sign-on (SSO)
            </Button>
          )}
        </>
      )}
      {fine && <small className="pt-1 text-center text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)] text-balance">{fine}</small>}
    </div>
  );
}

/*
 * Auth split: the sign-in page at its widest. On a screen 960px and up the form keeps its width, centred on the
 * canvas at the left, and a glimpse of what's inside fills the right (about half, on the panel surface behind a
 * hairline): a real figure from the workspace and the chart it comes from, entering once per visit. The glimpse is
 * decoration: hidden from assistive tech (a one-line `summary` says it instead), inert, nothing in it focusable or
 * pressable. Its column is laid out by CSS from the first paint, so nothing moves when it mounts; under 960px it
 * isn't there at all and the form sits alone, as it always has.
 *
 *   <AuthSplit summary="Q4 so far: $809,800 won and committed" aside={<AuthGlimpse label="Q4 so far" figure="$809,800" roll context="58% of the $1.40M target">{chart}</AuthGlimpse>}>
 *     <SignIn … />
 *   </AuthSplit>
 */
const WIDE = "(min-width: 960px)";
function useWide() {
  /* narrow until mounted, so the server's HTML and the first client render agree (the glimpse arrives after) */
  const [wide, setWide] = React.useState(false);
  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const m = window.matchMedia(WIDE);
    const on = () => setWide(m.matches);
    on();
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return wide;
}
type AuthSplitProps = { children: React.ReactNode; aside?: React.ReactNode; /** what the glimpse shows, in one line, for a screen reader */ summary?: string | undefined; className?: string | undefined };

function AuthSplit({ children, aside, summary, className }: AuthSplitProps) {
  const wide = useWide();
  return (
    <main data-slot="auth-split" className={cn("grid min-h-dvh bg-[var(--ns-canvas)] font-[family-name:var(--ns-font-body)] text-[length:var(--ns-text-body)] text-[var(--ns-ink)]", aside != null && "min-[960px]:grid-cols-[minmax(0,1fr)_minmax(0,48%)]", className)}>
      <div className="relative grid min-w-0 place-items-center px-[max(16px,env(safe-area-inset-left,0px))] py-6 min-[960px]:px-12 min-[960px]:py-16">{children}</div>
      {aside != null && (
        <div data-slot="auth-aside" className="relative hidden min-w-0 place-items-center overflow-hidden border-l border-[var(--ns-line)] bg-[var(--ns-panel)] px-[clamp(40px,5vw,88px)] py-16 min-[960px]:grid">
          {wide && (
            <>
              {summary && <p className="sr-only">{summary}</p>}
              <div data-slot="auth-glimpse" aria-hidden ref={(el) => void (el && (el.inert = true))} className="pointer-events-none w-full max-w-[560px] select-none">
                {aside}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}

/*
 * Once per visit: true on the first arrival at this page in a session, and never under less motion (the page's
 * data-motion or the device's setting). The chart family's useEntrance, kept here so the free sign-in block
 * doesn't need the Pro chart family; both remember in session storage.
 */
const SEEN = "ns-sign-in-seen";
function useFirstVisit(kind: string) {
  const [key] = React.useState(() => (typeof window === "undefined" ? kind : `${window.location.pathname}${window.location.hash.split("?")[0]}|${kind}`));
  const [first] = React.useState(() => {
    if (typeof window === "undefined") return false;
    if (document.documentElement.dataset.motion === "reduced" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
    try {
      return !(JSON.parse(sessionStorage.getItem(SEEN) ?? "[]") as string[]).includes(key);
    } catch {
      return true;
    }
  });
  React.useEffect(() => {
    try {
      const seen = JSON.parse(sessionStorage.getItem(SEEN) ?? "[]") as string[];
      if (!seen.includes(key)) sessionStorage.setItem(SEEN, JSON.stringify([...seen, key].slice(-50)));
    } catch {}
  }, [key]);
  /* hydrating, it reads as the server did (false): a page rendered on the server lands the glimpse as it is */
  return React.useSyncExternalStore(noop, () => first, () => false);
}
const noop = () => () => {};

/** A figure that rolls up from zero, once, when `on`; otherwise (and under less motion) it is simply there. */
function useRollIn(figure: string, on: boolean) {
  const [armed, setArmed] = React.useState(on);
  React.useEffect(() => {
    if (!armed) return;
    /* two frames at zero so the digits have somewhere to roll from */
    const t = setTimeout(() => setArmed(false), 320);
    return () => clearTimeout(t);
  }, [armed]);
  return armed ? figure.replace(/\d/g, "0") : figure;
}

/*
 * The glimpse itself: a small label, one large figure, a quiet line of context, and the chart it comes from. On the
 * first visit in a session it rises in a beat after the form, and with `roll` its figure rolls up from zero (the
 * one place a figure counts up on arrival: this is a showcase of the workspace, not a page you work in). Less motion
 * lands it all at once, the final figure and a drawn chart.
 */
type AuthGlimpseProps = { label: React.ReactNode; figure: string; roll?: boolean | undefined; context?: React.ReactNode; children?: React.ReactNode; className?: string | undefined };

function AuthGlimpse({ label, figure, roll, context, children, className }: AuthGlimpseProps) {
  const entering = useFirstVisit("glimpse");
  const shown = useRollIn(figure, !!roll && entering);
  return (
    <div data-slot="auth-glimpse-body" data-ns-moves="" className={cn("flex flex-col", entering && "[animation:ns-rise_720ms_var(--ns-ease)_160ms_both]", className)}>
      <span className="text-[length:var(--ns-text-small)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-2)]">{label}</span>
      {/* the roll takes its time here (the born mark's duration): a figure arriving, not a figure nudged; each digit's
          window fades at its top and bottom, so the digits passing through it blur out instead of being cut */}
      <RollingNumber value={shown} className="mt-1 font-[family-name:var(--ns-font-display)] text-[calc(var(--ns-text-hero)*1.75)] leading-[1.16] font-[number:var(--ns-weight-strong)] tracking-[-0.035em] text-[var(--ns-ink)] [--ns-time-dialog:var(--ns-time-born)] [&_[data-ns-mask]]:[mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_82%,transparent)]" />
      {context != null && <span className="mt-2.5 text-[var(--ns-ink-2)]">{context}</span>}
      {children != null && <div className="mt-10 min-w-0">{children}</div>}
    </div>
  );
}

/*
 * Onboarding step (block 47): one question per screen, with where you are (a bar per step and "Step 2 of 3"),
 * what it's for, the answer, then Back and the one verb that moves on. Optional steps say "You can do this later".
 */
type OnboardingStepProps = { step: number; of: number; title: string; hint: React.ReactNode; children: React.ReactNode; onBack?: (() => void) | undefined; next: { label: string; onClick: () => void; disabled?: boolean | undefined }; className?: string | undefined };

function OnboardingStep({ step, of, title, hint, children, onBack, next, className }: OnboardingStepProps) {
  return (
    <div data-slot="onboarding-step" className={cn("flex w-full max-w-[400px] flex-col gap-3", className)}>
      <div aria-hidden className="flex gap-1.5">
        {Array.from({ length: of }, (_, i) => (
          <i key={i} className={cn("h-1 w-7 rounded-full bg-[var(--ns-line)] [transition:background-color_var(--ns-time-color)]", i < step && "bg-[var(--ns-ink)]")} />
        ))}
      </div>
      <span className="text-[length:var(--ns-text-meta)] text-[var(--ns-ink-3)]">
        Step {step} of {of}
      </span>
      <h1 className="m-0 mt-2 font-[family-name:var(--ns-font-display)] text-[26px] leading-[1.15] font-[number:var(--ns-weight-strong)] tracking-[var(--ns-tracking-display)]">{title}</h1>
      <p className="m-0 mb-2 text-[var(--ns-ink-2)]">{hint}</p>
      {children}
      <div className="flex items-center justify-between pt-2">
        {onBack ? <Button onClick={onBack}>Back</Button> : <span />}
        <Button variant="primary" disabled={next.disabled} onClick={next.onClick}>
          {next.label}
        </Button>
      </div>
    </div>
  );
}

export { AuthGlimpse, AuthSplit, OnboardingStep, PasskeyWait, ProviderButtons, ProviderWait, SignIn, type AuthGlimpseProps, type AuthSplitProps, type OnboardingStepProps, type SignInProps };
