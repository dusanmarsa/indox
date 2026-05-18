import * as React from "react";
import { cn } from "../../cn";

type AvatarSize = "sm" | "md" | "lg";
type AvatarVariant = "user" | "workspace" | "brand";

type AvatarProps = React.ComponentProps<"div"> & {
  size?: AvatarSize;
  variant?: AvatarVariant;
};

const SIZE: Record<AvatarSize, string> = {
  sm: "size-[22px] text-[10.5px] rounded-sm",
  md: "size-[30px] text-[13px] rounded-full",
  lg: "size-11 text-[17px] rounded-full",
};

const VARIANT: Record<AvatarVariant, string> = {
  user: "bg-[linear-gradient(135deg,var(--indox-ok),var(--indox-accent))] text-white font-semibold",
  workspace:
    "bg-[linear-gradient(135deg,var(--indox-accent),#8e3c28)] text-white font-semibold rounded-sm",
  brand: "bg-brand text-white font-mono font-bold",
};

function Avatar({ size = "md", variant = "user", className, children, ...props }: AvatarProps) {
  return (
    <div
      data-slot="avatar"
      data-size={size}
      data-variant={variant}
      className={cn(
        "inline-flex shrink-0 items-center justify-center select-none",
        SIZE[size],
        VARIANT[variant],
        // workspace overrides circle radius from SIZE
        variant === "workspace" && "rounded-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Avatar };
export type { AvatarProps, AvatarSize, AvatarVariant };
