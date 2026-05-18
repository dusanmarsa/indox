"use client";

import { useMemo, useState, useTransition } from "react";
import { Accordion as Primitive } from "radix-ui";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Accordion, Pill, SearchField, Tag, type PillTone } from "@indox/ui";
import type { DashboardSource, SourceFile, SourceStatus } from "@/lib/dashboard-data";
import { fetchSourceFiles } from "@/app/(dashboard)/sources/actions";
import { TimeAgo } from "./TimeAgo";
import { useLiveSources } from "./useLiveSources";

function statusPill(status: SourceStatus) {
  const tone: PillTone =
    status === "ready"
      ? "ok"
      : status === "failed"
        ? "bad"
        : status === "indexing"
          ? "info"
          : "neutral";
  const label =
    status === "ready"
      ? "indexed"
      : status === "indexing"
        ? "indexing"
        : status === "failed"
          ? "failed"
          : "idle";
  return <Pill tone={tone}>{label}</Pill>;
}

// Column hiding under md keeps the row legible on phones. From smallest →
// largest we surface: chevron, name, status. md adds chunks. lg adds type,
// size, and last-indexed.
const COLS =
  "grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[24px_minmax(0,1fr)_80px_auto] lg:grid-cols-[24px_minmax(0,1fr)_100px_80px_100px_120px_100px]";

function ExpandedFiles({ files, loading }: { files: SourceFile[] | null; loading: boolean }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!files) return [];
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.path.toLowerCase().includes(q));
  }, [files, query]);

  if (loading || !files) {
    return (
      <div className="bg-overlay-tint px-4 py-4">
        <div className="py-6 text-center font-mono text-[11.5px] text-ink-3">
          loading indexed files…
        </div>
      </div>
    );
  }

  return (
    <div className="bg-overlay-tint px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <SearchField
          mono
          placeholder="filter paths…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          containerClassName="max-w-xs px-3 py-2"
        />
        <span className="font-mono text-[10.5px] text-ink-3">
          {filtered.length} of {files.length} files
        </span>
      </div>
      {files.length === 0 ? (
        <div className="py-6 text-center font-mono text-[11.5px] text-ink-3">no indexed files</div>
      ) : filtered.length === 0 ? (
        <div className="py-6 text-center font-mono text-[11.5px] text-ink-3">
          no paths match &ldquo;{query}&rdquo;
        </div>
      ) : (
        <div className="max-h-[340px] overflow-auto rounded-md border border-border bg-surface">
          {filtered.map((f, i) => {
            const row = (
              <>
                <span className="truncate text-ink group-hover:text-brand">{f.path}</span>
                <span className="ml-3 flex shrink-0 items-center gap-2 text-ink-3">
                  {f.chunks}
                  {f.url && (
                    <ExternalLink className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </span>
              </>
            );
            const className = `group flex items-center justify-between px-3 py-2 font-mono text-[11.5px] transition-colors ${
              i < filtered.length - 1 ? "border-b border-border" : ""
            } ${f.url ? "hover:bg-surface-2" : ""}`;
            return f.url ? (
              <a
                key={f.path}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {row}
              </a>
            ) : (
              <div key={f.path} className={className}>
                {row}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SourcesTable({ sources: initial }: { sources: DashboardSource[] }) {
  const sources = useLiveSources(initial);
  const [cache, setCache] = useState<Record<string, SourceFile[]>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleValueChange = (id: string) => {
    if (!id || cache[id]) return;
    setPendingId(id);
    startTransition(async () => {
      const files = await fetchSourceFiles(id);
      setCache((c) => ({ ...c, [id]: files }));
      setPendingId((cur) => (cur === id ? null : cur));
    });
  };

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <div
        className={`${COLS} border-b border-border px-4 py-2.5 font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase`}
      >
        <span />
        <span>repository</span>
        <span className="hidden lg:block">type</span>
        <span className="hidden text-right md:block">chunks</span>
        <span className="hidden lg:block">size</span>
        <span className="hidden lg:block">last indexed</span>
        <span>status</span>
      </div>
      <Accordion type="single" collapsible onValueChange={handleValueChange}>
        {sources.map((s) => {
          const files = cache[s.id] ?? null;
          const loading = pendingId === s.id && !files;
          return (
            <Primitive.Item
              key={s.id}
              value={s.id}
              className="border-b border-border last:border-b-0"
            >
              <Primitive.Header className="flex">
                <Primitive.Trigger
                  className={`group ${COLS} w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none`}
                >
                  <ChevronDown className="size-3.5 text-ink-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  <span className="truncate font-mono text-[12.5px] text-ink">{s.path}</span>
                  <span className="hidden lg:flex">
                    <Tag tone="outline">{s.type}</Tag>
                  </span>
                  <span className="hidden text-right font-mono text-[12px] text-ink-2 md:block">
                    {s.chunks > 0 ? s.chunks.toLocaleString() : "—"}
                  </span>
                  <span className="hidden font-mono text-[12px] text-ink-2 lg:block">{s.size}</span>
                  <span className="hidden font-mono text-[12px] text-ink-2 lg:block">
                    <TimeAgo date={s.indexedAt} />
                  </span>
                  <span>{statusPill(s.status)}</span>
                </Primitive.Trigger>
              </Primitive.Header>
              <Primitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <ExpandedFiles files={files} loading={loading} />
              </Primitive.Content>
            </Primitive.Item>
          );
        })}
      </Accordion>
    </div>
  );
}
