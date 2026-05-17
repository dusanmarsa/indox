"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export type ChatSource = {
  id: string;
  displayName: string;
  externalId: string;
  kind: string;
};

type ChatContextValue = {
  messages: UIMessage[];
  isLoading: boolean;
  append: (content: string, sourceIds?: string[]) => void;
  stop: () => void;
  sources: ChatSource[];
  conversationId: string | null;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  conversationId: initialConversationId,
  initialMessages = [],
  // When set, this provider runs in "public" mode: every chat send tags
  // the body with workspaceSlug, no conversation is minted, and source
  // discovery comes from `initialSources` (the public route can't call
  // /api/sources, which is auth-gated).
  publicWorkspaceSlug,
  initialSources,
  children,
}: {
  conversationId?: string;
  initialMessages?: UIMessage[];
  publicWorkspaceSlug?: string;
  initialSources?: ChatSource[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [transport] = useState(() => new DefaultChatTransport({ api: "/api/chat" }));
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null,
  );
  const isPublic = !!publicWorkspaceSlug;
  // When this turn started on a brand-new conversation, refresh the sidebar
  // after the stream completes so the new entry — now with a derived title —
  // shows up. Ref instead of state because we don't want to trigger renders.
  const justCreatedRef = useRef(false);

  // Only pass `id` when we have one. `useChat` recreates the underlying Chat
  // whenever `"id" in options` is true and the stored id doesn't match — and
  // since it auto-generates an id when undefined, passing `id: undefined`
  // triggers a recreate on every render, aborting any in-flight stream.
  const { messages, sendMessage, status, stop } = useChat({
    ...(initialConversationId ? { id: initialConversationId } : {}),
    messages: initialMessages,
    transport,
    onFinish: () => {
      if (justCreatedRef.current) {
        justCreatedRef.current = false;
        router.refresh();
      }
    },
  });

  const [sources, setSources] = useState<ChatSource[]>(initialSources ?? []);
  useEffect(() => {
    // Public mode skips the fetch — the server already passed sources in.
    if (isPublic) return;
    let cancelled = false;
    fetch("/api/sources")
      .then((r) => r.json())
      .then((data: { sources: ChatSource[] }) => {
        if (!cancelled) setSources(data.sources);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isPublic]);

  const isStreaming = status === "streaming" || status === "submitted";

  const append = async (content: string, sourceIds?: string[]) => {
    if (isStreaming) stop();

    let id = conversationId;
    // Authed mode: lazily mint the conversation on the very first send.
    // `history.replaceState` (instead of router.push) keeps the React tree
    // alive — a real navigation would unmount useChat and drop the
    // in-flight message. Public mode skips this — public chats are
    // ephemeral, no persisted history per visitor.
    if (!id && !isPublic) {
      try {
        const res = await fetch("/api/conversations", { method: "POST" });
        const { conversation } = (await res.json()) as {
          conversation: { id: string };
        };
        id = conversation.id;
        setConversationId(id);
        justCreatedRef.current = true;
        window.history.replaceState(null, "", `/chat/${id}`);
      } catch {
        // If the create fails we still let the message go out — it just
        // won't be persisted. Better than blocking the send.
      }
    }

    const body: Record<string, unknown> = {};
    if (id) body.conversationId = id;
    if (sourceIds && sourceIds.length) body.sourceIds = sourceIds;
    if (publicWorkspaceSlug) body.workspaceSlug = publicWorkspaceSlug;

    sendMessage(
      { text: content },
      Object.keys(body).length ? { body } : undefined,
    );
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading: isStreaming,
        sources,
        conversationId,
        append,
        stop,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}
