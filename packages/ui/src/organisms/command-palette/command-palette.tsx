"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Dialog as Primitive } from "radix-ui";
import { cn } from "../../cn";

type CommandItem = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  shortcut?: React.ReactNode;
  group?: string;
  keywords?: string;
  onSelect?: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyLabel?: React.ReactNode;
  hint?: React.ReactNode;
};

function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = "Type a command or search…",
  emptyLabel = "No results",
  hint,
}: CommandPaletteProps) {
  const grouped = React.useMemo(() => {
    const out = new Map<string | undefined, CommandItem[]>();
    for (const it of items) {
      if (!out.has(it.group)) out.set(it.group, []);
      out.get(it.group)!.push(it);
    }
    return Array.from(out.entries());
  }, [items]);

  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Primitive.Content
          aria-label="Command palette"
          className={cn(
            "fixed top-[15vh] left-1/2 z-50 w-[640px] max-w-[90vw] -translate-x-1/2",
            "overflow-hidden rounded-xl border border-border bg-elev shadow-2xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          <Primitive.Title className="sr-only">Command palette</Primitive.Title>
          <Command loop>
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="text-ink-3"
                aria-hidden
              >
                <circle cx="7" cy="7" r="5" />
                <path d="m11 11 4 4" />
              </svg>
              <Command.Input
                placeholder={placeholder}
                className="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3"
              />
            </div>
            <Command.List className="max-h-[420px] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center font-mono text-[12px] text-ink-3">
                {emptyLabel}
              </Command.Empty>
              {grouped.map(([group, list]) => (
                <Command.Group
                  key={group ?? "_"}
                  heading={group}
                  className="mb-2 last:mb-0 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-ink-3 [&_[cmdk-group-heading]]:uppercase"
                >
                  {list.map((it) => (
                    <Command.Item
                      key={it.id}
                      value={`${String(it.label)} ${it.keywords ?? ""} ${it.description ?? ""}`}
                      onSelect={() => {
                        it.onSelect?.();
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex w-full cursor-default items-center gap-3 rounded-sm px-2.5 py-2 text-left text-[13px] transition-colors",
                        "text-ink-2",
                        "aria-selected:bg-surface-2 aria-selected:text-ink"
                      )}
                    >
                      <span className="flex-1">
                        <span>{it.label}</span>
                        {it.description && (
                          <span className="block font-mono text-[11px] text-ink-3">
                            {it.description}
                          </span>
                        )}
                      </span>
                      {it.shortcut && (
                        <span className="font-mono text-[10.5px] tracking-[0.1em] text-ink-3">
                          {it.shortcut}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
            {hint && (
              <div className="flex items-center justify-between border-t border-border px-4 py-2 font-mono text-[10.5px] text-ink-3">
                {hint}
              </div>
            )}
          </Command>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}

export { CommandPalette };
export type { CommandPaletteProps, CommandItem };
