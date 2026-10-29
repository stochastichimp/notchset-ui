// Notchset showcase-wall 2.2.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Showcase wall: the live pieces a homepage leads with, each big and touchable on a soft wash that bleeds in from
 * the panel's edges, with the piece's name and what happens when you touch it underneath. Any piece goes in a tile;
 * the wall only frames and paces them. Tiles mount as they come near the screen (a fixed height holds their place,
 * so nothing jumps) and fade in; `eager` mounts them all at once, for a catalogue or a check that reads every piece. On a tablet the 8 | 4 pairs even out to 6 | 6; on a phone each tile takes the row.
 *
 * The wash is the only attention colour here, and it stays on the panel: the pieces keep their own meanings. An
 * "ink" tile shows its piece in the dark theme whatever the page is, so a light page still gets a night moment.
 *
 *   <ShowcaseWall tiles={[{ id: "chart", title: "Revenue chart", hint: "Drag across the year", span: 8,
 *     wash: "sage", content: <ScrubChart … /> }]} />
 */
/* "titanium" is the graphite wash's name from before the signatures, kept so a page built on it still types */
type Wash = "graphite" | "sand" | "sage" | "dusk" | "clay" | "ink" | "titanium";
type ShowcaseTile = {
  id: string;
  /** the piece's name, then what happens when you touch it */
  title: string;
  hint: string;
  /** columns of 12 on a wide screen */
  span: 4 | 5 | 6 | 7 | 8 | 12;
  wash: Wash;
  /** the stage's height in px; it holds the place before the piece mounts */
  height?: number | undefined;
  content: React.ReactNode;
  /** shown until the piece mounts (an image or a quiet still) */
  poster?: React.ReactNode;
  href?: string | undefined;
};
type ShowcaseWallProps = { tiles: ShowcaseTile[]; label?: string; eager?: boolean | undefined; className?: string | undefined };

const SPAN: Record<ShowcaseTile["span"], string> = {
  4: "min-[960px]:col-span-4",
  5: "min-[960px]:col-span-5",
  6: "min-[960px]:col-span-6",
  7: "min-[960px]:col-span-7",
  8: "min-[960px]:col-span-8",
  12: "min-[960px]:col-span-12",
};
const WASH: Record<Wash, string> = {
  graphite: "var(--ns-wash-graphite)",
  sand: "var(--ns-wash-sand)",
  sage: "var(--ns-wash-sage)",
  dusk: "var(--ns-wash-dusk)",
  clay: "var(--ns-wash-clay)",
  ink: "var(--ns-wash-ink)",
  titanium: "var(--ns-wash-graphite)",
};
/* a fine grain over the wash, so the colour reads as material rather than a flat fill */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")";

/** Mounts its children once they come within a screen of the viewport; renders the poster until then. */
function useNear<T extends Element>(eager: boolean) {
  const ref = React.useRef<T>(null);
  /* the server and the first client render agree (posters), so a page that renders on the server hydrates cleanly */
  const [near, setNear] = React.useState(eager);
  React.useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setNear(true));
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setNear(true);
        io.disconnect();
      }
    }, { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return [ref, near] as const;
}

function Tile({ t, eager }: { t: ShowcaseTile; eager: boolean }) {
  const [ref, near] = useNear<HTMLDivElement>(eager);
  const w = WASH[t.wash];
  const ink = t.wash === "ink";
  /* the stage holds a fixed place (a little less on a phone); it may grow taller for content that wraps, never shorter */
  const h = t.height ?? 420;
  return (
    <figure data-tile={t.id} className={cn("col-span-12 m-0 flex min-w-0 flex-col gap-3 min-[600px]:max-[960px]:col-span-6", t.span === 12 && "min-[600px]:max-[960px]:col-span-12", SPAN[t.span])}>
      <div
        ref={ref}
        className={cn("relative isolate flex min-h-[calc(var(--h)*0.7px)] min-w-0 items-center justify-center overflow-hidden rounded-[28px] px-5 py-8 min-[600px]:min-h-[calc(var(--h)*1px)] min-[600px]:px-8", ink && "dark text-[var(--ns-ink)]")}
        style={{
          ["--h" as string]: h,
          background: ink
            ? `radial-gradient(120% 90% at 0% 0%, color-mix(in oklab, ${w} 70%, #3a3f4c) 0%, transparent 60%), radial-gradient(100% 80% at 100% 100%, color-mix(in oklab, ${w} 75%, #2a2e38) 0%, transparent 55%), ${w}`
            : `radial-gradient(120% 90% at 0% 0%, ${w} 0%, transparent 62%), radial-gradient(100% 85% at 100% 100%, ${w} 0%, transparent 58%), color-mix(in oklab, ${w} 28%, var(--ns-canvas))`,
          boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--ns-line) 60%, transparent)",
        }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
        {near ? (
          <div data-ns-moves="" className="flex w-full min-w-0 justify-center [animation:ns-fade_var(--ns-time-page)_var(--ns-ease)_both]">
            {t.content}
          </div>
        ) : (
          (t.poster ?? null)
        )}
      </div>
      <figcaption className="flex items-baseline gap-2 px-1 text-[length:var(--ns-text-small)]">
        <span className="font-[number:var(--ns-weight-medium)] text-[var(--ns-ink)]">{t.title}</span>
        <span className="min-w-0 flex-1 text-[var(--ns-ink-3)] min-[600px]:truncate">{t.hint}</span>
        {t.href && (
          <a href={t.href} aria-label={`Open ${t.title}`} className="shrink-0 rounded-[5px] px-1 text-[var(--ns-ink-3)] outline-hidden hover:text-[var(--ns-ink)] focus-visible:outline-2 focus-visible:outline-[var(--ns-signal)]">
            ↗
          </a>
        )}
      </figcaption>
    </figure>
  );
}

/** The card a piece sits on inside a tile: the app's own panel, lifted off the wash. */
function ShowcaseSurface({ children, className }: { children: React.ReactNode; className?: string | undefined }) {
  return <div className={cn("w-full min-w-0 rounded-[var(--ns-radius-xl)] bg-[var(--ns-panel)] p-5 text-[var(--ns-ink)] shadow-[var(--ns-shadow-float)]", className)}>{children}</div>;
}

function ShowcaseWall({ tiles, label = "Live pieces", eager = false, className }: ShowcaseWallProps) {
  return (
    <section data-slot="showcase-wall" aria-label={label} className={cn("grid grid-cols-12 gap-x-4 gap-y-8", className)}>
      {tiles.map((t) => (
        <Tile key={t.id} t={t} eager={eager} />
      ))}
    </section>
  );
}

export { ShowcaseSurface, ShowcaseWall, type ShowcaseTile, type ShowcaseWallProps, type Wash };
