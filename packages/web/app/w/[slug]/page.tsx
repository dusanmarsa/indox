import { notFound } from "next/navigation";
import { getWorkspaceBySlug, listSources } from "@indox/core";
import { ChatProvider } from "@/components/chat/context";
import ChatArea from "@/components/chat/Area";
import ChatInput from "@/components/chat/Input";
import Link from "next/link";

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
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-(--indox-border) bg-(--indox-surface)">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-[13px] text-foreground">
                {ws.name}
              </p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-(--indox-dim)">
                public chat · {initialSources.length} source
                {initialSources.length === 1 ? "" : "s"} · powered by indox
              </p>
            </div>
            <Link
              href="/"
              className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-foreground"
            >
              indox<span className="text-(--indox-accent)">.</span>
            </Link>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6">
          {initialSources.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="max-w-sm text-center font-mono text-[12px] text-(--indox-dim)">
                This workspace doesn&apos;t have any indexed sources yet. The
                owner needs to add at least one before chat works.
              </p>
            </div>
          ) : (
            <>
              <ChatArea />
              <ChatInput />
            </>
          )}
        </div>
      </div>
    </ChatProvider>
  );
}
