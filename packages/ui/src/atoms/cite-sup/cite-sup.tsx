import * as React from "react";
import { cn } from "../../cn";

type CiteSupProps = Omit<React.ComponentProps<"button">, "children"> & {
  index: number | string;
};

function CiteSup({ index, className, ...props }: CiteSupProps) {
  return (
    <button
      type="button"
      data-slot="cite-sup"
      className={cn(
        "inline-flex cursor-pointer px-0.5 align-super font-mono text-[0.65em] text-brand hover:underline",
        className
      )}
      {...props}
    >
      [{index}]
    </button>
  );
}

export { CiteSup };
export type { CiteSupProps };
