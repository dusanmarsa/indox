import * as React from "react";
import { cn } from "../../cn";

type ChatThinkingProps = React.ComponentProps<"div"> & {
  label?: React.ReactNode;
  /** When true, render an animated dot trio. Default true. */
  streaming?: boolean;
};

/**
 * Reasoning/awaiting-first-token indicator. Deliberately *not* shaped like a
 * tool-call card — a card would imply "this is a step that produced output".
 * Instead we render a compact mono line with a pulsing dot trio so the chat
 * thread reads as "the agent is still working" without competing with the
 * tool-call list visually.
 */
function ChatThinking({
  label = "Thinking",
  streaming = true,
  className,
  ...props
}: ChatThinkingProps) {
  return (
    <div
      data-slot="chat-thinking"
      data-streaming={streaming}
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11.5px] tracking-[0.04em] text-ink-3",
        className
      )}
      {...props}
    >
      <span className="inline-flex gap-[3px]" aria-hidden>
        <span className={cn("size-1 rounded-full bg-ink-3", streaming && "indox-thinking-dot")} />
        <span
          className={cn(
            "size-1 rounded-full bg-ink-3",
            streaming && "indox-thinking-dot [animation-delay:0.15s]"
          )}
        />
        <span
          className={cn(
            "size-1 rounded-full bg-ink-3",
            streaming && "indox-thinking-dot [animation-delay:0.3s]"
          )}
        />
      </span>
      <span>{label}…</span>
    </div>
  );
}

export { ChatThinking };
export type { ChatThinkingProps };
