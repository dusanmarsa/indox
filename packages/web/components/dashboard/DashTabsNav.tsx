"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { Search } from "lucide-react";
import { Avatar, IconButton, Kbd } from "@indox/ui";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher, type WorkspaceOption } from "./WorkspaceSwitcher";
import { DashThemeToggle } from "./DashThemeToggle";

/**
 * Horizontal top nav for the dashboard. Layout adapts:
 *  - mobile  : brand · switcher · search-icon · theme · avatar  (tabs hidden,
 *              reachable via the command palette)
 *  - md+     : adds the centred pill-tab strip and the labelled search pill
 */

const TABS = [
  { href: "/", label: "Overview", exact: true },
  { href: "/sources", label: "Library" },
  { href: "/queries", label: "Queries" },
  { href: "/adapters", label: "Adapters" },
  { href: "/mcp", label: "MCP" },
  { href: "/settings", label: "Settings" },
];

export function DashTabsNav({
  activeWorkspaceId,
  workspaces,
  userInitial = "U",
}: {
  activeWorkspaceId: string;
  workspaces: WorkspaceOption[];
  userInitial?: string;
}) {
  const pathname = usePathname();
  const openPalette = () => window.dispatchEvent(new CustomEvent("indox:open-command-palette"));
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1320px] items-center gap-2 px-4 py-3 sm:gap-4 sm:px-8 sm:py-4 lg:px-12 lg:py-[18px]">
        <Link
          href={"/" as Route}
          className="flex shrink-0 items-center gap-2.5 font-mono text-[13px] whitespace-nowrap text-ink"
        >
          <span
            aria-hidden
            className="inline-block h-[7px] w-[7px] rounded-full bg-brand"
            style={{ boxShadow: "var(--indox-dot-glow)" }}
          />
          indox
        </Link>

        <div className="min-w-0 -ml-1 sm:-ml-2">
          <WorkspaceSwitcher activeWorkspaceId={activeWorkspaceId} workspaces={workspaces} />
        </div>

        <nav className="ml-2 hidden flex-1 items-center justify-center gap-1 md:flex">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href as Route}
                className={cn(
                  "rounded-full px-4 py-[7px] font-mono text-[12px] transition-colors",
                  active ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Mobile: icon-only command palette trigger (also pulls double-duty
              as the mobile nav, since the palette has every route in it). */}
          <IconButton aria-label="Open command palette" onClick={openPalette} className="md:hidden">
            <Search className="size-3.5" />
          </IconButton>

          {/* md+: labelled search pill */}
          <button
            type="button"
            onClick={openPalette}
            className="hidden items-center gap-2 rounded-full border border-border px-3.5 py-[7px] font-mono text-[12px] text-ink-2 transition-colors hover:border-border-strong hover:bg-surface-2 hover:text-ink md:inline-flex"
          >
            Search
            <Kbd>⌘ K</Kbd>
          </button>

          <DashThemeToggle />
          <Avatar size="md">{userInitial}</Avatar>
        </div>
      </div>
    </header>
  );
}
