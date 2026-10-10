"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useIsomorphicLayoutEffect } from "@/lib/notchset/shared"

/*
 * Segmented: the mechanics every one-of-a-few switch shares. A radiogroup of buttons and a thumb that
 * slides and resizes to the chosen one (measured, so options can have any width and the thumb follows
 * when the container narrows). Arrow keys move the choice (mirrored under rtl), Home and End jump
 * to the ends, and only the chosen option is in the tab order. The look is the caller's: it renders the
 * thumb and each option (with the props given) in its own className, so a Tailwind prefix still reaches
 * every class. Segment Switch and Billing Switch are two looks over this.
 */

interface SegmentedOption<T extends string> {
  value: T
  label: React.ReactNode
  /** The accessible name when the label isn't plain text. */
  ariaLabel?: string | undefined
}

interface SegmentedProps<T extends string> extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange" | "dir"> {
  label: string
  options: readonly SegmentedOption<T>[]
  value: T
  onValueChange: (value: T) => void
  /** The sliding thumb: render an element with this style (its position and width) and your classes. */
  thumb: (style: React.CSSProperties) => React.ReactNode
  /** One option: render a <button> with these props (radio semantics, focus, ref) and your classes. */
  option: (o: { option: SegmentedOption<T>; on: boolean; index: number; props: SegmentedOptionProps }) => React.ReactNode
  /** Where the thumb sits before the options are measured (server render, first paint), physical px. */
  estimate?: ((index: number) => { x: number; w: number }) | undefined
}

interface SegmentedOptionProps {
  ref: (el: HTMLButtonElement | null) => void
  type: "button"
  role: "radio"
  "aria-checked": boolean
  "aria-label": string | undefined
  tabIndex: number
  onClick: () => void
}

function SegmentedInner<T extends string>(
  { label, options, value, onValueChange, thumb, option, estimate, onKeyDown, className, ...props }: SegmentedProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const at = Math.max(0, options.findIndex((o) => o.value === value))
  const radios = React.useRef<(HTMLButtonElement | null)[]>([])
  const [boxes, setBoxes] = React.useState<{ x: number; w: number }[]>([])
  useIsomorphicLayoutEffect(() => {
    // offsetLeft is physical in both directions, and so is the thumb's position below.
    const measure = () => setBoxes(radios.current.map((el) => ({ x: el?.offsetLeft ?? 0, w: el?.offsetWidth ?? 0 })))
    measure()
    const ro = new ResizeObserver(measure)
    radios.current.forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [options.length])
  // One ref callback per option, made once: the options' elements are measured and focused through them.
  const refFor = React.useMemo(
    () =>
      Array.from({ length: options.length }, (_, i) => (el: HTMLButtonElement | null) => {
        radios.current[i] = el
      }),
    [options.length]
  )
  const box = boxes[at]?.w ? boxes[at] : estimate?.(at)
  const move = (to: number) => {
    const k = (to + options.length) % options.length
    onValueChange(options[k]!.value)
    radios.current[k]?.focus()
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
        const step = { ArrowRight: rtl ? -1 : 1, ArrowDown: 1, ArrowLeft: rtl ? 1 : -1, ArrowUp: -1 }[e.key]
        if (step) {
          e.preventDefault()
          move(at + step)
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault()
          move(e.key === "Home" ? 0 : options.length - 1)
        }
      }}
      className={cn("relative", className)}
      {...props}
    >
      {box && thumb({ position: "absolute", left: 0, width: box.w, translate: `${box.x}px 0` })}
      {options.map((o, i) => {
        const on = i === at
        return (
          <React.Fragment key={o.value}>
            {option({
              option: o,
              on,
              index: i,
              props: {
                ref: refFor[i]!,
                type: "button",
                role: "radio",
                "aria-checked": on,
                "aria-label": o.ariaLabel,
                tabIndex: on ? 0 : -1,
                onClick: () => onValueChange(o.value),
              },
            })}
          </React.Fragment>
        )
      })}
    </div>
  )
}

const Segmented = React.forwardRef(SegmentedInner) as <T extends string>(
  props: SegmentedProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement

export { Segmented, type SegmentedOption, type SegmentedOptionProps, type SegmentedProps }
