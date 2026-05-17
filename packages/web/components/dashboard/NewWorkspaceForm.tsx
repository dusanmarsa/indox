"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// Mirror of core's `slugify` — client-side preview only; server re-runs the
// authoritative version (including reserved-word/collision checks).
function localSlugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function NewWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-suggest a slug from the name until the user edits the slug field
  // themselves. Once they type in it, we stop overwriting.
  const suggested = useMemo(() => localSlugify(name), [name]);
  const effectiveSlug = slugTouched ? slug : suggested;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: effectiveSlug || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't create workspace.");
        return;
      }
      // Switch into the new workspace so subsequent pages render it.
      const ws = data.workspace as { id: string };
      await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ws.id }),
      });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full border border-(--indox-border) bg-background px-2 py-[7px] font-mono text-[12.5px] text-foreground transition-colors focus:border-(--indox-muted) focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-(--indox-dim)">
          name
        </span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={64}
          required
          className={inputCls}
          placeholder="Client A"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-(--indox-dim)">
          slug
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-(--indox-dim)">/w/</span>
          <input
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            maxLength={48}
            pattern="[a-z0-9-]+"
            className={inputCls}
            placeholder="client-a"
          />
        </div>
        <p className="mt-1.5 font-mono text-[10.5px] text-(--indox-dim)">
          Used for the public chat URL once enabled. Editable later.
        </p>
      </label>

      <div className="flex items-center gap-3 border-t border-(--indox-border) pt-5">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="border border-(--indox-accent) bg-(--indox-accent)/10 px-4 py-[7px] font-mono text-[12px] text-(--indox-accent) transition-colors hover:bg-(--indox-accent)/15 disabled:opacity-50"
        >
          {saving ? "creating…" : "create workspace"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="font-mono text-[11px] text-(--indox-muted) hover:text-foreground"
        >
          cancel
        </button>
        {error && (
          <span className="font-mono text-[11px] text-(--indox-accent)">{error}</span>
        )}
      </div>
    </form>
  );
}
