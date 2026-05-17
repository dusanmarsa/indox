import * as React from "react";
import { cn } from "../../cn";

type SkeletonProps = React.ComponentProps<"div">;

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-sm bg-surface-2", className)}
      {...props}
    />
  );
}

export { Skeleton };
export type { SkeletonProps };
