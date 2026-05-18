import { notFound } from "next/navigation";
import type { UIMessage } from "ai";
import { ChatHeader, IconButton } from "@indox/ui";
import { Share2, Settings, MoreHorizontal } from "lucide-react";
import { getConversation } from "@indox/core";
import { requireWorkspace } from "@/lib/session";
import { ChatProvider } from "@/components/chat/context";
import ChatArea from "@/components/chat/Area";
import ChatInput from "@/components/chat/Input";

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, workspace } = await requireWorkspace();
  const conv = await getConversation(id, { workspaceId: workspace.id, userId: user.id });
  if (!conv) notFound();

  // Persisted `parts` round-trip as JSON — re-tag as UIMessage so the chat
  // provider hydrates with the same shape it streams.
  const initialMessages: UIMessage[] = conv.messages.map((m) => ({
    id: m.id,
    role: m.role as UIMessage["role"],
    parts: m.parts as UIMessage["parts"],
  }));

  return (
    <ChatProvider conversationId={id} initialMessages={initialMessages}>
      <div className="flex h-full min-h-0 flex-col">
        <ChatHeader
          title={conv.summary.title ?? "Untitled"}
          stats={
            <span>
              <b>{conv.messages.length}</b> messages
            </span>
          }
          actions={
            <>
              <IconButton aria-label="Share">
                <Share2 className="size-3.5" />
              </IconButton>
              <IconButton aria-label="Settings">
                <Settings className="size-3.5" />
              </IconButton>
              <IconButton aria-label="More">
                <MoreHorizontal className="size-3.5" />
              </IconButton>
            </>
          }
        />
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-gutter-stable scrollbar-thin scrollbar-thumb-border scrollbar-thumb-border-strong">
          <div className="mx-auto max-w-3xl px-6 py-10">
            <ChatArea />
          </div>
        </div>
        <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent">
          <div className="mx-auto max-w-3xl px-6 pt-4 pb-6">
            <ChatInput />
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}
