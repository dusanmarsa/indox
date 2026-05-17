import { listUserWorkspaces } from "@indox/core";
import { DashNav } from "@/components/dashboard/DashNav";
import { DashSidebar } from "@/components/dashboard/DashSidebar";
import { requireWorkspace } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await requireWorkspace();
  const workspaces = await listUserWorkspaces(user.id);
  return (
    <>
      <DashNav />
      <div className="flex overflow-hidden" style={{ height: "calc(100vh - 54px)", marginTop: 54 }}>
        <DashSidebar
          activeWorkspaceId={workspace.id}
          workspaces={workspaces.map((w) => ({
            id: w.id,
            name: w.name,
            slug: w.slug,
            isPublic: w.isPublic,
          }))}
        />
        <main className="flex-1 overflow-y-auto px-12 py-10 pb-16">
          {children}
        </main>
      </div>
    </>
  );
}
