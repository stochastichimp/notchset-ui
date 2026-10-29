// Notchset avatar-stack 2.0.0 · https://notchset.dev/changelog
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/notchset/avatar";

/*
 * Avatar stack: who is on something, overlapping, then "+N". Each avatar is cut out of the surface it sits on
 * by a 2px ring of that surface (set --ns-stack-on when the stack sits on something other than a panel).
 * The stack reads out as one phrase: "Ana Ruiz, Kevin Ito and 3 more".
 */
type Person = { name: string; src?: string | undefined; hue?: number | undefined };
type AvatarStackProps = { people: Person[]; max?: number | undefined; size?: number | undefined; className?: string | undefined };

function AvatarStack({ people, max = 3, size = 20, className }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  const names = shown.map((p) => p.name);
  const said = rest > 0 ? `${names.join(", ")} and ${rest} more` : names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : (names[0] ?? "");
  return (
    <span data-slot="avatar-stack" role="img" aria-label={said} className={cn("inline-flex items-center", className)}>
      {shown.map((p, i) => (
        <Avatar
          key={p.name + i}
          {...p}
          size={size}
          className={cn("shadow-[0_0_0_2px_var(--ns-stack-on)]", i > 0 && (p.src ? "-ml-1.5 max-[600px]:-ml-1" : "-ml-0.5") /* initials need their letters whole, so they barely overlap */)}
        />
      ))}
      {rest > 0 && (
        <i aria-hidden className="ml-1 text-[length:var(--ns-text-meta)] font-[number:var(--ns-weight-medium)] text-[var(--ns-ink-3)] not-italic tabular-nums">
          +{rest}
        </i>
      )}
    </span>
  );
}

export { AvatarStack, type AvatarStackProps };
