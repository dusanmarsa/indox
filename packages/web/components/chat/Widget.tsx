"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { ChatProvider } from "@/components/chat/context";
import ChatArea from "@/components/chat/Area";
import ChatInput from "@/components/chat/Input";

type Vis = "pill" | "open";

const W = 420;
const H = 560;

export function ChatWidget({ workspaceSlug }: { workspaceSlug?: string }) {
  const [vis, setVis] = useState<Vis>("pill");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (vis !== "open") return;
    const timer = setTimeout(() => {
      bodyRef.current?.querySelector<HTMLElement>("[contenteditable]")?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [vis]);

  return (
    <ChatProvider noUrlChange {...(workspaceSlug ? { publicWorkspaceSlug: workspaceSlug } : {})}>
      {vis === "pill" && (
        <button
          type="button"
          onClick={() => setVis("open")}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 shadow-lg transition-shadow hover:shadow-xl"
        >
          <MessageSquare className="size-4 text-ink-2" />
          <span className="font-mono text-[13px] text-ink-2">chat</span>
        </button>
      )}

      {vis === "open" && (
        <div
          className="fixed bottom-4 right-4 z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
          style={{ width: W, height: H }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-2 text-ink-2">
              <MessageSquare className="size-3.5" />
              <span className="font-mono text-[12px]">chat</span>
            </div>
            <button
              type="button"
              onClick={() => setVis("pill")}
              className="rounded p-1 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label="Close chat"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col">
            <div
              data-chat-shell
              className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] [scrollbar-width:none]"
            >
              <div className="px-4 py-6">
                <ChatArea />
              </div>
            </div>
            <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent">
              <div className="px-4 pb-4 pt-2">
                <ChatInput />
              </div>
            </div>
          </div>
        </div>
      )}
    </ChatProvider>
  );
}
