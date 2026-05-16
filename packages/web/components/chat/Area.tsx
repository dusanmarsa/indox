"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { Check, Search } from "lucide-react";
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
      nodes.push(
        <Fragment key={`t-${lastIndex}`}>{text.slice(lastIndex, idx)}</Fragment>,
      );
    }
    nodes.push(
      <span
        key={`c-${idx}`}
        className="inline-flex items-center align-middle border border-(--indox-border) bg-(--indox-bg) px-1.5 py-0.5 mx-0.5 font-mono text-[11px] text-(--indox-muted)"
      >
        @{m[1]}
      </span>,
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
      { root: null, rootMargin: "0px 0px 160px 0px", threshold: 0 },
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
    <div className="flex-1 flex flex-col gap-8 pt-20 pb-20">
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
              const scope = input?.sources?.length
                ? input.sources.join(", ")
                : null;

              if (p.state !== "output-available") {
                return (
                  <div key={i} className="flex items-center gap-2 font-mono text-[12px] text-(--indox-muted)">
                    <span className="inline-block h-2 w-2 animate-pulse bg-(--indox-dim)" />
                    <span>
                      Searching{scope ? ` ${scope}` : ""}
                      {query ? ` for "${query}"` : ""}…
                    </span>
                  </div>
                );
              }

              const out = p.output as SearchOutput;
              const summary =
                out.status === "ok"
                  ? `${out.chunks.length} chunk${out.chunks.length === 1 ? "" : "s"}`
                  : out.status === "unknown_source"
                  ? "unknown source"
                  : "no results";
              const resolvedScope =
                out.status === "ok" && out.scope?.matched.length
                  ? out.scope.matched.join(", ")
                  : scope;

              return (
                <div
                  key={i}
                  className="flex items-center gap-2 font-mono text-[11.5px] text-(--indox-dim)"
                >
                  {out.status === "ok" ? (
                    <Check className="size-3 text-(--indox-ok)" />
                  ) : (
                    <Search className="size-3" />
                  )}
                  <span>
                    Searched
                    {resolvedScope ? (
                      <> <span className="text-(--indox-muted)">{resolvedScope}</span></>
                    ) : null}
                    {query ? (
                      <> for <span className="italic text-(--indox-muted)">&ldquo;{query}&rdquo;</span></>
                    ) : null}
                    {" · "}
                    {summary}
                  </span>
                </div>
              );
            }
            if (p.type === "tool-listSources") {
              if (p.state !== "output-available") {
                return (
                  <div key={i} className="flex items-center gap-2 font-mono text-[12px] text-(--indox-muted)">
                    <span className="inline-block h-2 w-2 animate-pulse bg-(--indox-dim)" />
                    <span>Listing sources…</span>
                  </div>
                );
              }
              const out = p.output as ListSourcesOutput;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 font-mono text-[11.5px] text-(--indox-dim)"
                >
                  <Check className="size-3 text-(--indox-ok)" />
                  <span>
                    Listed sources · <span className="text-(--indox-muted)">{out.count}</span>
                  </span>
                </div>
              );
            }
            return null;
          })}
        </Message>
      ))}
      {showThinking && (
        <div className="flex items-center gap-2 font-mono text-[12px] text-(--indox-muted)">
          <span className="inline-block h-2 w-2 animate-pulse bg-(--indox-dim)" />
          <span>Thinking…</span>
        </div>
      )}
      <div ref={bottomRef} aria-hidden className="h-0 w-0 scroll-mb-32" />
      {!isAtBottom && (
        <button
          type="button"
          onClick={jumpToBottom}
          aria-label="Jump to latest"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 border border-(--indox-border) bg-(--indox-surface) px-3 py-1.5 font-mono text-[11.5px] text-(--indox-muted) shadow-lg hover:text-(--indox-fg) hover:border-(--indox-muted) transition-colors"
        >
          <ArrowDown className="size-3" />
          {isLoading ? "new messages" : "jump to latest"}
        </button>
      )}
    </div>
  );
};

export default ChatArea;
