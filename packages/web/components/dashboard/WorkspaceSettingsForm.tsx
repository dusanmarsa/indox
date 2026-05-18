"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Pill,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@indox/ui";

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

type SlugState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok" }
  | { kind: "taken"; reason: string };

// Slugify lifted from common patterns: lowercase, ascii-fold-ish, strip
// anything not [a-z0-9], collapse runs of `-`, trim edges.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

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
  // While true, typing into `name` auto-fills `slug`. Once the user edits the
  // slug directly we stop overwriting, even if they later change the name.
  const [autoSlug, setAutoSlug] = useState(settings.slug === slugify(settings.name));
  const [slugState, setSlugState] = useState<SlugState>({ kind: "idle" });
  const origin = typeof window !== "undefined" ? window.location.origin : null;

  const publicUrl = origin ? `${origin}/w/${form.slug}` : `/w/${form.slug}`;

  // Premium models require BYO. Reflect that in the UI so the dropdown
  // doesn't let the owner pick a model that the API will refuse.
  const modelNeedsKey = form.model !== "gpt-4o-mini";
  const willHaveKey = form.openaiApiKey === null ? false : form.openaiApiKey ? true : hasKey;
  const modelInvalid = modelNeedsKey && !willHaveKey;

  // Debounced slug availability check. Skips the request when the slug hasn't
  // changed from the originally-saved one (always-available no-op).
  const slugCheckSeq = useRef(0);
  const checkSlug = useCallback(
    (slug: string) => {
      if (!slug || slug === settings.slug) {
        setSlugState({ kind: "idle" });
        return;
      }
      const seq = ++slugCheckSeq.current;
      setSlugState({ kind: "checking" });
      const url = `/api/workspaces/slug-check?slug=${encodeURIComponent(slug)}&excludeId=${encodeURIComponent(settings.id)}`;
      fetch(url)
        .then((r) => r.json())
        .then((data: { ok: boolean; reason?: string }) => {
          if (seq !== slugCheckSeq.current) return;
          setSlugState(
            data.ok
              ? { kind: "ok" }
              : { kind: "taken", reason: data.reason ?? "Slug is unavailable." }
          );
        })
        .catch(() => {
          if (seq !== slugCheckSeq.current) return;
          setSlugState({ kind: "idle" });
        });
    },
    [settings.slug, settings.id]
  );

  useEffect(() => {
    const t = setTimeout(() => checkSlug(form.slug), 350);
    return () => clearTimeout(t);
  }, [form.slug, checkSlug]);

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
      router.push("/");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const max = willHaveKey ? 10_000 : 200;
  const maxLabel = willHaveKey ? "10,000" : "200";

  return (
    <div className="flex flex-col gap-8">
      <Section label="Workspace">
        <Row label="name">
          <Input
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({
                ...f,
                name,
                slug: autoSlug ? slugify(name) : f.slug,
              }));
            }}
            maxLength={64}
          />
        </Row>
        <Row label="slug" hint="Auto-derived from the name. Used in the public chat URL.">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-ink-3">/w/</span>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setAutoSlug(false);
                  setForm({ ...form, slug: e.target.value.toLowerCase() });
                }}
                maxLength={48}
                pattern="[a-z0-9-]+"
                invalid={slugState.kind === "taken"}
                className="flex-1"
              />
            </div>
            <div className="min-h-[14px] font-mono text-[11px]">
              {slugState.kind === "checking" && (
                <span className="text-ink-3">checking availability…</span>
              )}
              {slugState.kind === "ok" && <span className="text-ok">available</span>}
              {slugState.kind === "taken" && <span className="text-bad">{slugState.reason}</span>}
              {slugState.kind === "idle" && form.slug === settings.slug && (
                <span className="text-ink-3">current slug</span>
              )}
            </div>
          </div>
        </Row>
      </Section>

      <Section
        label="Public chat"
        hint="Lets anyone with the URL chat with this workspace's indexed sources."
      >
        <Row label="enabled">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[12px] text-ink-2">
              {form.isPublic ? "anyone with the URL can chat" : "private — only you"}
            </span>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isPublic}
                onCheckedChange={(next) => {
                  if (next) {
                    setPublicConfirm(true);
                  } else {
                    save({ isPublic: false });
                    setForm({ ...form, isPublic: false });
                  }
                }}
              />
              {form.isPublic && <Pill tone="ok">public</Pill>}
            </div>
          </div>
        </Row>
        {form.isPublic && (
          <Row label="url">
            <Input value={publicUrl} readOnly copyable className="font-mono text-[12px]" />
          </Row>
        )}
      </Section>

      <Section
        label="Model & key"
        hint="Bring your own OpenAI key so public chat traffic runs on your billing."
      >
        <Row label="openai key">
          <div className="flex flex-col gap-2">
            <Input
              type="password"
              revealable
              placeholder={hasKey ? "•••• stored — type to replace" : "sk-…"}
              value={form.openaiApiKey ?? ""}
              onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value || "" })}
              autoComplete="off"
              spellCheck={false}
            />
            {hasKey && (
              <button
                type="button"
                onClick={() => setForm({ ...form, openaiApiKey: null })}
                className="self-start font-mono text-[11px] text-ink-2 underline-offset-2 transition-colors hover:text-ink hover:underline"
              >
                clear stored key
              </button>
            )}
            {form.openaiApiKey === null && (
              <span className="font-mono text-[11px] text-brand">
                Stored key will be cleared on save.
              </span>
            )}
          </div>
        </Row>
        <Row label="model">
          <div className="flex flex-col gap-2">
            <Select value={form.model} onValueChange={(model) => setForm({ ...form, model })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                    {m !== "gpt-4o-mini" ? "  (BYO key)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {modelInvalid && (
              <span className="font-mono text-[11px] text-bad">
                This model requires a BYO key. Add one above first.
              </span>
            )}
          </div>
        </Row>
      </Section>

      <Section label="Rate limit" hint={`${usageToday} / ${form.dailyCallLimit} chat calls today.`}>
        <Row label="daily limit">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={10}
              max={max}
              value={form.dailyCallLimit}
              onChange={(e) => setForm({ ...form, dailyCallLimit: Number(e.target.value) || 10 })}
              className="w-28"
            />
            <span className="font-mono text-[11px] text-ink-3">max {maxLabel}</span>
          </div>
        </Row>
      </Section>

      <div className="flex items-center gap-3 border-t border-border pt-5">
        <Button
          onClick={() => save()}
          disabled={
            saving || modelInvalid || slugState.kind === "taken" || slugState.kind === "checking"
          }
        >
          {saving ? "saving…" : "save changes"}
        </Button>
        {savedFlash && <span className="font-mono text-[11px] text-ok">saved ✓</span>}
        {error && (
          <span className="font-mono text-[11px] text-bad">
            {error.field ? `${error.field}: ` : ""}
            {error.error}
          </span>
        )}
      </div>

      <Section label="Danger zone" tone="warn">
        <Row label="delete workspace" hint="Removes adapters, sources, chat history, and tokens.">
          <div className="flex flex-col gap-2">
            <Button
              variant={deleteConfirm ? "accent" : "soft"}
              onClick={onDelete}
              disabled={!canDelete || saving}
              className="self-start"
            >
              {!canDelete
                ? "can't delete only workspace"
                : deleteConfirm
                  ? "click again to confirm"
                  : "delete workspace"}
            </Button>
            {deleteConfirm && (
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="self-start font-mono text-[11px] text-ink-2 hover:text-ink"
              >
                cancel
              </button>
            )}
          </div>
        </Row>
      </Section>

      <PublicConfirmDialog
        open={publicConfirm}
        slug={form.slug}
        hasKey={willHaveKey}
        onOpenChange={(open) => !open && setPublicConfirm(false)}
        onConfirm={() => {
          setPublicConfirm(false);
          save({ isPublic: true });
          setForm({ ...form, isPublic: true });
        }}
      />
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
      className={`overflow-hidden rounded-md border ${
        tone === "warn" ? "border-bad/40" : "border-border"
      } bg-surface`}
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">
          {label}
        </span>
        {hint && <span className="text-right font-mono text-[10.5px] text-ink-3">{hint}</span>}
      </div>
      <div className="divide-y divide-border">{children}</div>
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
    <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:gap-4">
      <div className="pt-0.5 sm:w-[140px] sm:shrink-0 sm:pt-1.5">
        <Label>{label}</Label>
        {hint && <p className="mt-1 font-mono text-[10.5px] text-ink-3">{hint}</p>}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function PublicConfirmDialog({
  open,
  slug,
  hasKey,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  slug: string;
  hasKey: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Make this workspace public?</DialogTitle>
        </DialogHeader>
        <p className="font-mono text-[12px] leading-[1.6] text-ink-2">
          Anyone with the URL <code className="text-ink">/w/{slug}</code> will be able to chat with
          everything indexed in this workspace. No login required.
        </p>
        {!hasKey && (
          <p className="rounded-md border border-warn/40 bg-warn/10 p-3 font-mono text-[11.5px] leading-[1.6] text-warn">
            ⚠ No BYO OpenAI key set — public traffic will run on the platform key at a strict daily
            ceiling.
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            cancel
          </Button>
          <Button variant="accent" onClick={onConfirm}>
            make public
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
