import { listConversations } from "@indox/core";
import { requireWorkspace } from "@/lib/session";
import ChatSidebar from "@/components/chat/Sidebar";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await requireWorkspace();
  const conversations = await listConversations({ workspaceId: workspace.id, userId: user.id }, 50);

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar conversations={conversations} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
