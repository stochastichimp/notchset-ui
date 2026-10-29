// Notchset icon-button 2.0.0 · https://notchset.dev/changelog
"use client";
import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/notchset/button";
import { Tooltip } from "@/components/ui/notchset/tooltip";

/*
 * Icon button: a square Button holding one icon. `label` is required: it is the button's accessible name and
 * the tooltip a pointer user sees, so the two can never disagree.
 */
type IconButtonProps = Omit<ButtonProps, "square" | "aria-label"> & { label: string; tooltip?: boolean | undefined };

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ label, tooltip = true, ...props }, ref) {
  const button = <Button ref={ref} square aria-label={label} data-slot="icon-button" {...props} />;
  return tooltip ? <Tooltip label={label}>{button}</Tooltip> : button;
});

export { IconButton, type IconButtonProps };
