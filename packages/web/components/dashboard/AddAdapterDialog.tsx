"use client";

import { useState } from "react";

// Adding an adapter is now just about the auth — sources are managed
// independently from the adapter's manage page (`/dashboard/adapters/[id]`).
// We accept an empty scope so the user can configure the connection first
// and pick which repos to index afterward, without having to delete and
// recreate the adapter when their list changes.

export default function AddAdapterDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (adapterId: string) => void;
}) {
  const [kind] = useState<"github">("github");
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!token.trim()) {
      setError("token is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/adapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          token,
          // Empty repos list — sources get added via the manage page.
          scope: { mode: "repos", value: [] },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed to create adapter");
      onCreated(json.adapter.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg border border-(--indox-border) bg-background"
      >
        <div className="flex items-center justify-between border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[13px]">
          <span className="text-[13px] font-medium">Add adapter</span>
          <button
            onClick={onClose}
            className="font-mono text-[12px] text-(--indox-muted) transition-colors hover:text-foreground"
          >
            close
          </button>
        </div>

        <div className="space-y-5 px-[18px] py-[16px]">
          <Field label="kind">
            <span className="border border-(--indox-border) px-1.5 py-px font-mono text-[10.5px] text-(--indox-dim)">
              github
            </span>
          </Field>

          <Field label="token" hint="GitHub PAT with repo scope">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_…"
              className="w-full border border-(--indox-border) bg-background px-[9px] py-[5px] font-mono text-[11.5px] outline-none focus:border-(--indox-muted)"
            />
          </Field>

          <div className="border border-(--indox-border) bg-(--indox-surface)/50 px-[10px] py-[8px] font-mono text-[11px] text-(--indox-muted)">
            After creating, you&apos;ll pick which repos to index on the adapter&apos;s
            manage page. The token is stored once and reused across adds.
          </div>

          {error && (
            <div className="border border-[#8a6a1e]/40 bg-[#fdf8ec] px-[10px] py-[6px] font-mono text-[11px] text-[#8a6a1e] dark:bg-[#8a6a1e]/15">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-(--indox-border) bg-(--indox-surface) px-[18px] py-[10px]">
          <button
            onClick={onClose}
            className="font-mono text-[12px] text-(--indox-muted) transition-colors hover:text-foreground"
          >
            cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="border border-(--indox-border) bg-background px-[12px] py-[5px] font-mono text-[11.5px] text-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            {submitting ? "creating…" : "create adapter"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-(--indox-dim)">{label}</label>
        {hint ? <span className="font-mono text-[10px] text-(--indox-dim)">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
