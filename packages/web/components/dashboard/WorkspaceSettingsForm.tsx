"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  hasOpenaiKey: boolean;
  model: string;
  dailyCallLimit: number;
};

type ApiError = { error: string; field?: string };

export function WorkspaceSettingsForm({
  settings,
  usageToday,
  allowedModels,
  canDelete,
}: {
  settings: Settings;
  usageToday: number;
  allowedModels: string[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => ({
    name: settings.name,
    slug: settings.slug,
    isPublic: settings.isPublic,
    // Empty = no change, null = clear stored key, "sk-…" = set new
    openaiApiKey: "" as string | null,
    model: settings.model,
    dailyCallLimit: settings.dailyCallLimit,
  }));
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [publicConfirm, setPublicConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [hasKey, setHasKey] = useState(settings.hasOpenaiKey);
  const origin = typeof window !== "undefined" ? window.location.origin : null

  const publicUrl = origin ? `${origin}/w/${form.slug}` : `/w/${form.slug}`;

  // Premium models require BYO. Reflect that in the UI so the dropdown
  // doesn't let the owner pick a model that the API will refuse.
  const modelNeedsKey = form.model !== "gpt-4o-mini";
  const willHaveKey = form.openaiApiKey === null ? false : form.openaiApiKey ? true : hasKey;
  const modelInvalid = modelNeedsKey && !willHaveKey;

  async function save(overrides: Partial<typeof form> = {}) {
    setSaving(true);
    setError(null);
    try {
      const patch: Record<string, unknown> = {};
      const next = { ...form, ...overrides };
      if (next.name !== settings.name) patch.name = next.name;
      if (next.slug !== settings.slug) patch.slug = next.slug;
      if (next.isPublic !== settings.isPublic) patch.isPublic = next.isPublic;
      if (next.openaiApiKey !== "") patch.openaiApiKey = next.openaiApiKey;
      if (next.model !== settings.model) patch.model = next.model;
      if (next.dailyCallLimit !== settings.dailyCallLimit) {
        patch.dailyCallLimit = next.dailyCallLimit;
      }

      if (Object.keys(patch).length === 0) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
        return;
      }

      const res = await fetch(`/api/workspaces/${settings.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError({
          error: data?.error ?? "Save failed.",
          field: data?.field,
        });
        return;
      }
      // Reflect the server's authoritative view (it may have re-validated
      // and snapped the model back to default, etc.).
      const fresh = data.settings as Settings;
      setForm({
        name: fresh.name,
        slug: fresh.slug,
        isPublic: fresh.isPublic,
        openaiApiKey: "",
        model: fresh.model,
        dailyCallLimit: fresh.dailyCallLimit,
      });
      setHasKey(fresh.hasOpenaiKey);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${settings.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError({ error: data?.error ?? "Delete failed." });
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  // ─── render helpers ────────────────────────────────────────────────────

  const max = willHaveKey ? 10_000 : 200;
  const maxLabel = willHaveKey ? "10,000" : "200";

  return (
    <div className="space-y-8">
      {/* ── basics ── */}
      <Section label="Workspace">
        <Row label="name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-(--indox-border) bg-background px-2 py-[6px] font-mono text-[12px] text-foreground transition-colors focus:border-(--indox-muted) focus:outline-none"
            maxLength={64}
          />
        </Row>
        <Row label="slug" hint="Used in the public chat URL.">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-(--indox-dim)">/w/</span>
            <input
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: e.target.value.toLowerCase() })
              }
              className="flex-1 border border-(--indox-border) bg-background px-2 py-[6px] font-mono text-[12px] text-foreground transition-colors focus:border-(--indox-muted) focus:outline-none"
              maxLength={48}
              pattern="[a-z0-9-]+"
            />
          </div>
        </Row>
      </Section>

      {/* ── public chat ── */}
      <Section
        label="Public chat"
        hint="Lets anyone with the URL chat with this workspace's indexed sources. No login required."
      >
        <Row label="enabled">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[12px] text-(--indox-muted)">
              {form.isPublic ? "anyone with the URL can chat" : "private — only you"}
            </span>
            <button
              type="button"
              onClick={() => {
                if (!form.isPublic) {
                  // Going public is irreversible-ish — make them confirm.
                  setPublicConfirm(true);
                } else {
                  save({ isPublic: false });
                  setForm({ ...form, isPublic: false });
                }
              }}
              className={`border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
                form.isPublic
                  ? "border-(--indox-accent) bg-(--indox-accent)/10 text-(--indox-accent)"
                  : "border-(--indox-border) text-(--indox-muted) hover:border-(--indox-muted)"
              }`}
            >
              {form.isPublic ? "public" : "private"}
            </button>
          </div>
        </Row>
        {form.isPublic && (
          <Row label="url">
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate border border-(--indox-border) bg-background px-2 py-[5px] font-mono text-[11.5px] text-foreground">
                {publicUrl}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(publicUrl)}
                className="border border-(--indox-border) px-2 py-[5px] font-mono text-[11px] text-(--indox-muted) transition-colors hover:border-(--indox-muted) hover:text-foreground"
              >
                copy
              </button>
            </div>
          </Row>
        )}
      </Section>

      {/* ── BYO key + model ── */}
      <Section
        label="Model & key"
        hint="Bring your own OpenAI key so public chat traffic runs on your billing. Without a key, public chats use the platform default at a much lower rate limit."
      >
        <Row label="openai key">
          <div className="flex flex-col gap-1.5">
            <input
              type="password"
              placeholder={hasKey ? "•••• stored — type to replace" : "sk-…"}
              value={form.openaiApiKey ?? ""}
              onChange={(e) =>
                setForm({ ...form, openaiApiKey: e.target.value || "" })
              }
              className="w-full border border-(--indox-border) bg-background px-2 py-[6px] font-mono text-[12px] text-foreground transition-colors focus:border-(--indox-muted) focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            {hasKey && (
              <button
                type="button"
                onClick={() => setForm({ ...form, openaiApiKey: null })}
                className="self-start font-mono text-[11px] text-(--indox-muted) underline-offset-2 hover:underline"
              >
                clear stored key
              </button>
            )}
            {form.openaiApiKey === null && (
              <span className="font-mono text-[11px] text-(--indox-accent)">
                Stored key will be cleared on save.
              </span>
            )}
          </div>
        </Row>
        <Row label="model">
          <div className="flex flex-col gap-1.5">
            <select
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full border border-(--indox-border) bg-background px-2 py-[6px] font-mono text-[12px] text-foreground transition-colors focus:border-(--indox-muted) focus:outline-none"
            >
              {allowedModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                  {m !== "gpt-4o-mini" ? "  (BYO key)" : ""}
                </option>
              ))}
            </select>
            {modelInvalid && (
              <span className="font-mono text-[11px] text-(--indox-accent)">
                This model requires a BYO key. Add one above first.
              </span>
            )}
          </div>
        </Row>
      </Section>

      {/* ── limits ── */}
      <Section
        label="Rate limit"
        hint={`${usageToday} / ${form.dailyCallLimit} chat calls today.`}
      >
        <Row label="daily limit">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={10}
              max={max}
              value={form.dailyCallLimit}
              onChange={(e) =>
                setForm({ ...form, dailyCallLimit: Number(e.target.value) || 10 })
              }
              className="w-28 border border-(--indox-border) bg-background px-2 py-[6px] font-mono text-[12px] text-foreground transition-colors focus:border-(--indox-muted) focus:outline-none"
            />
            <span className="font-mono text-[11px] text-(--indox-dim)">
              max {maxLabel}
            </span>
          </div>
        </Row>
      </Section>

      {/* ── actions ── */}
      <div className="flex items-center gap-3 border-t border-(--indox-border) pt-5">
        <button
          type="button"
          onClick={() => save()}
          disabled={saving || modelInvalid}
          className="border border-(--indox-accent) bg-(--indox-accent)/10 px-4 py-[7px] font-mono text-[12px] text-(--indox-accent) transition-colors hover:bg-(--indox-accent)/15 disabled:opacity-50"
        >
          {saving ? "saving…" : "save changes"}
        </button>
        {savedFlash && (
          <span className="font-mono text-[11px] text-(--indox-ok)">saved ✓</span>
        )}
        {error && (
          <span className="font-mono text-[11px] text-(--indox-accent)">
            {error.field ? `${error.field}: ` : ""}
            {error.error}
          </span>
        )}
      </div>

      {/* ── danger zone ── */}
      <Section label="Danger zone" tone="warn">
        <Row label="delete workspace" hint="Removes adapters, sources, chat history, and tokens.">
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={onDelete}
              disabled={!canDelete || saving}
              className="self-start border border-(--indox-border) px-3 py-[6px] font-mono text-[11px] uppercase tracking-[0.08em] text-(--indox-muted) transition-colors hover:border-(--indox-accent) hover:text-(--indox-accent) disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!canDelete
                ? "can't delete only workspace"
                : deleteConfirm
                  ? "click again to confirm"
                  : "delete workspace"}
            </button>
            {deleteConfirm && (
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="self-start font-mono text-[11px] text-(--indox-muted) underline-offset-2 hover:underline"
              >
                cancel
              </button>
            )}
          </div>
        </Row>
      </Section>

      {/* ── go-public confirmation modal ── */}
      {publicConfirm && (
        <PublicConfirmModal
          slug={form.slug}
          hasKey={willHaveKey}
          onCancel={() => setPublicConfirm(false)}
          onConfirm={() => {
            setPublicConfirm(false);
            save({ isPublic: true });
            setForm({ ...form, isPublic: true });
          }}
        />
      )}
    </div>
  );
}

function Section({
  label,
  hint,
  tone,
  children,
}: {
  label: string;
  hint?: string;
  tone?: "warn";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border ${
        tone === "warn"
          ? "border-(--indox-accent)/30"
          : "border-(--indox-border)"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[11px]">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-(--indox-dim)">
          {label}
        </span>
        {hint && (
          <span className="text-right font-mono text-[10.5px] text-(--indox-dim)">{hint}</span>
        )}
      </div>
      <div className="divide-y divide-(--indox-border)">{children}</div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 px-[18px] py-[14px]">
      <div className="w-[140px] shrink-0 pt-1">
        <p className="font-mono text-[12px] text-(--indox-muted)">{label}</p>
        {hint && (
          <p className="mt-0.5 font-mono text-[10.5px] text-(--indox-dim)">{hint}</p>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function PublicConfirmModal({
  slug,
  hasKey,
  onCancel,
  onConfirm,
}: {
  slug: string;
  hasKey: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[460px] border border-(--indox-border) bg-background p-6">
        <h2 className="mb-3 text-[15px] font-semibold">Make this workspace public?</h2>
        <p className="mb-3 font-mono text-[12px] leading-[1.6] text-(--indox-muted)">
          Anyone with the URL <code className="text-foreground">/w/{slug}</code> will be
          able to chat with everything indexed in this workspace. Their queries
          will reach your indexed code and docs through the chat interface — no
          login required.
        </p>
        {!hasKey && (
          <p className="mb-3 border border-(--indox-accent)/30 bg-(--indox-accent)/5 p-2.5 font-mono text-[11.5px] leading-[1.6] text-(--indox-accent)">
            ⚠ No BYO OpenAI key set — public traffic will run on the platform key
            at a strict daily ceiling. Add a key if you expect any real volume.
          </p>
        )}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border border-(--indox-border) px-3 py-[6px] font-mono text-[11px] text-(--indox-muted) hover:border-(--indox-muted)"
          >
            cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="border border-(--indox-accent) bg-(--indox-accent)/10 px-3 py-[6px] font-mono text-[11px] text-(--indox-accent) hover:bg-(--indox-accent)/15"
          >
            make public
          </button>
        </div>
      </div>
    </div>
  );
}
