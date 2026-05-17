export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { FilterSegments, SortSegments } from "@/components/dashboard/LibraryFilters";
import { Button, DashboardHero, SearchField, Stat } from "@indox/ui";
import { getDashboardStats, getDashboardSources } from "@/lib/dashboard-data";
import { requireWorkspace } from "@/lib/session";
import { SourceCardsSkeleton } from "@/components/dashboard/skeletons";
import { TimeAgo } from "@/components/dashboard/TimeAgo";
import { LiveSourcesGrid } from "@/components/dashboard/LiveSourcesGrid";

export default async function DashboardOverview() {
  const { workspace } = await requireWorkspace();

  return (
    <div>
      <Suspense fallback={<HeroFallback workspaceSlug={workspace.slug} />}>
        <Hero workspaceId={workspace.id} workspaceSlug={workspace.slug} />
      </Suspense>

      <section className="flex flex-wrap items-center gap-3.5 border-t border-border py-5">
        <SearchField
          placeholder="Filter documents, paths, sources…"
          containerClassName="min-w-[280px] flex-1"
        />
        <FilterSegments />
        <SortSegments />
        <Button variant="soft">Filter</Button>
        <Button asChild variant="primary">
          <Link href={"/sources" as Route}>+ Add source</Link>
        </Button>
      </section>

      <Suspense fallback={<SourceCardsSkeleton />}>
        <SourcesGrid workspaceId={workspace.id} />
      </Suspense>
    </div>
  );
}

function HeroFallback({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <DashboardHero
      eyebrow={`Workspace · ${workspaceSlug}`}
      title="Knowledge library"
      lead="Everything Indox can search, in one place."
      stats={
        <>
          <Stat label="sources" value="—" />
          <Stat label="documents" value="—" />
          <Stat label="chunks" value="—" accent />
          <Stat label="last index" value="—" />
        </>
      }
    />
  );
}

async function Hero({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  const [stats, sources] = await Promise.all([
    getDashboardStats(workspaceId),
    getDashboardSources(workspaceId, 12),
  ]);
  const totalChunks = stats.totalChunks;
  const totalDocs = sources.reduce((acc, s) => acc + s.chunks, 0);
  const lastIndexedAt = sources.reduce<Date | null>((acc, s) => {
    if (!s.indexedAt) return acc;
    if (!acc || s.indexedAt > acc) return s.indexedAt;
    return acc;
  }, null);

  return (
    <DashboardHero
      eyebrow={`Workspace · ${workspaceSlug}`}
      title="Knowledge library"
      lead={
        <>
          Everything Indox can search, in one place. {sources.length || "No"}{" "}
          {sources.length === 1 ? "connector" : "connectors"}, {totalChunks.toLocaleString()}{" "}
          {totalChunks === 1 ? "chunk" : "chunks"}, indexed and ready.
        </>
      }
      stats={
        <>
          <Stat label="sources" value={sources.length} />
          <Stat label="documents" value={totalDocs.toLocaleString()} />
          <Stat label="chunks" value={totalChunks.toLocaleString()} accent />
          <Stat label="last index" value={<TimeAgo date={lastIndexedAt} />} />
        </>
      }
    />
  );
}

async function SourcesGrid({ workspaceId }: { workspaceId: string }) {
  const sources = await getDashboardSources(workspaceId, 12);
  return <LiveSourcesGrid initialSources={sources} limit={12} />;
}
