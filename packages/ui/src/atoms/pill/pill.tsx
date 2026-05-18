import * as React from "react";
import { cn } from "../../cn";

type PillTone = "neutral" | "ok" | "warn" | "bad" | "info";

type PillProps = React.ComponentProps<"span"> & {
  tone?: PillTone;
  showDot?: boolean;
};

const TONE: Record<PillTone, { text: string; dot: string; pulse?: boolean }> = {
  neutral: {
    text: "text-ink-2",
    dot: "bg-ink-3",
  },
  ok: {
    text: "text-ok",
    dot: "bg-ok shadow-[0_0_6px_var(--indox-ok)]",
    pulse: true,
  },
  warn: {
    text: "text-warn",
    dot: "bg-warn",
  },
  bad: {
    text: "text-bad",
    dot: "bg-bad shadow-[0_0_8px_rgba(200,74,69,0.4)]",
  },
  info: {
    text: "text-info",
    dot: "bg-info",
  },
};

function Pill({ tone = "neutral", showDot = true, className, children, ...props }: PillProps) {
  const t = TONE[tone];
  return (
    <span
      data-slot="pill"
      data-tone={tone}
      className={cn(
        "inline-flex items-center gap-[7px] rounded-full border border-border bg-surface-2 px-2.5 py-1 font-mono text-[11px] tracking-[0.02em]",
        t.text,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          aria-hidden
          className={cn("size-[5px] shrink-0 rounded-full", t.dot, t.pulse && "indox-pulse")}
        />
      )}
      {children}
    </span>
  );
}

export { Pill };
export type { PillTone, PillProps };
