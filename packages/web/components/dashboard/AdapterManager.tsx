"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Input,
  Pill,
  RadioGroup,
  RadioGroupItem,
  Label,
  type PillTone,
} from "@indox/ui";
import { Copy, RefreshCw, Trash2 } from "lucide-react";

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

type AvailablePage = {
  pageId: string;
  title: string;
  lastEditedTime?: string;
  indexed: boolean;
};

type WorkspaceOption = { id: string; name: string };

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

export default function AdapterManager({
  adapter,
  otherWorkspaces,
}: {
  adapter: AdapterDto;
  otherWorkspaces: WorkspaceOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const [browseMode, setBrowseMode] = useState<"user" | "org">("user");
  const [browseValue, setBrowseValue] = useState("");
  const [browseLoading, setBrowseLoading] = useState(false);
  const [available, setAvailable] = useState<AvailableRepo[] | null>(null);
  const [availablePages, setAvailablePages] = useState<AvailablePage[] | null>(null);

  const [manualFullName, setManualFullName] = useState("");
  const isNotion = adapter.kind === "notion";

  const refresh = () => router.refresh();

  const browse = async () => {
    if (!browseValue.trim()) return;
    setError(null);
    setBrowseLoading(true);
    setAvailable(null);
    try {
      const res = await fetch(
        `/api/adapters/${adapter.id}/available?mode=${browseMode}&value=${encodeURIComponent(browseValue.trim())}`
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

  const addSource = async (ref: string) => {
    setError(null);
    setBusy(ref);
    try {
      const res = await fetch(`/api/adapters/${adapter.id}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      if (available) {
        setAvailable(available.map((r) => (r.fullName === ref ? { ...r, indexed: true } : r)));
      }
      if (availablePages) {
        setAvailablePages(
          availablePages.map((p) => (p.pageId === ref ? { ...p, indexed: true } : p))
        );
      }
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const browsePages = async () => {
    setError(null);
    setBrowseLoading(true);
    setAvailablePages(null);
    try {
      const res = await fetch(`/api/adapters/${adapter.id}/available`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      setAvailablePages(json.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBrowseLoading(false);
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

  const copyToWorkspace = async (targetWorkspaceId: string, targetName: string) => {
    setError(null);
    setBusy("copy");
    setCopyMsg(null);
    try {
      const res = await fetch(`/api/adapters/${adapter.id}/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetWorkspaceId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "copy failed");
      setCopyMsg(`Copied to "${targetName}" — sync started in that workspace.`);
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
    <div className="flex flex-col gap-6">
      {otherWorkspaces.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          {copyMsg && <span className="font-mono text-[11.5px] text-ok">{copyMsg}</span>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="soft" disabled={busy === "copy"}>
                <Copy className="size-3.5" />
                {busy === "copy" ? "copying…" : "Copy to workspace"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {otherWorkspaces.map((w) => (
                <DropdownMenuItem key={w.id} onSelect={() => copyToWorkspace(w.id, w.name)}>
                  {w.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {error && (
        <Alert tone="bad" className="font-mono text-[12px]">
          {error}
        </Alert>
      )}

      <section className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-[13px] font-medium tracking-[-0.01em] text-ink">
            Indexed sources
          </span>
          <span className="font-mono text-[11px] text-ink-3">{adapter.sources.length}</span>
        </div>
        {adapter.sources.length === 0 ? (
          <div className="px-4 py-12 text-center font-mono text-[12px] text-ink-3">
            no sources yet — add one below
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                {["source", "status", "chunks", "indexed", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-2.5 font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-ink-3 ${
                      i === 2 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adapter.sources.map((s) => {
                const status = statusTone(s.indexStatus);
                return (
                  <tr
                    key={s.id}
                    className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-2"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-ink">{s.displayName}</td>
                    <td className="px-4 py-3">
                      <Pill tone={status.tone}>{status.label}</Pill>
                      {s.indexError && (
                        <div
                          className="mt-1 max-w-xs truncate font-mono text-[10.5px] text-bad"
                          title={s.indexError}
                        >
                          {s.indexError}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] text-ink-2">
                      {s.chunkCount ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-ink-2">
                      {s.indexedAt ? new Date(s.indexedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          aria-label="Re-index source"
                          title="Re-index"
                          disabled={busy === s.id || s.indexStatus === "running"}
                          onClick={() => reindex(s.id)}
                        >
                          <RefreshCw
                            className={`size-3.5 ${busy === s.id ? "animate-spin" : ""}`}
                          />
                        </IconButton>
                        <IconButton
                          aria-label="Remove source"
                          title="Remove"
                          disabled={busy === s.id}
                          onClick={() => removeSource(s.id)}
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
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 text-[13px] font-medium tracking-[-0.01em] text-ink">
          {isNotion ? "Add by page id or URL" : "Add by owner/name"}
        </div>
        <div className="flex gap-2 px-4 py-4">
          <Input
            type="text"
            value={manualFullName}
            onChange={(e) => setManualFullName(e.target.value)}
            placeholder={isNotion ? "notion.so/… or 32-char id" : "owner/name"}
            className="font-mono"
          />
          <Button
            variant="soft"
            onClick={addManual}
            disabled={busy === manualFullName.trim() || !manualFullName.trim()}
          >
            {busy === manualFullName.trim() ? "adding…" : "add"}
          </Button>
        </div>
      </section>

      {isNotion ? (
        <section className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[13px] font-medium tracking-[-0.01em] text-ink">
              Browse pages shared with the integration
            </span>
            <Button variant="soft" onClick={browsePages} disabled={browseLoading}>
              {browseLoading ? "loading…" : availablePages ? "refresh" : "browse"}
            </Button>
          </div>
          {availablePages && (
            <div className="max-h-80 overflow-auto border-t border-border bg-overlay-tint">
              {availablePages.length === 0 ? (
                <div className="py-3 text-center font-mono text-[11px] text-ink-3">
                  no pages found — share a page with the integration in Notion first
                </div>
              ) : (
                availablePages.map((p, i) => (
                  <div
                    key={p.pageId}
                    className={`flex items-center justify-between px-3 py-2 font-mono text-[11.5px] ${
                      i < availablePages.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-ink" title={p.title}>
                        {p.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-ink-3">
                        {p.pageId.slice(0, 8)}…
                      </span>
                    </div>
                    {p.indexed ? (
                      <span className="font-mono text-[10.5px] text-ok">indexed</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => addSource(p.pageId)}
                        disabled={busy === p.pageId}
                      >
                        {busy === p.pageId ? "adding…" : "add"}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 text-[13px] font-medium tracking-[-0.01em] text-ink">
            Browse a user or org
          </div>
          <div className="flex flex-col gap-3 px-4 py-4">
            <RadioGroup
              value={browseMode}
              onValueChange={(v) => {
                setBrowseMode(v as "user" | "org");
                setAvailable(null);
              }}
              className="flex gap-4"
            >
              {(["user", "org"] as const).map((m) => (
                <Label
                  key={m}
                  className="flex cursor-pointer items-center gap-2 normal-case tracking-normal text-ink-2"
                >
                  <RadioGroupItem value={m} />
                  {m}
                </Label>
              ))}
            </RadioGroup>
            <div className="flex gap-2">
              <Input
                type="text"
                value={browseValue}
                onChange={(e) => {
                  setBrowseValue(e.target.value);
                  setAvailable(null);
                }}
                placeholder={browseMode === "user" ? "github username" : "github org"}
                className="font-mono"
              />
              <Button
                variant="soft"
                onClick={browse}
                disabled={browseLoading || !browseValue.trim()}
              >
                {browseLoading ? "loading…" : "browse"}
              </Button>
            </div>

            {available && (
              <div className="max-h-80 overflow-auto rounded-md border border-border bg-overlay-tint">
                {available.length === 0 ? (
                  <div className="py-3 text-center font-mono text-[11px] text-ink-3">
                    no repos found
                  </div>
                ) : (
                  available.map((r, i) => (
                    <div
                      key={r.fullName}
                      className={`flex items-center justify-between px-3 py-2 font-mono text-[11.5px] ${
                        i < available.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-ink">{r.fullName}</span>
                        {r.private && <span className="text-[10px] text-ink-3">private</span>}
                      </div>
                      {r.indexed ? (
                        <span className="font-mono text-[10.5px] text-ok">indexed</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="soft"
                          onClick={() => addSource(r.fullName)}
                          disabled={busy === r.fullName}
                        >
                          {busy === r.fullName ? "adding…" : "add"}
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
