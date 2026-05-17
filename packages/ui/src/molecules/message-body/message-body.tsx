import * as React from "react";
import { Streamdown } from "streamdown";
import { Prose } from "../prose";
import { cn } from "../../cn";

type MessageBodyProps = Omit<React.ComponentProps<typeof Streamdown>, "children"> & {
  /** Markdown source (streaming-friendly). */
  children: string;
  /** Extra classes on the surrounding Prose wrapper. */
  className?: string;
};

/**
 * Streaming-friendly markdown body for chat messages. Wraps Streamdown with
 * design-system typography (Prose). Re-renders progressively as tokens arrive.
 */
function MessageBody({ children, className, ...props }: MessageBodyProps) {
  return (
    <Prose className={cn("message-body", className)}>
      <Streamdown {...props}>{children}</Streamdown>
    </Prose>
  );
}

export { MessageBody };
export type { MessageBodyProps };
