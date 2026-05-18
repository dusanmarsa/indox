"use client";

import Link from "next/link";
import type { Route } from "next";
import { SourceCard, SourceCardAdd } from "@indox/ui";
import type { DashboardSource, SourceStatus } from "@/lib/dashboard-data";
import { TimeAgo } from "./TimeAgo";
import { useLiveSources } from "./useLiveSources";

const TYPE_TAG = {
  github: { glyph: "GH" },
  filesystem: { glyph: "FS" },
  postgres: { glyph: "PG" },
  s3: { glyph: "S3" },
  gdrive: { glyph: "GD" },
};

function statusLabel(s: SourceStatus) {
  if (s === "ready") return "indexed";
  if (s === "indexing") return "indexing";
  if (s === "failed") return "failed";
  return "idle";
}

function cardStatus(s: SourceStatus): "ok" | "warn" | "syncing" | "bad" {
  if (s === "ready") return "ok";
  if (s === "indexing") return "syncing";
  if (s === "failed") return "bad";
  return "warn";
}

function bytesLabel(n: number) {
  if (n >= 1024 * 1024 * 1024) return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(0)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

export function LiveSourcesGrid({
  initialSources,
  limit,
}: {
  initialSources: DashboardSource[];
  limit?: number;
}) {
  const sources = useLiveSources(initialSources, { limit });
  const indexedCount = sources.filter((s) => s.status === "ready").length;

  return (
    <section>
      <div className="mt-10 mb-5 flex items-baseline justify-between">
        <h3 className="text-[19px] font-medium tracking-[-0.015em] text-ink">
          Sources
          <span className="ml-2.5 font-mono text-[12px] font-normal text-ink-3">
            {sources.length} connectors · {indexedCount} indexed
          </span>
        </h3>
        <Link
          href={"/sources" as Route}
          className="rounded-sm px-3 py-[5px] font-mono text-[12px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
        {sources.map((s) => {
          const meta = TYPE_TAG[s.type as keyof typeof TYPE_TAG] ?? TYPE_TAG.filesystem;
          return (
            <SourceCard
              key={s.id}
              icon={<span className="font-mono text-[11px] tracking-[0.06em]">{meta.glyph}</span>}
              status={cardStatus(s.status)}
              statusLabel={statusLabel(s.status)}
              title={s.path}
              description={
                <>
                  {s.type} · last indexed <TimeAgo date={s.indexedAt} />
                </>
              }
              stats={[
                { label: "docs", value: s.chunks > 0 ? Math.ceil(s.chunks / 6) : 0 },
                { label: "chunks", value: s.chunks.toLocaleString() },
                { label: "size", value: bytesLabel(Math.max(1, s.chunks) * 4096) },
              ]}
            />
          );
        })}
        <SourceCardAdd>+ Connect another source</SourceCardAdd>
      </div>
    </section>
  );
}
