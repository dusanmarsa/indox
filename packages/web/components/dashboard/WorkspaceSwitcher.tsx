"use client";

import { useMemo, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { WorkspaceSwitcher as UiWorkspaceSwitcher, Tag } from "@indox/ui";

export type WorkspaceOption = {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
};

export function WorkspaceSwitcher({
  activeWorkspaceId,
  workspaces,
}: {
  activeWorkspaceId: string;
  workspaces: WorkspaceOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticId, setOptimisticId] = useOptimistic(activeWorkspaceId);

  const items = useMemo(
    () =>
      workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        badge: w.isPublic ? <Tag tone="outline">public</Tag> : undefined,
      })),
    [workspaces]
  );

  function switchTo(id: string) {
    if (id === optimisticId || isPending) return;
    startTransition(async () => {
      setOptimisticId(id);
      const res = await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        console.error("workspace switch failed", await res.text());
        return;
      }
      router.refresh();
    });
  }

  return (
    <UiWorkspaceSwitcher
      workspaces={items}
      activeId={optimisticId}
      onSelect={switchTo}
      onCreate={() => router.push("/workspaces/new" as Route)}
    />
  );
}
