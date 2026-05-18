import { PageHead } from "@indox/ui";
import { NewWorkspaceForm } from "@/components/dashboard/NewWorkspaceForm";

export const dynamic = "force-dynamic";

export default function NewWorkspacePage() {
  return (
    <div className="max-w-[520px]">
      <PageHead
        title="New workspace"
        subtitle="A workspace is its own tenant — adapters, sources, MCP scope, and (optionally) a public chat URL."
      />
      <NewWorkspaceForm />
    </div>
  );
}
