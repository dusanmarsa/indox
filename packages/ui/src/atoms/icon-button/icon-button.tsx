import * as React from "react";
import { cn } from "../../cn";

type IconButtonProps = React.ComponentProps<"button"> & {
  /** Accessible label for screen readers when the button has no visible text. */
  "aria-label"?: string;
};

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, children, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      data-slot="icon-button"
      className={cn(
        "inline-flex size-[30px] items-center justify-center rounded-sm",
        "text-ink-3 transition-colors",
        "hover:bg-surface-2 hover:text-ink",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-soft",
        "disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export { IconButton };
export type { IconButtonProps };
