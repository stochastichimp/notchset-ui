// Notchset spinner 2.0.0 · https://notchset.dev/changelog
import { cn } from "@/lib/utils";

/*
 * Spinner, "the notch": inline "working", the size of the text it sits in. Four dots in ink turn a quarter as
 * the square breathes in, trading sizes across the diagonal (the resting pair dims), then rest a beat, so it
 * reads as thinking rather than whirring, and it is ours (the four corners of the Notchset plus). No colour: colour in the system always means something.
 * It is decoration for the words beside it ("Saving…"), so it is hidden from assistive tech; the busy state is
 * announced by the control that holds it. Under reduced motion it holds still and the words still say it.
 */
type SpinnerProps = { className?: string | undefined; size?: number | undefined };

/*
 * The animations are whole class strings, not inline styles: Tailwind keeps the foundation's ns-notch keyframes
 * only when compiled CSS names them, and it compiles only the classes it finds written out in the source.
 */
function Spinner({ className, size = 14 }: SpinnerProps) {
  const dot = Math.max(3, Math.round(size * 0.3));
  const spot = (pos: string, pair: "a" | "b") => (
    <i
      className={cn(
        "absolute rounded-full bg-current",
        pair === "a" ? "[animation:ns-notch-a_1.2s_cubic-bezier(.7,0,.3,1)_infinite]" : "[animation:ns-notch-b_1.2s_cubic-bezier(.7,0,.3,1)_infinite]",
        pos,
      )}
      style={{ width: dot, height: dot, scale: pair === "a" ? 1 : 0.55, opacity: pair === "a" ? 1 : 0.45 }}
    />
  );
  return (
    <span
      data-slot="spinner"
      data-ns-still=""
      aria-hidden="true"
      className={cn("relative inline-block shrink-0 [animation:ns-notch-turn_1.2s_cubic-bezier(.7,0,.3,1)_infinite]", className)}
      style={{ width: size, height: size }}
    >
      {spot("top-0 left-0", "a")}
      {spot("top-0 right-0", "b")}
      {spot("right-0 bottom-0", "a")}
      {spot("bottom-0 left-0", "b")}
    </span>
  );
}

export { Spinner, type SpinnerProps };
