import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getWorkspaceSettings,
  getWorkspaceUsageToday,
  listUserWorkspaces,
  ALLOWED_MODELS,
} from "@indox/core";
import { PageHead } from "@indox/ui";
import { requireWorkspace } from "@/lib/session";
import { WorkspaceSettingsForm } from "@/components/dashboard/WorkspaceSettingsForm";
import { StackedFormSkeleton } from "@/components/dashboard/skeletons";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { user, workspace } = await requireWorkspace();

  return (
    <div className="max-w-[680px]">
      <Suspense
        fallback={
          <>
            <PageHead title="settings" subtitle="loading workspace settings…" />
            <StackedFormSkeleton />
          </>
        }
      >
        <SettingsBody userId={user.id} workspaceId={workspace.id} />
      </Suspense>
    </div>
  );
}

async function SettingsBody({ userId, workspaceId }: { userId: string; workspaceId: string }) {
  const [settings, usageToday, allWorkspaces] = await Promise.all([
    getWorkspaceSettings(workspaceId),
    getWorkspaceUsageToday(workspaceId),
    listUserWorkspaces(userId),
  ]);
  if (!settings) notFound();

  return (
    <>
      <PageHead
        title={`${settings.name} · settings`}
        subtitle="Per-workspace knobs. Each workspace is its own search corpus, its own MCP scope, and (optionally) its own public chat surface."
      />
      <WorkspaceSettingsForm
        settings={settings}
        usageToday={usageToday}
        allowedModels={[...ALLOWED_MODELS]}
        canDelete={allWorkspaces.length > 1}
      />
    </>
  );
}
