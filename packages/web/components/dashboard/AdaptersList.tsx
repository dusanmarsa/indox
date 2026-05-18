"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Button, IconButton, Pill, Tag, type PillTone } from "@indox/ui";
import { ArrowUpRight, RefreshCw, Trash2 } from "lucide-react";
import type { DashboardAdapter } from "@/lib/dashboard-data";
import AddAdapterDialog from "./AddAdapterDialog";

function statusTone(status: string | null): { tone: PillTone; label: string } {
  switch (status) {
    case "ready":
      return { tone: "ok", label: "ready" };
    case "running":
      return { tone: "info", label: "running" };
    case "failed":
      return { tone: "bad", label: "failed" };
    default:
      return { tone: "neutral", label: status ?? "idle" };
  }
}

function scopeSummary(scope: unknown): string {
  if (!scope || typeof scope !== "object") return "—";
  const s = scope as { mode?: string; value?: unknown };
  if (s.mode === "repos" && Array.isArray(s.value))
    return `${s.value.length} repo${s.value.length === 1 ? "" : "s"}`;
  if (s.mode === "pages" && Array.isArray(s.value))
    return `${s.value.length} page${s.value.length === 1 ? "" : "s"}`;
  if (s.mode === "search") return "search · all accessible";
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
      <div className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-[13px] font-medium tracking-[-0.01em] text-ink">
            Configured adapters
          </span>
          <Button variant="soft" onClick={() => setShowAdd(true)}>
            + add adapter
          </Button>
        </div>
        {adapters.length === 0 ? (
          <div className="px-4 py-12 text-center font-mono text-[12px] text-ink-3">
            no adapters yet — click <span className="text-ink">+ add adapter</span> to connect a
            data source
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                {(
                  [
                    { label: "kind", align: "text-left", hide: "" },
                    { label: "scope", align: "text-left", hide: "hidden md:table-cell" },
                    { label: "sources", align: "text-right", hide: "" },
                    { label: "last sync", align: "text-left", hide: "hidden lg:table-cell" },
                    { label: "status", align: "text-left", hide: "" },
                    { label: "", align: "text-left", hide: "" },
                  ] as const
                ).map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-2.5 font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-ink-3 ${h.align} ${h.hide}`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adapters.map((a) => {
                const status = statusTone(a.syncStatus);
                const onRowClick = () => router.push(`/adapters/${a.id}` as Route);
                // Stop the row click bubbling up when an action icon is hit.
                const stop = (e: React.MouseEvent) => e.stopPropagation();
                return (
                  <tr
                    key={a.id}
                    onClick={onRowClick}
                    className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-surface-2"
                  >
                    <td className="px-4 py-3">
                      <Tag tone="outline">{a.kind}</Tag>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-[12px] text-ink md:table-cell">
                      {scopeSummary(a.scope)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] text-ink-2">
                      {a.readyCount}
                      <span className="text-ink-3"> / {a.sourceCount}</span>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-[12px] text-ink-2 lg:table-cell">
                      {a.lastSyncedAt}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={status.tone}>{status.label}</Pill>
                      {a.syncError ? (
                        <div
                          className="mt-1 max-w-xs truncate font-mono text-[10.5px] text-bad"
                          title={a.syncError}
                        >
                          {a.syncError}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={stop}>
                        <IconButton aria-label="Manage adapter" title="Manage" onClick={onRowClick}>
                          <ArrowUpRight className="size-3.5" />
                        </IconButton>
                        <IconButton
                          aria-label="Re-sync adapter"
                          title="Re-sync"
                          disabled={busy === a.id || a.syncStatus === "running"}
                          onClick={() => onResync(a.id)}
                        >
                          <RefreshCw
                            className={`size-3.5 ${busy === a.id ? "animate-spin" : ""}`}
                          />
                        </IconButton>
                        <IconButton
                          aria-label="Delete adapter"
                          title="Delete"
                          disabled={busy === a.id}
                          onClick={() => onDelete(a.id)}
                          className="hover:text-bad"
                        >
                          <Trash2 className="size-3.5" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
            router.push(`/adapters/${adapterId}` as Route);
          }}
        />
      )}
    </>
  );
}
