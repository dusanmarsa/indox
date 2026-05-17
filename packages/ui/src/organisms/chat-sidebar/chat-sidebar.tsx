import * as React from "react";
import { cn } from "../../cn";
import { Brandmark } from "../../atoms/brandmark";

type ChatSidebarSection = {
  heading?: React.ReactNode;
  items: React.ReactNode;
};

type ChatSidebarProps = React.ComponentProps<"aside"> & {
  scope?: React.ReactNode;
  onNewChat?: () => void;
  newChatLabel?: React.ReactNode;
  search?: React.ReactNode;
  sections?: ChatSidebarSection[];
  bottom?: React.ReactNode;
};

function ChatSidebar({
  scope,
  onNewChat,
  newChatLabel = "+ New conversation",
  search,
  sections = [],
  bottom,
  className,
  children,
  ...props
}: ChatSidebarProps) {
  return (
    <aside
      data-slot="chat-sidebar"
      className={cn("flex w-[260px] flex-col border-r border-border bg-elev", className)}
      {...props}
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <Brandmark size="md" />
          {scope && <span className="font-mono text-[11px] text-ink-3">{scope}</span>}
        </div>
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-2 rounded-md bg-brand px-3 py-2 font-mono text-[12px] font-medium text-white transition-colors hover:bg-[#d76a4c]"
        >
          {newChatLabel}
        </button>
        {search && <div>{search}</div>}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {sections.map((sec, i) => (
          <div key={i} className="mb-3">
            {sec.heading && (
              <div className="px-2 pt-2 pb-1 font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase">
                {sec.heading}
              </div>
            )}
            <div>{sec.items}</div>
          </div>
        ))}
        {children}
      </div>
      {bottom && (
        <div className="flex items-center gap-2.5 border-t border-border px-3.5 py-3 font-mono text-[11px] text-ink-3">
          {bottom}
        </div>
      )}
    </aside>
  );
}

export { ChatSidebar };
export type { ChatSidebarProps, ChatSidebarSection };
