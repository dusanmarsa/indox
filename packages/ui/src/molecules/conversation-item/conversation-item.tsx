import * as React from "react";
import { cn } from "../../cn";

type ConversationItemProps = Omit<React.ComponentProps<"button">, "title"> & {
  title: React.ReactNode;
  preview?: React.ReactNode;
  active?: boolean;
  unread?: boolean;
  pinned?: boolean;
};

function ConversationItem({
  title,
  preview,
  active = false,
  unread = false,
  pinned = false,
  className,
  ...props
}: ConversationItemProps) {
  return (
    <button
      type="button"
      data-slot="conversation-item"
      data-state={active ? "active" : "inactive"}
      className={cn(
        "relative block w-full cursor-pointer rounded-md px-2.5 py-2.5 text-left transition-colors",
        active ? "bg-surface-2" : "hover:bg-surface-2",
        className
      )}
      {...props}
    >
      {active && (
        <span aria-hidden className="absolute top-2 bottom-2 left-0 w-0.5 rounded-[2px] bg-brand" />
      )}
      {unread && (
        <span aria-hidden className="absolute top-3.5 right-2.5 size-1.5 rounded-full bg-brand" />
      )}
      <div
        className={cn(
          "mb-0.5 truncate text-[13.5px] tracking-[-0.005em]",
          unread || active ? "text-ink" : "text-ink"
        )}
      >
        {title}
      </div>
      {preview && (
        <div className="truncate font-mono text-[11px] text-ink-3">
          {pinned && <span className="text-brand">📌 </span>}
          {preview}
        </div>
      )}
    </button>
  );
}

export { ConversationItem };
export type { ConversationItemProps };
