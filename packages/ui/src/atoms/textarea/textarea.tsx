import * as React from "react";

import { cn } from "../../cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "block w-full min-h-[88px] resize-y appearance-none rounded-md border border-border bg-surface px-3.5 py-2.5 font-sans text-[14px] text-ink outline-none transition-[border-color,box-shadow] duration-150",
        "placeholder:text-ink-3",
        "focus:border-brand focus:shadow-[0_0_0_3px_var(--indox-accent-soft)]",
        "disabled:opacity-45 disabled:pointer-events-none",
        "aria-invalid:border-bad aria-invalid:shadow-[0_0_0_3px_rgba(200,74,69,0.12)]",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
