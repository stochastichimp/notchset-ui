"use client"

/**
 * Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/button
 * MIT licensed: free to use, change and share.
 */

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { useSound } from "@/lib/notchset/sound"

/*
 * The interactive half of Button (Base UI build): the press tick and the re-entering arrow.
 * button.tsx composes the classes (server-safe, like shadcn's buttonVariants) and renders this.
 */

type ButtonClientProps = ButtonPrimitive.Props & {
  variant: string
  size: string
  /** A trailing arrow that re-enters from the left on every press (Continue →). */
    arrow?: boolean | undefined
    /** Play the press tick (inside a SoundProvider). Default true. */
    sound?: boolean | undefined
  }

const ButtonClient = React.forwardRef<HTMLElement, ButtonClientProps>(function ButtonClient(
  { className, variant, size, arrow = false, sound = true, onPointerDown, onClick, children, ...props },
  ref
) {
  const { sfx } = useSound(sound)
  const [presses, setPresses] = React.useState(0)
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      data-notchset=""
      data-variant={variant}
      data-size={size}
      className={className}
      onPointerDown={(event) => {
        sfx.tick()
        onPointerDown?.(event)
      }}
      onClick={(event) => {
        if (arrow) setPresses((n) => n + 1)
        onClick?.(event)
      }}
      {...props}
    >
      {children}
      {arrow && (
        <span aria-hidden="true" className="block size-4 overflow-hidden">
          <svg
            key={presses}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="block size-4 animate-[ns-arrow-in_.45s_cubic-bezier(.2,1.4,.4,1)] rtl:-scale-x-100"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      )}
    </ButtonPrimitive>
  )
})

export { ButtonClient, type ButtonClientProps }
