// Notchset stage-chips 2.0.0 · https://notchset.dev/changelog
import { cn } from "@/lib/utils";

/*
 * Stage chips: a night's time in each stage as a measured legend. One thin bar shows the night's proportions (each
 * stage its swatch, a hairline gap between), then one column per stage on one baseline: the swatch and name in the
 * quiet ink, the time in full ink, and, under the stage that stands out, its usual in plain words. Columns are split
 * by hairlines (two by two on a phone); no pills. A plain list, so it reads the same to a screen reader.
 *
 *   <StageChips stages={[{ name: "Deep", value: "1 h 57", minutes: 117, color: "var(--ns-sleep-deep)", usual: "1 h 38" }, …]} />
 */
type StageChip = { name: string; value: string; color: string; usual?: string | undefined; minutes?: number | undefined };
type StageChipsProps = { stages: StageChip[]; label?: string | undefined; className?: string | undefined };

function StageChips({ stages, label = "Time in each stage", className }: StageChipsProps) {
  const total = stages.every((s) => s.minutes != null) ? stages.reduce((a, s) => a + (s.minutes ?? 0), 0) : 0;
  return (
    <div data-slot="stage-chips" className={cn("flex min-w-0 flex-col gap-4", className)}>
      {total > 0 && (
        <div aria-hidden className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full">
          {stages.map((s) => (
            <i key={s.name} className="block h-full first:rounded-l-full last:rounded-r-full" style={{ background: s.color, flexGrow: s.minutes, flexBasis: 0 }} />
          ))}
        </div>
      )}
      <ul aria-label={label} className="m-0 grid list-none grid-cols-[repeat(var(--n),minmax(0,1fr))] p-0 max-[480px]:grid-cols-2 max-[480px]:gap-y-4" style={{ ["--n" as string]: stages.length }}>
        {stages.map((s, i) => (
          <li key={s.name} data-standout={s.usual ? "" : undefined} className={cn("flex min-w-0 flex-col gap-1.5", i > 0 && "border-l border-[var(--ns-line-soft)] pl-3", i % 2 === 0 && "max-[480px]:border-l-0 max-[480px]:pl-0")}>
            <span className="flex min-w-0 items-center gap-1.5 text-[length:var(--ns-text-meta)] leading-none text-[var(--ns-ink-3)]">
              <i aria-hidden className="block size-2 shrink-0 rounded-[3px]" style={{ background: s.color }} />
              <span className="truncate">{s.name}</span>
            </span>
            <b className="text-[length:var(--ns-text-strong)] leading-none font-[number:var(--ns-weight-medium)] whitespace-nowrap text-[var(--ns-ink)] tabular-nums">{s.value}</b>
            {s.usual && <span className="text-[length:var(--ns-text-meta)] leading-none whitespace-nowrap text-[var(--ns-ink-3)]">Your usual {s.usual}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { StageChips, type StageChip, type StageChipsProps };
