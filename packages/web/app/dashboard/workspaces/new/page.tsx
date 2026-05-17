import { NewWorkspaceForm } from "@/components/dashboard/NewWorkspaceForm";

export const dynamic = "force-dynamic";

export default function NewWorkspacePage() {
  return (
    <div className="max-w-[520px]">
      <div className="mb-9">
        <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">New workspace</h1>
        <p className="font-mono text-[13px] text-(--indox-muted)">
          A workspace is its own tenant — adapters, sources, MCP scope, and (optionally) a public chat URL.
        </p>
      </div>
      <NewWorkspaceForm />
    </div>
  );
}
