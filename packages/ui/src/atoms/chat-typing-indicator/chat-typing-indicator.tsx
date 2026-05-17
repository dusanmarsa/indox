import * as React from "react";
import { cn } from "../../cn";

type ChatTypingIndicatorProps = React.ComponentProps<"span"> & {
  label?: React.ReactNode;
};

function ChatTypingIndicator({ label, className, ...props }: ChatTypingIndicatorProps) {
  return (
    <span
      role="status"
      aria-label={typeof label === "string" ? label : "Generating"}
      data-slot="chat-typing-indicator"
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.04em] text-ink-3",
        className
      )}
      {...props}
    >
      <span className="inline-flex gap-1" aria-hidden>
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="size-[5px] animate-pulse rounded-full bg-ink-3"
            style={{ animationDelay: `${d}ms`, animationDuration: "900ms" }}
          />
        ))}
      </span>
      {label}
      <style>{`@keyframes indox-typing{0%,100%{opacity:.35}50%{opacity:1}}[data-slot="chat-typing-indicator"] span[style*="animationDelay"]{animation:indox-typing .9s ease-in-out infinite}`}</style>
    </span>
  );
}

export { ChatTypingIndicator };
export type { ChatTypingIndicatorProps };
