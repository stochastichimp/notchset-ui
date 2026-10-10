/**
 * Button (Notchset) v1.0.0 · Notchset
 * Docs: https://notchset.dev/components/button
 * MIT licensed: free to use, change and share.
 */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { ButtonClient } from "@/components/ui/notchset/button-client"

/*
 * Button (Radix build): shadcn's Button with motion and sound. Flat token fills, a press that
 * compresses to .96 and overshoots slightly on release, a tick on pointerdown, and an optional trailing
 * arrow that re-enters from the left on every press. Same exports, variants, sizes and data-slot as
 * shadcn, and server-safe like shadcn's: call buttonVariants() anywhere; the interactive part lives in
 * button-client.tsx.
 */

const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-transparent font-medium tracking-[var(--ns-tracking-control)] whitespace-nowrap outline-none select-none [transition:transform_var(--ns-time-press)_var(--ns-ease-press),scale_var(--ns-time-press)_var(--ns-ease-press),translate_var(--ns-time-press)_var(--ns-ease-press),rotate_var(--ns-time-press)_var(--ns-ease-press),background-color_var(--ns-time-color),color_var(--ns-time-color),border-color_var(--ns-time-color),text-decoration-color_.2s] not-disabled:active:scale-[var(--ns-press-depth)] focus-visible:ring-[length:var(--ns-focus-width,2px)] focus-visible:ring-[color:var(--ns-focus-color,var(--ring))] disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-[''] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_86%,var(--background))]",
        secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[color-mix(in_oklab,var(--secondary)_80%,var(--foreground))]",
        outline: "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)]",
        ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--accent)]",
        destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground,#fff)] hover:bg-[color-mix(in_oklab,var(--destructive)_86%,var(--background))] focus-visible:ring-[var(--destructive)]",
        link: "rounded-none border-0 bg-transparent px-2 text-[var(--foreground)] underline decoration-transparent underline-offset-[5px] hover:decoration-current",
      },
      size: {
        default: "h-[var(--ns-control-regular)] px-[var(--ns-inset-regular)] text-[length:var(--ns-type-copy)]",
        sm: "h-[var(--ns-control-compact)] gap-1.5 px-[var(--ns-inset-compact)] text-[length:var(--ns-type-label)]",
        lg: "h-[var(--ns-control-roomy)] px-[var(--ns-inset-roomy)] text-[15px]",
        icon: "size-[var(--ns-control-regular)] p-0",
        "icon-sm": "size-[var(--ns-control-compact)] p-0",
        "icon-lg": "size-[var(--ns-control-roomy)] p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

type ButtonProps = Omit<React.ComponentPropsWithoutRef<"button">, "ref"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (a link) with the button's styles and behaviour. */
    asChild?: boolean | undefined
    /** A trailing arrow that re-enters from the left on every press (Continue →). Not with asChild. */
    arrow?: boolean | undefined
    /** Play the press tick (inside a SoundProvider). Default true. */
    sound?: boolean | undefined
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "default", size = "default", arrow = false, ...props }, ref) {
  return <ButtonClient ref={ref} variant={variant ?? "default"} size={size ?? "default"} arrow={arrow} className={cn(buttonVariants({ variant, size }), arrow && "pe-3.5", className)} {...props} />
})

export { Button, buttonVariants, type ButtonProps }
