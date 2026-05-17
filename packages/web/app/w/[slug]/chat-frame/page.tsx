import { notFound } from "next/navigation";
import { getWorkspaceBySlug, listSources } from "@indox/core";
import { ChatProvider } from "@/components/chat/context";
import ChatArea from "@/components/chat/Area";
import ChatInput from "@/components/chat/Input";

export const dynamic = "force-dynamic";

export default async function ChatFramePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ws = await getWorkspaceBySlug(slug);
  if (!ws || !ws.isPublic) notFound();

  const sources = await listSources({ readyOnly: true, workspaceId: ws.id });
  const initialSources = sources.map((s) => ({
    id: s.id,
    displayName: s.displayName,
    externalId: s.externalId,
    kind: s.kind,
  }));

  return (
    <ChatProvider publicWorkspaceSlug={ws.slug} initialSources={initialSources}>
      <div
        className="flex h-screen min-h-0 flex-col overflow-hidden bg-background"
        suppressHydrationWarning
      >
        {initialSources.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <p className="max-w-sm text-center font-mono text-[12px] text-ink-3">
              No indexed sources yet.
            </p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]">
              <div className="px-4 py-6">
                <ChatArea />
              </div>
            </div>
            <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent">
              <div className="px-4 pb-4 pt-2">
                <ChatInput />
              </div>
            </div>
          </>
        )}
      </div>
    </ChatProvider>
  );
}
