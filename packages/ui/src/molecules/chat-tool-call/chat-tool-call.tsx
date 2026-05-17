import * as React from "react";
import { cn } from "../../cn";

type ToolCallStatus = "pending" | "running" | "done" | "error";

type ChatToolCallProps = Omit<React.ComponentProps<"details">, "name"> & {
  name: React.ReactNode;
  status?: ToolCallStatus;
  args?: React.ReactNode;
  result?: React.ReactNode;
  defaultOpen?: boolean;
};

const STATUS: Record<ToolCallStatus, { dot: string; label: string }> = {
  pending: { dot: "bg-ink-3", label: "pending" },
  running: {
    dot: "bg-brand indox-pulse",
    label: "running",
  },
  done: { dot: "bg-ok", label: "done" },
  error: { dot: "bg-bad", label: "error" },
};

function ChatToolCall({
  name,
  status = "done",
  args,
  result,
  defaultOpen = false,
  className,
  ...props
}: ChatToolCallProps) {
  const s = STATUS[status];
  return (
    <details
      data-slot="chat-tool-call"
      data-status={status}
      open={defaultOpen}
      className={cn("group rounded-md border border-border bg-surface", className)}
      {...props}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3.5 py-2 font-mono text-[12px] text-ink-2 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className={cn("size-1.5 rounded-full", s.dot)} />
        <span className="text-ink">{name}</span>
        <span className="text-[10.5px] tracking-[0.06em] text-ink-3 uppercase">{s.label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="ml-auto text-ink-3 transition-transform group-open:rotate-180"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </summary>
      <div className="flex flex-col gap-2 border-t border-border p-3.5 text-[12px]">
        {args !== undefined && (
          <div>
            <div className="mb-1 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
              Args
            </div>
            <pre className="overflow-x-auto rounded-xs bg-elev p-2.5 font-mono text-[11.5px] leading-[1.6] text-ink-2">
              {args}
            </pre>
          </div>
        )}
        {result !== undefined && (
          <div>
            <div className="mb-1 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
              Result
            </div>
            <pre className="overflow-x-auto rounded-xs bg-elev p-2.5 font-mono text-[11.5px] leading-[1.6] text-ink-2">
              {result}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}

export { ChatToolCall };
export type { ChatToolCallProps, ToolCallStatus };
