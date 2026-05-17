import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "../../cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-mono font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-brand-soft disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-ink text-background hover:bg-white active:translate-y-px",
        ghost:
          "border border-overlay-3 bg-overlay-tint text-ink-2 hover:text-ink hover:border-border-strong hover:bg-overlay-1",
        soft: "border border-border text-ink-2 hover:text-ink hover:border-border-strong hover:bg-surface-2",
        accent: "bg-brand text-white hover:opacity-90",
        dim: "bg-surface-2 text-ink-3 pointer-events-none",
      },
      size: {
        sm: "rounded-sm px-3.5 py-[7px] text-[12px]",
        md: "rounded-full px-4 py-2.5 text-[13px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

function Button({
  className,
  variant = "primary",
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";
  const sz: ButtonSize = size ?? (variant === "soft" ? "sm" : "md");

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={sz}
      className={cn(buttonVariants({ variant, size: sz, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonVariant, ButtonSize };
