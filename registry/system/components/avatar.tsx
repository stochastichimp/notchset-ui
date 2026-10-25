// Notchset avatar 2.1.0 · https://notchset.dev/changelog
import { cn } from "@/lib/utils";

/*
 * Avatar: a person's photo, or their initials on a soft wash of their own hue when there is no photo. It sits
 * beside the person's name almost everywhere, so by default it is decoration; pass `announce` when it stands
 * alone and its name must be read out. The initials are half the hue and half the ink, which keeps them at 4.5:1 or
 * more on their wash at every hue, light and dark (tests/system/avatar-contrast.test.ts).
 */
type AvatarProps = {
  name: string;
  src?: string | undefined;
  size?: number | undefined;
  /** 0-360. Defaults to a hue derived from the name, so a person keeps one colour everywhere. */
  hue?: number | undefined;
  announce?: boolean | undefined;
  className?: string | undefined;
};

const hueOf = (name: string) => [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

function Avatar({ name, src, size = 20, hue, announce = false, className }: AvatarProps) {
  const a11y = announce ? { role: "img", "aria-label": name } : { "aria-hidden": true as const };
  if (src) {
    return (
      <img
        data-slot="avatar"
        src={src}
        width={size}
        height={size}
        alt={announce ? name : ""}
        aria-hidden={announce ? undefined : true}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      data-slot="avatar"
      {...a11y}
      style={{ "--h": hue ?? hueOf(name), width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) } as React.CSSProperties}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-[family-name:var(--ns-font-body)] leading-none font-[number:var(--ns-weight-strong)] tracking-[0.02em] select-none",
        "bg-[color-mix(in_oklab,hsl(var(--h)_65%_55%)_18%,transparent)] text-[color-mix(in_oklab,hsl(var(--h)_60%_45%)_50%,var(--ns-ink))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,hsl(var(--h)_65%_55%)_22%,transparent)]",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export { Avatar, type AvatarProps };
