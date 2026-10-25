// Notchset company-mark 2.0.0 · https://notchset.dev/changelog
import { cn } from "@/lib/utils";

/*
 * Company mark: a company's colour as a rounded square with its initial (or its glyph, a 24×24 path). The
 * colour is the company's own data, not a theme role, so it is the one place a component takes a raw colour.
 * The name sits beside it, so the mark is decoration.
 */
type CompanyMarkProps = {
  name: string;
  color: string;
  /** An SVG path on a 24×24 grid, drawn in white. Without one, the initial is shown. */
  glyph?: string | undefined;
  size?: number | undefined;
  className?: string | undefined;
};

function CompanyMark({ name, color, glyph, size = 20, className }: CompanyMarkProps) {
  const rx = ((24 * Math.round(size * 0.28)) / size).toFixed(1);
  return (
    <svg data-slot="company-mark" width={size} height={size} viewBox="0 0 24 24" aria-hidden className={cn("block shrink-0", className)}>
      <rect width="24" height="24" rx={rx} fill={color} />
      {glyph ? (
        <>
          <rect x=".5" y=".5" width="23" height="23" rx={Math.max(0, Number(rx) - 0.5)} fill="none" stroke="white" strokeOpacity=".12" />
          <path d={glyph} fill="white" transform="translate(5.4 5.4) scale(.55)" />
        </>
      ) : (
        <text x="12" y="16.2" textAnchor="middle" fontFamily="Geist, Inter, sans-serif" fontWeight="600" fontSize="12" fill="white">
          {name.trim()[0]?.toUpperCase()}
        </text>
      )}
    </svg>
  );
}

export { CompanyMark, type CompanyMarkProps };
