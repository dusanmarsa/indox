"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("./Widget").then((m) => m.ChatWidget), { ssr: false });

export function ChatWidgetLazy({ workspaceSlug }: { workspaceSlug?: string }) {
  return <ChatWidget workspaceSlug={workspaceSlug} />;
}
