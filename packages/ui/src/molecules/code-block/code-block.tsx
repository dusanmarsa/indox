import * as React from "react";
import { cn } from "../../cn";

type CodeBlockProps = React.ComponentProps<"div"> & {
  title?: React.ReactNode;
  copyValue?: string;
  onCopy?: () => void;
};

function CodeBlock({ title, copyValue, onCopy, className, children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    if (copyValue && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(copyValue).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
    onCopy?.();
  };

  return (
    <div
      data-slot="code-block"
      className={cn("overflow-hidden rounded-xl border border-border bg-elev", className)}
      {...props}
    >
      <div className="flex items-center gap-2 border-b border-border bg-white/[0.012] px-4 py-[11px]">
        <span aria-hidden className="size-[7px] rounded-full bg-ink-4" />
        <span aria-hidden className="size-[7px] rounded-full bg-ink-4" />
        <span aria-hidden className="size-[7px] rounded-full bg-ink-4" />
        {title && <span className="ml-1 font-mono text-[11.5px] text-ink-2">{title}</span>}
        {(copyValue || onCopy) && (
          <button
            type="button"
            onClick={handleCopy}
            className="ml-auto rounded-xs border border-border px-2.5 py-[3px] font-mono text-[10.5px] text-ink-3 transition-colors hover:border-ink-3 hover:text-ink"
          >
            {copied ? "copied" : "copy"}
          </button>
        )}
      </div>
      <pre className="overflow-x-auto px-5 py-[18px] font-mono text-[12.5px] leading-[1.85] text-ink">
        {children}
      </pre>
    </div>
  );
}

export { CodeBlock };
export type { CodeBlockProps };
