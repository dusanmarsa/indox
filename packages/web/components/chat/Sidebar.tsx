"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";

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
  // server hands us a fresh list (e.g. after router.refresh()). This is the
  // React docs' "adjusting state when props change" pattern — preferred over
  // a setState-in-effect, which trips react-hooks/set-state-in-effect and
  // costs an extra render.
  const [items, setItems] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setItems(initial);
  }

  const remove = async (id: string) => {
    // Optimistic — drop locally first, then reconcile. If the DELETE fails,
    // the next layout fetch puts it back.
    setItems((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/conversations/${id}`, { method: "DELETE" }).catch(() => {});
    if (activeId === id) router.replace("/chat");
  };

  return (
    <aside className="w-64 shrink-0 border-r border-(--indox-border) bg-(--indox-bg) flex flex-col h-screen sticky top-0">
      <div className="p-3 border-b border-(--indox-border)">
        <Link
          href="/chat"
          className="flex items-center justify-between gap-2 px-2 py-1.5 font-mono text-[12px] text-(--indox-muted) hover:text-(--indox-fg) hover:bg-(--indox-surface) transition-colors"
        >
          <span>new chat</span>
          <Plus className="size-3.5" />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="px-2 py-4 font-mono text-[11px] text-(--indox-dim)">
            no conversations yet
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {items.map((c) => {
              const isActive = c.id === activeId;
              return (
                <li key={c.id} className="group relative">
                  <Link
                    href={`/chat/${c.id}`}
                    className={`flex items-center gap-2 px-2 py-1.5 pr-7 font-mono text-[12px] truncate transition-colors ${
                      isActive
                        ? "bg-(--indox-surface) text-(--indox-fg)"
                        : "text-(--indox-muted) hover:bg-(--indox-surface) hover:text-(--indox-fg)"
                    }`}
                  >
                    <MessageSquare className="size-3 shrink-0 text-(--indox-dim)" />
                    <span className="truncate">
                      {c.title || "untitled"}
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    onClick={(e) => {
                      e.preventDefault();
                      remove(c.id);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-(--indox-dim) hover:text-(--indox-fg) opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
