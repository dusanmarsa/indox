"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SourceDto = {
  id: string;
  externalId: string;
  displayName: string;
  indexStatus: string | null;
  chunkCount: number | null;
  indexedAt: string | null;
  indexError: string | null;
};

type AdapterDto = {
  id: string;
  kind: string;
  createdAt: string;
  sources: SourceDto[];
};

type AvailableRepo = {
  fullName: string;
  defaultBranch: string;
  private: boolean;
  indexed: boolean;
};

export default function AdapterManager({ adapter }: { adapter: AdapterDto }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── browse repos ─────────────────────────────────────────────────────────
  const [browseMode, setBrowseMode] = useState<"user" | "org">("user");
  const [browseValue, setBrowseValue] = useState("");
  const [browseLoading, setBrowseLoading] = useState(false);
  const [available, setAvailable] = useState<AvailableRepo[] | null>(null);

  // ─── add by name ──────────────────────────────────────────────────────────
  const [manualFullName, setManualFullName] = useState("");

  const refresh = () => router.refresh();

  const browse = async () => {
    if (!browseValue.trim()) return;
    setError(null);
    setBrowseLoading(true);
    setAvailable(null);
    try {
      const res = await fetch(
        `/api/adapters/${adapter.id}/available?mode=${browseMode}&value=${encodeURIComponent(browseValue.trim())}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      setAvailable(json.repos);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBrowseLoading(false);
    }
  };

  const addSource = async (fullName: string) => {
    setError(null);
    setBusy(fullName);
    try {
      const res = await fetch(`/api/adapters/${adapter.id}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      // Mark this row as indexed in the available list optimistically so the
      // user doesn't accidentally double-click.
      if (available) {
        setAvailable(
          available.map((r) =>
            r.fullName === fullName ? { ...r, indexed: true } : r,
          ),
        );
      }
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const addManual = async () => {
    const v = manualFullName.trim();
    if (!v) return;
    await addSource(v);
    setManualFullName("");
  };

  const removeSource = async (id: string) => {
    if (!confirm("Remove this source and delete its embeddings?")) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "failed");
      }
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const reindex = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/sources/${id}`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "failed");
      }
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="border border-[#8a6a1e]/40 bg-[#fdf8ec] px-[10px] py-[6px] font-mono text-[11px] text-[#8a6a1e] dark:bg-[#8a6a1e]/15">
          {error}
        </div>
      )}

      {/* ─── Indexed sources ─────────────────────────────────────────────── */}
      <section className="border border-(--indox-border)">
        <div className="flex items-center justify-between border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[13px]">
          <span className="text-[13px] font-medium">Indexed sources</span>
          <span className="font-mono text-[11px] text-(--indox-dim)">
            {adapter.sources.length}
          </span>
        </div>
        {adapter.sources.length === 0 ? (
          <div className="px-[18px] py-12 text-center font-mono text-[12px] text-(--indox-dim)">
            no sources yet — add one below
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-(--indox-border)">
                {["source", "status", "chunks", "indexed", ""].map((h, i) => (
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
              {adapter.sources.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-(--indox-border) last:border-b-0 hover:bg-(--indox-surface)/60"
                >
                  <td className="px-[18px] py-[11px] font-mono text-[12px] text-foreground">
                    {s.displayName}
                  </td>
                  <td className="px-[18px] py-[11px]">{statusBadge(s.indexStatus)}</td>
                  <td className="px-[18px] py-[11px] text-right font-mono text-[12px] text-(--indox-muted)">
                    {s.chunkCount ?? "—"}
                  </td>
                  <td className="px-[18px] py-[11px] font-mono text-[12px] text-(--indox-muted)">
                    {s.indexedAt ? new Date(s.indexedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-[18px] py-[11px]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => reindex(s.id)}
                        disabled={busy === s.id || s.indexStatus === "running"}
                        className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-foreground disabled:opacity-40"
                      >
                        re-index
                      </button>
                      <span className="text-(--indox-dim)">·</span>
                      <button
                        onClick={() => removeSource(s.id)}
                        disabled={busy === s.id}
                        className="font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-[#8a6a1e] disabled:opacity-40"
                      >
                        remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ─── Add by name ─────────────────────────────────────────────────── */}
      <section className="border border-(--indox-border)">
        <div className="border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[13px] text-[13px] font-medium">
          Add by owner/name
        </div>
        <div className="px-[18px] py-[14px] flex gap-2">
          <input
            type="text"
            value={manualFullName}
            onChange={(e) => setManualFullName(e.target.value)}
            placeholder="owner/name"
            className="flex-1 border border-(--indox-border) bg-background px-[9px] py-[5px] font-mono text-[11.5px] outline-none focus:border-(--indox-muted)"
          />
          <button
            onClick={addManual}
            disabled={busy === manualFullName.trim() || !manualFullName.trim()}
            className="border border-(--indox-border) bg-background px-[12px] py-[5px] font-mono text-[11.5px] text-foreground transition-colors hover:bg-(--indox-surface) disabled:opacity-40"
          >
            add
          </button>
        </div>
      </section>

      {/* ─── Browse user/org ─────────────────────────────────────────────── */}
      <section className="border border-(--indox-border)">
        <div className="border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[13px] text-[13px] font-medium">
          Browse a user or org
        </div>
        <div className="px-[18px] py-[14px] space-y-3">
          <div className="flex gap-3 font-mono text-[11.5px]">
            {(["user", "org"] as const).map((m) => (
              <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="browse-mode"
                  checked={browseMode === m}
                  onChange={() => {
                    setBrowseMode(m);
                    setAvailable(null);
                  }}
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={browseValue}
              onChange={(e) => {
                setBrowseValue(e.target.value);
                setAvailable(null);
              }}
              placeholder={browseMode === "user" ? "github username" : "github org"}
              className="flex-1 border border-(--indox-border) bg-background px-[9px] py-[5px] font-mono text-[11.5px] outline-none focus:border-(--indox-muted)"
            />
            <button
              onClick={browse}
              disabled={browseLoading || !browseValue.trim()}
              className="border border-(--indox-border) bg-background px-[12px] py-[5px] font-mono text-[11.5px] text-foreground transition-colors hover:bg-(--indox-surface) disabled:opacity-40"
            >
              {browseLoading ? "loading…" : "browse"}
            </button>
          </div>

          {available && (
            <div className="max-h-[320px] overflow-auto border border-(--indox-border) bg-(--indox-surface)/40">
              {available.length === 0 ? (
                <div className="py-3 text-center font-mono text-[11px] text-(--indox-dim)">
                  no repos found
                </div>
              ) : (
                available.map((r) => (
                  <div
                    key={r.fullName}
                    className="flex items-center justify-between border-b border-(--indox-border) px-[10px] py-[6px] font-mono text-[11.5px] last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span>{r.fullName}</span>
                      {r.private ? (
                        <span className="text-[10px] text-(--indox-dim)">private</span>
                      ) : null}
                    </div>
                    {r.indexed ? (
                      <span className="font-mono text-[10.5px] text-(--indox-ok)">indexed</span>
                    ) : (
                      <button
                        onClick={() => addSource(r.fullName)}
                        disabled={busy === r.fullName}
                        className="border border-(--indox-border) bg-background px-[8px] py-[3px] font-mono text-[10.5px] transition-colors hover:bg-(--indox-surface) disabled:opacity-40"
                      >
                        {busy === r.fullName ? "adding…" : "add"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function statusBadge(status: string | null) {
  const map: Record<string, { text: string; bg: string; dot: string }> = {
    ready:   { text: "text-(--indox-ok)",   bg: "bg-(--indox-ok)/10",                dot: "bg-(--indox-ok)" },
    running: { text: "text-[#1e5f8a]",     bg: "bg-[#ecf3fd] dark:bg-[#1e5f8a]/20", dot: "bg-[#1e5f8a]" },
    failed:  { text: "text-[#8a6a1e]",     bg: "bg-[#fdf8ec] dark:bg-[#8a6a1e]/20", dot: "bg-[#8a6a1e]" },
    idle:    { text: "text-(--indox-dim)",  bg: "bg-(--indox-surface)",               dot: "bg-(--indox-dim)" },
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
