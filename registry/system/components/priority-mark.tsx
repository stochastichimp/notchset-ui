// Notchset priority-mark 2.1.0 · https://notchset.dev/changelog
import { cn } from "@/lib/utils";

/*
 * Priority mark: how much a task matters, readable at 14px without colour. Three ink bars climb from low to high;
 * urgent is a filled ink square with a mark of its own, so red stays for overdue. No priority is three faint bars.
 * It says its level to a screen reader.
 *
 *   <PriorityMark priority={3} />
 */
type PriorityMarkProps = {
  /** 0 none, 1 low, 2 medium, 3 high, 4 urgent */
  priority: 0 | 1 | 2 | 3 | 4;
  /** the words for each level, none first */
  words?: [string, string, string, string, string] | undefined;
  className?: string | undefined;
};

const WORDS: [string, string, string, string, string] = ["No priority", "Low", "Medium", "High", "Urgent"];

function PriorityMark({ priority, words = WORDS, className }: PriorityMarkProps) {
  const w = words[priority];
  if (priority === 4)
    return (
      <span data-slot="priority-mark" data-priority={4} role="img" aria-label={w} title={w} className={cn("grid size-3.5 shrink-0 place-items-center rounded-[3px] bg-[var(--ns-ink)] text-[var(--ns-canvas)]", className)}>
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
          <path d="M6 2.6v4M6 9.1v.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" fill="none" />
        </svg>
      </span>
    );
  return (
    <span data-slot="priority-mark" data-priority={priority} role="img" aria-label={w} title={w} className={cn("inline-flex h-3.5 w-3.5 shrink-0 items-end justify-center gap-[1.5px] pb-[1.5px]", className)}>
      {[1, 2, 3].map((k) => (
        <i key={k} className={cn("block w-[3px] rounded-[1px]", priority >= k ? "bg-[var(--ns-ink-2)]" : "bg-[var(--ns-line)]")} style={{ height: 3 + k * 3 }} />
      ))}
    </span>
  );
}

export { PriorityMark, type PriorityMarkProps };
