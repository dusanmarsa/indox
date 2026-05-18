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
  publicWorkspaceSlug,
  initialSources,
  noUrlChange = false,
  children,
}: {
  conversationId?: string;
  initialMessages?: UIMessage[];
  publicWorkspaceSlug?: string;
  initialSources?: ChatSource[];
  noUrlChange?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [transport] = useState(() => new DefaultChatTransport({ api: "/api/chat" }));
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const isPublic = !!publicWorkspaceSlug;
  const justCreatedRef = useRef(false);
  const noUrlChangeRef = useRef(noUrlChange);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    ...(initialConversationId ? { id: initialConversationId } : {}),
    messages: initialMessages,
    transport,
    onFinish: () => {
      if (justCreatedRef.current) {
        justCreatedRef.current = false;
        if (!noUrlChangeRef.current) {
          router.refresh();
        }
      }
    },
  });

  const [anonSessionId] = useState<string | null>(() => {
    if (!publicWorkspaceSlug) return null;
    const storageKey = `indox:session:${publicWorkspaceSlug}`;
    let sid = localStorage.getItem(storageKey);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(storageKey, sid);
    }
    return sid;
  });

  useEffect(() => {
    if (!publicWorkspaceSlug || !anonSessionId) return;

    fetch(`/api/w/${publicWorkspaceSlug}/history?sessionId=${encodeURIComponent(anonSessionId)}`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data: { messages: UIMessage[] }) => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});
  }, [publicWorkspaceSlug, anonSessionId, setMessages]);

  const [sources, setSources] = useState<ChatSource[]>(initialSources ?? []);
  useEffect(() => {
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
    if (!id && !isPublic) {
      try {
        const res = await fetch("/api/conversations", { method: "POST" });
        const { conversation } = (await res.json()) as {
          conversation: { id: string };
        };
        id = conversation.id;
        setConversationId(id);
        justCreatedRef.current = true;
        if (!noUrlChange) {
          window.history.replaceState(null, "", `/chat/${id}`);
        }
      } catch {
        // If the create fails we still let the message go out — it just
        // won't be persisted. Better than blocking the send.
      }
    }

    const body: Record<string, unknown> = {};
    if (id) body.conversationId = id;
    if (sourceIds && sourceIds.length) body.sourceIds = sourceIds;
    if (publicWorkspaceSlug) body.workspaceSlug = publicWorkspaceSlug;
    if (anonSessionId) body.anonSessionId = anonSessionId;

    sendMessage({ text: content }, Object.keys(body).length ? { body } : undefined);
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
