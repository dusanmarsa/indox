import { notFound } from "next/navigation";
import {
  getWorkspaceSettings,
  getWorkspaceUsageToday,
  listUserWorkspaces,
  ALLOWED_MODELS,
} from "@indox/core";
import { requireWorkspace } from "@/lib/session";
import { WorkspaceSettingsForm } from "@/components/dashboard/WorkspaceSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { user, workspace } = await requireWorkspace();
  const [settings, usageToday, allWorkspaces] = await Promise.all([
    getWorkspaceSettings(workspace.id),
    getWorkspaceUsageToday(workspace.id),
    listUserWorkspaces(user.id),
  ]);
  if (!settings) notFound();

  // Public chats live at /w/<slug>. Construct the absolute URL for the
  // "share" copy button using a generic origin placeholder — the client
  // component reads window.location.origin at render so this works for any
  // deployment.
  return (
    <div className="max-w-[680px]">
      <div className="mb-9">
        <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">
          {settings.name} · settings
        </h1>
        <p className="font-mono text-[13px] text-(--indox-muted)">
          Per-workspace knobs. Each workspace is its own search corpus, its own
          MCP scope, and (optionally) its own public chat surface.
        </p>
      </div>

      <WorkspaceSettingsForm
        settings={settings}
        usageToday={usageToday}
        allowedModels={[...ALLOWED_MODELS]}
        canDelete={allWorkspaces.length > 1}
      />
    </div>
  );
}
