"use client";

import { useState } from "react";

// Adding an adapter is just about the auth — sources are managed independently
// from the adapter's manage page (`/dashboard/adapters/[id]`). We start with
// an empty allowlist so the user can configure the connection first and pick
// what to index afterward.

type Kind = "github" | "notion";

const KIND_META: Record<Kind, { label: string; tokenHint: string; tokenPlaceholder: string }> = {
  github: {
    label: "github",
    tokenHint: "GitHub PAT with repo scope",
    tokenPlaceholder: "ghp_…",
  },
  notion: {
    label: "notion",
    tokenHint: "Notion internal integration secret",
    tokenPlaceholder: "secret_…",
  },
};

export default function AddAdapterDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (adapterId: string) => void;
}) {
  const [kind, setKind] = useState<Kind>("github");
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
      const scope = kind === "github" ? { mode: "repos", value: [] } : { mode: "pages", value: [] };
      const res = await fetch("/api/adapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, token, scope }),
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

  const meta = KIND_META[kind];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg border border-border bg-background"
      >
        <div className="flex items-center justify-between border-b border-border bg-surface px-[18px] py-[13px]">
          <span className="text-[13px] font-medium">Add adapter</span>
          <button
            onClick={onClose}
            className="font-mono text-[12px] text-ink-2 transition-colors hover:text-foreground"
          >
            close
          </button>
        </div>

        <div className="space-y-5 px-[18px] py-4">
          <Field label="kind">
            <div className="flex gap-1.5">
              {(["github", "notion"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`border px-2 py-[3px] font-mono text-[11px] transition-colors ${
                    kind === k
                      ? "border-ink-2 text-foreground"
                      : "border-border text-ink-3 hover:text-foreground"
                  }`}
                >
                  {KIND_META[k].label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="token" hint={meta.tokenHint}>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={meta.tokenPlaceholder}
              className="w-full border border-border bg-background px-[9px] py-[5px] font-mono text-[11.5px] outline-none focus:border-ink-2"
            />
          </Field>

          <div className="border border-border bg-surface/50 px-2.5 py-2 font-mono text-[11px] text-ink-2">
            {kind === "github" ? (
              <>
                After creating, you&apos;ll pick which repos to index on the adapter&apos;s manage
                page. The token is stored once and reused across adds.
              </>
            ) : (
              <>
                Create an integration at notion.so/my-integrations, share the pages you want indexed
                with it, then paste the secret. You&apos;ll pick pages on the manage page.
              </>
            )}
          </div>

          {error && (
            <div className="border border-[#8a6a1e]/40 bg-[#fdf8ec] px-2.5 py-1.5 font-mono text-[11px] text-[#8a6a1e] dark:bg-[#8a6a1e]/15">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-surface px-[18px] py-2.5">
          <button
            onClick={onClose}
            className="font-mono text-[12px] text-ink-2 transition-colors hover:text-foreground"
          >
            cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="border border-border bg-background px-3 py-[5px] font-mono text-[11.5px] text-foreground transition-colors hover:bg-muted disabled:opacity-40"
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
        <label className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-3">
          {label}
        </label>
        {hint ? <span className="font-mono text-[10px] text-ink-3">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
