import * as React from "react";
import { cn } from "../../cn";
import { Avatar } from "../../atoms/avatar";
import { ChatTypingIndicator } from "../../atoms/chat-typing-indicator";

type ChatRole = "user" | "bot";
type ChatMessageStatus = "complete" | "streaming" | "error";

type ChatMessageProps = React.ComponentProps<"div"> & {
  role: ChatRole;
  status?: ChatMessageStatus;
  author?: React.ReactNode;
  when?: React.ReactNode;
  avatar?: React.ReactNode;
  /** Reasoning blocks rendered above the message body. */
  thinking?: React.ReactNode;
  /** Tool calls rendered above the message body. */
  toolCalls?: React.ReactNode;
  /** Attachments (files, images) rendered above the message body. */
  attachments?: React.ReactNode;
  /** Citation card rendered below the message body. */
  citations?: React.ReactNode;
  /** Inline actions (copy, retry, regenerate) under the message. */
  actions?: React.ReactNode;
  /** Custom typing label shown while `status === "streaming"`. */
  typingLabel?: React.ReactNode;
  /** Optional error content shown when `status === "error"`. */
  error?: React.ReactNode;
};

function ChatMessage({
  role,
  status = "complete",
  author,
  when,
  avatar,
  thinking,
  toolCalls,
  attachments,
  citations,
  actions,
  typingLabel = "thinking",
  error,
  className,
  children,
  ...props
}: ChatMessageProps) {
  const isStreaming = status === "streaming";
  const isError = status === "error";
  return (
    <div
      data-slot="chat-message"
      data-role={role}
      data-status={status}
      className={cn("grid grid-cols-[32px_1fr] gap-4", className)}
      {...props}
    >
      <div className="mt-0.5">
        {avatar ?? (
          <Avatar variant={role === "bot" ? "brand" : "user"} size="md" className="text-[12.5px]">
            {role === "bot" ? "i" : "M"}
          </Avatar>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="flex items-baseline gap-2 text-[13px] font-medium tracking-[-0.005em] text-ink">
          {author ?? (role === "bot" ? "indox" : "you")}
          <span className="font-mono text-[10.5px] font-normal tracking-[0.06em] text-ink-3 uppercase">
            {role}
          </span>
          {when && (
            <span className="ml-auto font-mono text-[10.5px] font-normal text-ink-3">{when}</span>
          )}
        </div>

        {attachments && <div>{attachments}</div>}
        {thinking && <div>{thinking}</div>}
        {toolCalls && <div className="flex flex-col gap-2">{toolCalls}</div>}

        {children && (
          <div
            className={cn(
              "text-[14.5px] leading-[1.65] tracking-[-0.005em] text-pretty",
              role === "user" ? "text-ink-2" : "text-ink"
            )}
          >
            {children}
            {isStreaming && (
              <span
                aria-hidden
                className="ml-1 inline-block h-[1.1em] w-0.5 translate-y-0.5 animate-pulse bg-brand align-middle"
              />
            )}
          </div>
        )}

        {isStreaming && !children && <ChatTypingIndicator label={typingLabel} />}

        {isError && <div className="text-[13px] text-bad">{error ?? "Generation failed."}</div>}

        {citations}
        {actions && <div className="mt-1 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export { ChatMessage };
export type { ChatMessageProps, ChatRole, ChatMessageStatus };
