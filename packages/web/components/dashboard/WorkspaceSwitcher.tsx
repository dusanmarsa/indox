"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

export type WorkspaceOption = {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
};

export function WorkspaceSwitcher({
  activeWorkspaceId,
  workspaces,
}: {
  activeWorkspaceId: string;
  workspaces: WorkspaceOption[];
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const active = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  // Close on outside click. Cheap pattern; no need for a popover library.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function switchTo(id: string) {
    if (id === activeWorkspaceId) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        console.error("workspace switch failed", await res.text());
        return;
      }
      // Refresh server components so every page reflects the new active
      // workspace without a full reload.
      router.refresh();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={containerRef} className="relative px-3 pt-3 pb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="flex w-full items-center justify-between gap-2 border border-(--indox-border) bg-background px-2.5 py-2 text-left transition-colors hover:bg-muted/60 disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="block h-1.5 w-1.5 shrink-0 bg-(--indox-accent)" aria-hidden />
          <span className="truncate font-mono text-[12px] text-foreground">
            {active?.name ?? "—"}
          </span>
          {active?.isPublic && (
            <span className="shrink-0 border border-(--indox-border) px-1 font-mono text-[9px] uppercase tracking-[0.08em] text-(--indox-muted)">
              public
            </span>
          )}
        </span>
        <span className="font-mono text-[10px] text-(--indox-dim)">▾</span>
      </button>

      {open && (
        <div
          className="absolute left-3 right-3 top-[calc(100%-4px)] z-20 border border-(--indox-border) bg-background shadow-md"
          role="listbox"
        >
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => switchTo(w.id)}
              className="flex w-full items-center justify-between gap-2 px-2.5 py-[7px] text-left transition-colors hover:bg-muted/60"
              role="option"
              aria-selected={w.id === activeWorkspaceId}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={
                    w.id === activeWorkspaceId
                      ? "block h-1.5 w-1.5 shrink-0 bg-(--indox-accent)"
                      : "block h-1.5 w-1.5 shrink-0 border border-(--indox-dim)"
                  }
                  aria-hidden
                />
                <span className="truncate font-mono text-[12px] text-foreground">{w.name}</span>
              </span>
              {w.isPublic && (
                <span className="shrink-0 border border-(--indox-border) px-1 font-mono text-[9px] uppercase tracking-[0.08em] text-(--indox-muted)">
                  public
                </span>
              )}
            </button>
          ))}
          <div className="border-t border-(--indox-border)">
            <Link
              href={"/dashboard/workspaces/new" as Route}
              onClick={() => setOpen(false)}
              className="block px-2.5 py-[7px] font-mono text-[12px] text-(--indox-muted) transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              + new workspace
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
