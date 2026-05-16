import { listConversations } from "@indox/core";
import { requireOwnerKey } from "@/lib/session";
import ChatSidebar from "@/components/chat/Sidebar";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ownerKey = await requireOwnerKey();
  const conversations = await listConversations(ownerKey, 50);

  return (
    <div className="flex min-h-screen">
      <ChatSidebar conversations={conversations} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
