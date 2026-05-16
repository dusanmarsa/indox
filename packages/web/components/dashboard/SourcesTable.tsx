"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import type { DashboardSource, SourceFile } from "@/lib/dashboard-data";
import { fetchSourceFiles } from "@/app/dashboard/sources/actions";

function StatusBadge({ status }: { status: "ok" | "warn" | "idle" }) {
  const map = {
    ok:   { text: "text-(--indox-ok)",  bg: "bg-(--indox-ok)/10",              dot: "bg-(--indox-ok)" },
    warn: { text: "text-[#8a6a1e]",    bg: "bg-[#fdf8ec] dark:bg-[#8a6a1e]/20", dot: "bg-[#8a6a1e]" },
    idle: { text: "text-(--indox-dim)", bg: "bg-(--indox-surface)",             dot: "bg-(--indox-dim)" },
  };
  const s = map[status] ?? map.idle;
  return (
    <span className={`inline-flex items-center gap-[5px] px-[7px] py-[2px] font-mono text-[10.5px] ${s.text} ${s.bg}`}>
      <span className={`h-[5px] w-[5px] shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
}

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
      <div className="bg-(--indox-surface)/40 px-[18px] py-[14px]">
        <div className="py-6 text-center font-mono text-[11.5px] text-(--indox-dim)">
          loading indexed files…
        </div>
      </div>
    );
  }

  return (
    <div className="bg-(--indox-surface)/40 px-[18px] py-[14px]">
      <div className="mb-[10px] flex items-center justify-between gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter paths…"
          className="w-full max-w-xs border border-(--indox-border) bg-background px-[9px] py-[5px] font-mono text-[11.5px] outline-none placeholder:text-(--indox-dim) focus:border-(--indox-muted)"
        />
        <span className="font-mono text-[10.5px] text-(--indox-dim)">
          {filtered.length} of {files.length} files
        </span>
      </div>
      {files.length === 0 ? (
        <div className="py-6 text-center font-mono text-[11.5px] text-(--indox-dim)">
          no indexed files
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-6 text-center font-mono text-[11.5px] text-(--indox-dim)">
          no paths match “{query}”
        </div>
      ) : (
        <div className="max-h-[340px] overflow-auto border border-(--indox-border) bg-background">
          {filtered.map((f) => (
            <div
              key={f.path}
              className="flex items-center justify-between border-b border-(--indox-border) px-[12px] py-[6px] font-mono text-[11.5px] last:border-b-0"
            >
              <span className="truncate text-foreground">{f.path}</span>
              <span className="ml-3 shrink-0 text-(--indox-dim)">{f.chunks}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SourcesTable({ sources }: { sources: DashboardSource[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, SourceFile[]>>({});
  const [isPending, startTransition] = useTransition();

  const toggle = (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (cache[id]) return;
    startTransition(async () => {
      const files = await fetchSourceFiles(id);
      setCache((c) => ({ ...c, [id]: files }));
    });
  };

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-(--indox-border)">
          {["", "repository", "type", "chunks", "size", "last indexed", "status"].map((h, i) => (
            <th
              key={i}
              className={`px-[18px] py-[9px] font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim) ${i === 3 ? "text-right" : "text-left"} ${i === 0 ? "w-[28px] px-[10px]" : ""}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sources.map((s) => {
          const isOpen = expanded === s.id;
          const files = cache[s.id] ?? null;
          const loading = isOpen && isPending && !files;
          return (
            <Fragment key={s.id}>
              <tr
                onClick={() => toggle(s.id)}
                className="cursor-pointer border-b border-(--indox-border) transition-colors hover:bg-(--indox-surface)/60"
              >
                <td className="px-[10px] py-[11px] text-center font-mono text-[10px] text-(--indox-dim) select-none">
                  {isOpen ? "▾" : "▸"}
                </td>
                <td className="px-[18px] py-[11px] font-mono text-[12.5px] text-foreground">{s.path}</td>
                <td className="px-[18px] py-[11px]">
                  <span className="border border-(--indox-border) px-1.5 py-px font-mono text-[10.5px] text-(--indox-dim)">
                    {s.type}
                  </span>
                </td>
                <td className="px-[18px] py-[11px] text-right font-mono text-[12px] text-(--indox-muted)">
                  {s.chunks > 0 ? s.chunks.toLocaleString() : "—"}
                </td>
                <td className="px-[18px] py-[11px] font-mono text-[12px] text-(--indox-muted)">{s.size}</td>
                <td className="px-[18px] py-[11px] font-mono text-[12px] text-(--indox-muted)">{s.sync}</td>
                <td className="px-[18px] py-[11px]">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
              {isOpen && (
                <tr className="border-b border-(--indox-border)">
                  <td colSpan={7} className="p-0">
                    <ExpandedFiles files={files} loading={loading} />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
