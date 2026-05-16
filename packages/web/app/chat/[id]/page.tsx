import { notFound } from "next/navigation";
import type { UIMessage } from "ai";
import { getConversation } from "@indox/core";
import { requireOwnerKey } from "@/lib/session";
import { ChatProvider } from "@/components/chat/context";
import ChatArea from "@/components/chat/Area";
import ChatInput from "@/components/chat/Input";

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ownerKey = await requireOwnerKey();
  const conv = await getConversation(id, ownerKey);
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
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6">
        <ChatArea />
        <ChatInput />
      </div>
    </ChatProvider>
  );
}
