"use server";

import { getSourceFiles, type SourceFile } from "@/lib/dashboard-data";
import { requireOwnerKey } from "@/lib/session";

export async function fetchSourceFiles(sourceId: string): Promise<SourceFile[]> {
  const ownerKey = await requireOwnerKey();
  return getSourceFiles(sourceId, ownerKey);
}
