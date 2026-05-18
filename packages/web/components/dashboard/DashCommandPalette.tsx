"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CommandPalette } from "@indox/ui";

export type CommandPaletteWorkspace = {
  id: string;
  name: string;
  slug: string;
};

export type CommandPaletteSource = {
  id: string;
  adapterId: string;
  displayName: string;
  type: string;
};

export type CommandPaletteAdapter = {
  id: string;
  kind: string;
};

type Props = {
  activeWorkspaceId: string;
  workspaces: CommandPaletteWorkspace[];
  sources: CommandPaletteSource[];
  adapters: CommandPaletteAdapter[];
};

// Mounted once at the dashboard root. Owns its own open state and a global
// ⌘K / Ctrl-K binding. Items are computed from the props the layout already
// fetches (workspaces, sources, adapters) so we don't re-query the API.
export function DashCommandPalette({ activeWorkspaceId, workspaces, sources, adapters }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // ⌘K on mac, Ctrl-K elsewhere. Block the browser's default location-bar
      // shortcut when our shell handles it.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("indox:open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("indox:open-command-palette", onOpenEvent);
    };
  }, []);

  const items = useMemo(() => {
    const go = (href: Route | string) => () => router.push(href as Route);

    const switchWorkspace = (id: string) => async () => {
      await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    };

    return [
      {
        id: "nav-overview",
        group: "Go to",
        label: "Overview",
        keywords: "home dashboard",
        onSelect: go("/"),
      },
      {
        id: "nav-sources",
        group: "Go to",
        label: "Library",
        keywords: "sources documents",
        onSelect: go("/sources"),
      },
      {
        id: "nav-queries",
        group: "Go to",
        label: "Queries",
        keywords: "query log",
        onSelect: go("/queries"),
      },
      {
        id: "nav-adapters",
        group: "Go to",
        label: "Adapters",
        keywords: "connectors",
        onSelect: go("/adapters"),
      },
      {
        id: "nav-mcp",
        group: "Go to",
        label: "MCP",
        keywords: "token mcp server",
        onSelect: go("/mcp"),
      },
      {
        id: "nav-settings",
        group: "Go to",
        label: "Settings",
        keywords: "workspace settings",
        onSelect: go("/settings"),
      },

      ...workspaces.map((w) => ({
        id: `ws-${w.id}`,
        group: "Workspaces",
        label: w.name,
        description: w.id === activeWorkspaceId ? "active" : `/w/${w.slug}`,
        keywords: w.slug,
        onSelect: switchWorkspace(w.id),
      })),

      ...sources.slice(0, 24).map((s) => ({
        id: `src-${s.id}`,
        group: "Sources",
        label: s.displayName,
        description: s.type,
        keywords: `${s.type} ${s.displayName}`,
        onSelect: go(`/adapters/${s.adapterId}` as Route),
      })),

      ...adapters.map((a) => ({
        id: `ad-${a.id}`,
        group: "Adapters",
        label: `${a.kind} · ${a.id.slice(0, 8)}`,
        keywords: `${a.kind} adapter`,
        onSelect: go(`/adapters/${a.id}` as Route),
      })),

      {
        id: "action-new-workspace",
        group: "Actions",
        label: "+ New workspace",
        keywords: "create",
        onSelect: go("/workspaces/new"),
      },
    ];
  }, [router, workspaces, sources, adapters, activeWorkspaceId]);

  return (
    <CommandPalette
      open={open}
      onOpenChange={setOpen}
      items={items}
      placeholder="Type a command or search…"
      hint={
        <>
          <span>↵ to select · esc to close</span>
        </>
      }
    />
  );
}
