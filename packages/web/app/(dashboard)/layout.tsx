import { listUserWorkspaces } from "@indox/core";
import { DashTabsNav } from "@/components/dashboard/DashTabsNav";
import { DashCommandPaletteLazy } from "@/components/dashboard/DashCommandPaletteLazy";
import { ChatWidgetLazy } from "@/components/chat/WidgetLazy";
import { getDashboardAdapters, getDashboardSources } from "@/lib/dashboard-data";
import { requireWorkspace } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await requireWorkspace();
  const [workspaces, sources, adapters] = await Promise.all([
    listUserWorkspaces(user.id),
    getDashboardSources(workspace.id),
    getDashboardAdapters(workspace.id),
  ]);

  return (
    <div className="min-h-screen">
      <DashTabsNav
        activeWorkspaceId={workspace.id}
        workspaces={workspaces.map((w) => ({
          id: w.id,
          name: w.name,
          slug: w.slug,
          isPublic: w.isPublic,
        }))}
        userInitial={(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
      />
      <main className="mx-auto max-w-[1320px] px-4 pt-6 pb-12 sm:px-8 sm:pt-8 sm:pb-16 lg:px-12 lg:pt-10 lg:pb-20">
        {children}
      </main>
      <DashCommandPaletteLazy
        activeWorkspaceId={workspace.id}
        workspaces={workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug }))}
        sources={sources.map((s) => ({
          id: s.id,
          adapterId: s.adapterId,
          displayName: s.displayName,
          type: s.type,
        }))}
        adapters={adapters.map((a) => ({ id: a.id, kind: a.kind }))}
      />
      <ChatWidgetLazy />
    </div>
  );
}
