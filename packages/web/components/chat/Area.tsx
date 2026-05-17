"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { ChatThinking, ChatToolCall } from "@indox/ui";
import { Message, MessageBody } from "./Message";
import { useChatContext } from "./context";

// Keep in sync with `tokenFor` in Input.tsx. Matches `@[anything-without-]]`.
const MENTION_TOKEN_RE = /@\[([^\]]+)\]/g;

function UserText({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const m of text.matchAll(MENTION_TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > lastIndex) {
      nodes.push(<Fragment key={`t-${lastIndex}`}>{text.slice(lastIndex, idx)}</Fragment>);
    }
    nodes.push(
      <span
        key={`c-${idx}`}
        className="mx-0.5 inline-flex items-center rounded-xs bg-brand-soft px-1.5 py-px align-middle font-mono text-[11px] text-brand"
      >
        @{m[1]}
      </span>
    );
    lastIndex = idx + m[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`t-${lastIndex}`}>{text.slice(lastIndex)}</Fragment>);
  }
  return <div className="whitespace-pre-wrap break-words">{nodes}</div>;
}

type SearchOutput =
  | {
      status: "ok";
      scope: { matched: string[]; unmatched: string[]; pinned?: boolean } | null;
      note?: string;
      chunks: { url: string | null; text: string }[];
    }
  | { status: "no_results" | "unknown_source"; message: string };

type ListSourcesOutput = {
  status: "ok";
  count: number;
  sources: { name: string; kind: string }[];
};

const ChatArea = () => {
  const { messages, isLoading } = useChatContext();
  const bottomRef = useRef<HTMLDivElement>(null);
  // `isAtBottom` reflects whether the bottom sentinel is currently in (or
  // very near) the viewport. We only autoscroll while it is — if the user has
  // scrolled up to read something, we leave them alone until they scroll back
  // down (or click the jump-to-bottom button).
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsAtBottom(entry.isIntersecting),
      // 160px bottom margin: treat "within a screenful of the end" as still
      // pinned, so small streaming jitters and the sticky input bar don't
      // trip the user-scrolled-away detection.
      { root: null, rootMargin: "0px 0px 160px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Autoscroll on any change to the message list (new message, streaming
  // chunk, tool call resolving) — but only if the user is already at bottom.
  const lastMessage = messages[messages.length - 1];
  const partsSignature = lastMessage
    ? lastMessage.parts
        .map((p) => ("text" in p && typeof p.text === "string" ? p.text.length : p.type))
        .join("|")
    : "";
  useEffect(() => {
    if (!isAtBottom) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, partsSignature, isLoading, isAtBottom]);

  const jumpToBottom = () => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  };

  // Show "Thinking…" while we're waiting on the server before the assistant
  // has produced any rendered content. Once the first text or tool part lands
  // on the assistant message, the regular parts render takes over.
  const showThinking =
    isLoading && (!lastMessage || lastMessage.role === "user" || lastMessage.parts.length === 0);

  return (
    <div className="flex flex-col gap-10">
      {messages.map((m, mi) => (
        // The AI SDK occasionally emits two messages with the same id during
        // streaming (e.g. optimistic + server-assigned colliding). Combine
        // with index so React's reconciler can keep them distinct.
        <Message key={`${m.id}-${mi}`} from={m.role}>
          {m.parts.map((p, i) => {
            if (p.type === "text") {
              return m.role === "user" ? (
                <UserText key={i} text={p.text} />
              ) : (
                <MessageBody key={i}>{p.text}</MessageBody>
              );
            }
            if (p.type === "tool-searchCode") {
              const input = p.input as { query?: string; sources?: string[] } | undefined;
              const query = input?.query;
              const scope = input?.sources?.length ? input.sources.join(", ") : null;
              const isDone = p.state === "output-available";
              const out = isDone ? (p.output as SearchOutput) : null;
              const status = !isDone ? "running" : out?.status === "ok" ? "done" : "error";
              const resolvedScope =
                out?.status === "ok" && out.scope?.matched.length
                  ? out.scope.matched.join(", ")
                  : scope;
              const summary =
                out?.status === "ok"
                  ? `${out.chunks.length} chunk${out.chunks.length === 1 ? "" : "s"}`
                  : out?.status === "unknown_source"
                    ? "unknown source"
                    : out?.status === "no_results"
                      ? "no results"
                      : null;
              return (
                <ChatToolCall
                  key={i}
                  name={
                    <>
                      search{resolvedScope ? ` · ${resolvedScope}` : ""}
                      {query ? <span className="text-ink-3">{` "${query}"`}</span> : null}
                    </>
                  }
                  status={status}
                  result={summary ?? undefined}
                />
              );
            }
            if (p.type === "tool-listSources") {
              const isDone = p.state === "output-available";
              const out = isDone ? (p.output as ListSourcesOutput) : null;
              return (
                <ChatToolCall
                  key={i}
                  name="list sources"
                  status={isDone ? "done" : "running"}
                  result={out ? `${out.count} source${out.count === 1 ? "" : "s"}` : undefined}
                />
              );
            }
            return null;
          })}
        </Message>
      ))}
      {showThinking && <ChatThinking streaming label="Thinking" />}
      <div ref={bottomRef} aria-hidden className="h-0 w-0 scroll-mb-32" />
      {/* "Jump to latest" pill — rendered as a portal-like sibling of the
          composer rather than `fixed` from the viewport. The chat page shell
          provides the positioning context via `data-chat-shell`. */}
      {!isAtBottom && <JumpToLatest onJump={jumpToBottom} loading={isLoading} />}
    </div>
  );
};

// Sits inside the scrollable thread but pins itself to the bottom of the
// nearest `[data-chat-shell]` container via `sticky bottom-0`. That way it
// always rides just above the composer regardless of composer height, with no
// fragile fixed-viewport magic numbers.
function JumpToLatest({ onJump, loading }: { onJump: () => void; loading: boolean }) {
  return (
    <div className="pointer-events-none sticky bottom-3 z-20 flex justify-center">
      <button
        type="button"
        onClick={onJump}
        aria-label="Jump to latest"
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 font-mono text-[11.5px] text-ink-2 shadow-lg transition-colors hover:border-border-strong hover:text-ink"
      >
        <ArrowDown className="size-3" />
        {loading ? "new messages" : "jump to latest"}
      </button>
    </div>
  );
}

export default ChatArea;
