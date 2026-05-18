"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Brandmark, SearchField } from "@indox/ui";
import { cn } from "@/lib/utils";

type SidebarConversation = {
  id: string;
  title: string | null;
  updatedAt: Date | string;
};

export default function ChatSidebar({
  conversations: initial,
}: {
  conversations: SidebarConversation[];
}) {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const activeId = params?.id;
  // Track `initial` and overwrite local state during render whenever the
  // server hands us a fresh list (e.g. after router.refresh()).
  const [items, setItems] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setItems(initial);
  }
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => (c.title ?? "untitled").toLowerCase().includes(q));
  }, [items, query]);

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/conversations/${id}`, { method: "DELETE" }).catch(() => {});
    if (activeId === id) router.replace("/chat");
  };

  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-border bg-elev md:flex">
      <div className="flex flex-col gap-2.5 border-b border-border px-3.5 pb-3 pt-3.5">
        <div className="flex items-center px-1">
          <Brandmark size="md" />
        </div>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2.5 rounded-md bg-brand px-3 py-2 font-mono text-[12.5px] font-medium text-white transition-colors hover:bg-[#d76a4c]"
        >
          + New conversation
        </Link>
        <SearchField
          mono
          placeholder="Search conversations…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          containerClassName="min-w-0 px-3 py-2"
        />
      </div>

      <p className="px-4 pb-1.5 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
        Conversations
      </p>

      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 ? (
          <div className="px-3 py-3 font-mono text-[11px] text-ink-3">
            {items.length === 0 ? "no conversations yet" : "no matches"}
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filtered.map((c) => {
              const isActive = c.id === activeId;
              return (
                <li key={c.id} className="group relative">
                  <Link
                    href={`/chat/${c.id}`}
                    className={cn(
                      "relative block rounded-sm px-3 py-2 pr-8 transition-colors",
                      isActive
                        ? "bg-surface-2 text-ink"
                        : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                    )}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-sm bg-brand"
                      />
                    )}
                    <div className="truncate text-[13.5px] tracking-[-0.005em]">
                      {c.title || "untitled"}
                    </div>
                  </Link>
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    onClick={(e) => {
                      e.preventDefault();
                      remove(c.id);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-3 opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="border-t border-border px-4 py-3 font-mono text-[10.5px] tracking-[0.04em] text-ink-3">
        v0.1.0 · indox
      </div>
    </aside>
  );
}
