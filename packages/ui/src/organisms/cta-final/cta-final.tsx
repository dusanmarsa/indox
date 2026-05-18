import * as React from "react";
import { cn } from "../../cn";

type CtaFinalProps = Omit<React.ComponentProps<"section">, "title"> & {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  command?: React.ReactNode;
  prompt?: React.ReactNode;
  showGrid?: boolean;
  showGlow?: boolean;
};

function CtaFinal({
  title,
  subtitle,
  command,
  prompt = "$",
  showGrid = true,
  showGlow = true,
  className,
  children,
  ...props
}: CtaFinalProps) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    if (typeof command !== "string") return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(command).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  return (
    <section
      data-slot="cta-final"
      className={cn(
        "relative overflow-hidden border-t border-border px-8 pt-30 pb-[140px] text-center",
        className
      )}
      {...props}
    >
      {showGlow && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(192,90,61,0.18)_0%,transparent_60%)]"
        />
      )}
      {showGrid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(var(--indox-border)_1px,transparent_1px),linear-gradient(90deg,var(--indox-border)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_50%_50%,rgba(0,0,0,0.5)_0%,transparent_70%)]"
        />
      )}
      <div className="relative">
        <h2 className="indox-h-grad mb-7 text-[56px] leading-[1.05] font-semibold tracking-[-0.03em]">
          {title}
        </h2>
        {subtitle && (
          <p className="mx-auto mb-7 max-w-[560px] text-[17px] leading-[1.55] text-ink-2">
            {subtitle}
          </p>
        )}
        {command && (
          <div className="mt-3 inline-flex items-center gap-3.5 rounded-xl border border-border-strong bg-[rgba(8,9,11,0.7)] py-3.5 pr-2 pl-5 font-mono text-[14px] text-ink backdrop-blur-md">
            <span className="text-brand">{prompt}</span>
            <span>{command}</span>
            {typeof command === "string" && (
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "rounded-lg border px-3 py-1.5 font-mono text-[11.5px] transition-colors",
                  copied
                    ? "border-ok text-ok"
                    : "border-border text-ink-3 hover:border-ink-2 hover:text-ink"
                )}
              >
                {copied ? "copied" : "copy"}
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export { CtaFinal };
export type { CtaFinalProps };
