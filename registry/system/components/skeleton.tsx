// Notchset skeleton 2.0.0 · https://notchset.dev/changelog
import { cn } from "@/lib/utils";

/*
 * Skeleton: the shape of text that is still loading, with a slow shimmer. Hidden from screen readers (the
 * region that is loading says so with aria-busy). Under reduced motion the shimmer stops and the shape stays.
 */
type SkeletonProps = { width?: number | string | undefined; height?: number | undefined; className?: string | undefined };

function Skeleton({ width = "100%", height = 12, className }: SkeletonProps) {
  return (
    <span
      data-slot="skeleton"
      data-ns-still=""
      aria-hidden
      style={{ width, height }}
      className={cn(
        "block max-w-full rounded-[5px] bg-[linear-gradient(90deg,var(--ns-line-soft),var(--ns-hover),var(--ns-line-soft))] bg-[length:200%_100%] [animation:ns-shimmer_1.2s_linear_infinite]",
        className,
      )}
    />
  );
}

export { Skeleton, type SkeletonProps };
