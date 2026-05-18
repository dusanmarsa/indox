"use client";

import * as React from "react";
import { cn } from "../../cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../atoms/dropdown-menu";

type WorkspaceOption = {
  id: string;
  name: string;
  badge?: React.ReactNode;
};

type WorkspaceSwitcherProps = Omit<React.ComponentProps<"div">, "onSelect"> & {
  workspaces: WorkspaceOption[];
  activeId: string;
  onSelect?: (id: string) => void;
  onCreate?: () => void;
  createLabel?: React.ReactNode;
  groupLabel?: React.ReactNode;
};

function WorkspaceSwitcher({
  workspaces,
  activeId,
  onSelect,
  onCreate,
  createLabel = "+ New workspace",
  groupLabel = "Switch workspace",
  className,
  ...props
}: WorkspaceSwitcherProps) {
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  return (
    <div data-slot="workspace-switcher" className={className} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-2.5 py-1.5 font-mono text-[12.5px] text-ink transition-colors",
              "hover:border-border-strong hover:bg-surface-2",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-soft"
            )}
          >
            <span>{active?.name ?? "—"}</span>
            {active?.badge}
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="text-ink-3"
              aria-hidden
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {groupLabel && <DropdownMenuLabel>{groupLabel}</DropdownMenuLabel>}
          {workspaces.map((w) => {
            const isActive = w.id === activeId;
            return (
              <DropdownMenuItem
                key={w.id}
                onSelect={() => onSelect?.(w.id)}
                data-active={isActive}
                className={cn(isActive && "bg-surface-2 text-ink not-last:mb-1")}
              >
                <span className="flex-1">{w.name}</span>
                {w.badge}
                {isActive && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-brand"
                    aria-hidden
                  >
                    <path d="m3 8 3.5 3.5L13 5" />
                  </svg>
                )}
              </DropdownMenuItem>
            );
          })}
          {onCreate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onCreate}>{createLabel}</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { WorkspaceSwitcher };
export type { WorkspaceSwitcherProps, WorkspaceOption };
