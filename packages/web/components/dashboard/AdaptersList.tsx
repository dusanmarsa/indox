"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { DashboardAdapter } from "@/lib/dashboard-data";
import AddAdapterDialog from "./AddAdapterDialog";

function statusBadge(status: string | null) {
  const map: Record<string, { text: string; bg: string; dot: string }> = {
    ready:   { text: "text-(--indox-ok)",  bg: "bg-(--indox-ok)/10",               dot: "bg-(--indox-ok)" },
    running: { text: "text-[#1e5f8a]",    bg: "bg-[#ecf3fd] dark:bg-[#1e5f8a]/20", dot: "bg-[#1e5f8a]" },
    failed:  { text: "text-[#8a6a1e]",    bg: "bg-[#fdf8ec] dark:bg-[#8a6a1e]/20", dot: "bg-[#8a6a1e]" },
    idle:    { text: "text-(--indox-dim)", bg: "bg-(--indox-surface)",              dot: "bg-(--indox-dim)" },
  };
  const key = status ?? "idle";
  const s = map[key] ?? map.idle;
  return (
    <span className={`inline-flex items-center gap-[5px] px-[7px] py-[2px] font-mono text-[10.5px] ${s.text} ${s.bg}`}>
      <span className={`h-[5px] w-[5px] shrink-0 ${s.dot}`} />
      {key}
    </span>
  );
}

function scopeSummary(scope: unknown): string {
  if (!scope || typeof scope !== "object") return "—";
  const s = scope as { mode?: string; value?: unknown };
  if (s.mode === "repos" && Array.isArray(s.value)) return `${s.value.length} repo${s.value.length === 1 ? "" : "s"}`;
  if (s.mode === "user") return `user · ${s.value}`;
  if (s.mode === "org") return `org · ${s.value}`;
  return JSON.stringify(scope);
}

export default function AdaptersList({ adapters }: { adapters: DashboardAdapter[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this adapter and all its indexed sources?")) return;
    setBusy(id);
    await fetch(`/api/adapters/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  };

  const onResync = async (id: string) => {
    setBusy(id);
    await fetch(`/api/adapters/${id}/sync`, { method: "POST" });
    setBusy(null);
    router.refresh();
  };

  return (
    <>
      <div className="border border-(--indox-border)">
        <div className="flex items-center justify-between border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[13px]">
          <span className="text-[13px] font-medium">Configured adapters</span>
          <button
            onClick={() => setShowAdd(true)}
            className="border border-(--indox-border) bg-background px-[10px] py-[4px] font-mono text-[11.5px] text-foreground transition-colors hover:bg-(--indox-surface)"
          >
            + add adapter
          </button>
        </div>
        {adapters.length === 0 ? (
          <div className="px-[18px] py-12 text-center font-mono text-[12px] text-(--indox-dim)">
            no adapters yet — click <span className="text-foreground">+ add adapter</span> to connect a data source
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-(--indox-border)">
                {["kind", "scope", "sources", "last sync", "status", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`px-[18px] py-[9px] font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim) ${i === 2 ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adapters.map((a) => (
                <tr key={a.id} className="border-b border-(--indox-border) last:border-b-0 hover:bg-(--indox-surface)/60">
                  <td className="px-[18px] py-[11px]">
                    <span className="border border-(--indox-border) px-1.5 py-px font-mono text-[10.5px] text-(--indox-dim)">
                      {a.kind}
                    </span>
                  </td>
                  <td className="px-[18px] py-[11px] font-mono text-[12px] text-foreground">{scopeSummary(a.scope)}</td>
                  <td className="px-[18px] py-[11px] text-right font-mono text-[12px] text-(--indox-muted)">
                    {a.readyCount}
                    <span className="text-(--indox-dim)"> / {a.sourceCount}</span>
                  </td>
                  <td className="px-[18px] py-[11px] font-mono text-[12px] text-(--indox-muted)">{a.lastSyncedAt}</td>
                  <td className="px-[18px] py-[11px]">
                    {statusBadge(a.syncStatus)}
                    {a.syncError ? (
                      <div className="mt-1 max-w-xs truncate font-mono text-[10.5px] text-[#8a6a1e]" title={a.syncError}>
                        {a.syncError}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-[18px] py-[11px]">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/adapters/${a.id}` as Route}
                        className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-foreground"
                      >
                        manage
                      </Link>
                      <span className="text-(--indox-dim)">·</span>
                      <button
                        onClick={() => onResync(a.id)}
                        disabled={busy === a.id || a.syncStatus === "running"}
                        className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-foreground disabled:opacity-40"
                      >
                        re-sync
                      </button>
                      <span className="text-(--indox-dim)">·</span>
                      <button
                        onClick={() => onDelete(a.id)}
                        disabled={busy === a.id}
                        className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-[#8a6a1e] disabled:opacity-40"
                      >
                        delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddAdapterDialog
          onClose={() => setShowAdd(false)}
          onCreated={(adapterId) => {
            setShowAdd(false);
            // Bounce straight to the manage page so the user can start
            // picking sources — the adapter has none yet.
            router.push(`/dashboard/adapters/${adapterId}` as Route);
          }}
        />
      )}
    </>
  );
}
