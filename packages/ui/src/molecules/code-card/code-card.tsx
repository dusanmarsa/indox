"use client";

import * as React from "react";
import { cn } from "../../cn";

type CodeCardProps = Omit<React.ComponentProps<"div">, "title"> & {
  title?: React.ReactNode;
  copyValue?: string;
  showCopy?: boolean;
};

/**
 * Code block with a labelled header bar (no mac-style 3 dots) and a copy
 * button. Used in landing self-host + final CTA. Pair with `<Code.*>` spans
 * inside `children` for syntax coloring.
 */
function CodeCard({
  title,
  copyValue,
  showCopy = true,
  className,
  children,
  ...props
}: CodeCardProps) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    if (!copyValue || typeof navigator === "undefined") return;
    navigator.clipboard.writeText(copyValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      data-slot="code-card"
      className={cn("overflow-hidden rounded-md border border-border bg-elev", className)}
      {...props}
    >
      {(title || (showCopy && copyValue)) && (
        <div className="flex items-center gap-3 border-b border-border bg-white/[0.012] px-4 py-2.5">
          {title && <span className="font-mono text-[11.5px] text-ink-2">{title}</span>}
          {showCopy && copyValue && (
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "ml-auto rounded-xs border px-2.5 py-[3px] font-mono text-[10.5px] transition-colors",
                copied
                  ? "border-ok text-ok"
                  : "border-border text-ink-3 hover:border-ink-3 hover:text-ink"
              )}
            >
              {copied ? "copied" : "copy"}
            </button>
          )}
        </div>
      )}
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-[1.85] text-ink">
        {children}
      </pre>
    </div>
  );
}

export { CodeCard };
export type { CodeCardProps };
