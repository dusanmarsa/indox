"use client";

import { useMemo } from "react";
import { Composer } from "@indox/ui";
import { useChatContext } from "./context";

const ChatInput = () => {
  const { append, stop, isLoading, sources } = useChatContext();

  const mentions = useMemo(
    () =>
      sources.map((s) => ({
        id: s.id,
        label: s.displayName,
        alias: s.externalId,
        secondary: s.kind,
      })),
    [sources]
  );

  return (
    <Composer
      bare
      placeholder="ask anything — type @ to scope to a source"
      mentions={mentions}
      isLoading={isLoading}
      onStop={stop}
      onSubmit={(text, ids) => append(text, ids.length ? ids : undefined)}
      hint={
        <>
          <span>type @ to scope to a source</span>
          <span>↵ send · ⇧↵ newline</span>
        </>
      }
    />
  );
};

export default ChatInput;
