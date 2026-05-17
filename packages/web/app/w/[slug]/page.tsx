import { notFound } from "next/navigation";
import Link from "next/link";
import { ChatHeader, Pill } from "@indox/ui";
import { getWorkspaceBySlug, listSources } from "@indox/core";
import { ChatProvider } from "@/components/chat/context";
import ChatArea from "@/components/chat/Area";
import ChatInput from "@/components/chat/Input";

export const dynamic = "force-dynamic";

// Public chat surface. No auth, no sidebar, no persisted history. Every
// message in this provider tags the chat body with `workspaceSlug`; the
// chat route enforces the public-workspace path and rate-limits per IP.

export default async function PublicWorkspaceChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ws = await getWorkspaceBySlug(slug);
  // 404 (not 403) when not public so anonymous visitors can't enumerate
  // private workspaces by slug.
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
      <div className="flex h-screen min-h-0 flex-col overflow-hidden">
        <ChatHeader
          title={ws.name}
          stats={
            <div className="flex items-center gap-2">
              <Pill tone="ok">public</Pill>
              <span>
                <b>{initialSources.length}</b> source
                {initialSources.length === 1 ? "" : "s"}
              </span>
            </div>
          }
          actions={
            <Link
              href="/"
              className="font-mono text-[11px] text-ink-2 transition-colors hover:text-ink"
            >
              indox<span className="text-brand">.</span>
            </Link>
          }
        />
        {initialSources.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <p className="max-w-sm text-center font-mono text-[12px] text-ink-3">
              This workspace doesn&apos;t have any indexed sources yet. The owner needs to add at
              least one before chat works.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="mx-auto max-w-3xl px-6 py-10">
                <ChatArea />
              </div>
            </div>
            <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent">
              <div className="mx-auto max-w-3xl px-6 pt-4 pb-6">
                <ChatInput />
              </div>
            </div>
          </>
        )}
      </div>
    </ChatProvider>
  );
}
