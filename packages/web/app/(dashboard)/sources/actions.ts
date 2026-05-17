"use server";

import { getSourceFiles, type SourceFile } from "@/lib/dashboard-data";
import { requireWorkspace } from "@/lib/session";

export async function fetchSourceFiles(sourceId: string): Promise<SourceFile[]> {
  const { workspace } = await requireWorkspace();
  return getSourceFiles(sourceId, workspace.id);
}
