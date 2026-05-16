"use client";

import { memo, type ReactNode } from "react";
import type { UIMessage } from "ai";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { cn } from "@/lib/utils";

const plugins = { cjk, code, math, mermaid };

// Per-tag styling via the `components` prop, the way Streamdown's docs
// recommend. Code blocks are intentionally NOT overridden — the `code` plugin
// renders its own chrome (language label, copy/download, Shiki theming) and
// we'd be fighting it. Inline `<code>` is the only thing we override, with a
// guard against the block-code className the plugin sets.
const components = {
  h1: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 {...p} className="mt-6 text-[18px] font-semibold tracking-[-0.02em] text-foreground" />
  ),
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...p} className="mt-5 text-[16px] font-semibold tracking-[-0.015em] text-foreground" />
  ),
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...p} className="mt-4 text-[14px] font-semibold tracking-[-0.01em] text-foreground" />
  ),
  h4: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 {...p} className="mt-4 text-[13px] font-semibold text-foreground" />
  ),
  // Render markdown paragraphs as `<div>` instead of `<p>`. Streamdown wraps
  // images in a `<div>` for hover affordances, and `<div>` inside `<p>` is
  // invalid HTML — React's hydration check (rightly) blows up. Using `<div>`
  // here is the standard workaround for `react-markdown`-shaped renderers.
  p: (p: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...p} className="leading-[1.7] text-foreground" />
  ),
  a: ({ href, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="text-(--indox-accent) underline decoration-(--indox-accent)/40 underline-offset-2 transition-colors hover:decoration-(--indox-accent)"
      {...rest}
    />
  ),
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...p} className="list-disc space-y-1 pl-5 text-foreground" />
  ),
  ol: (p: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol {...p} className="list-decimal space-y-1 pl-5 text-foreground" />
  ),
  li: (p: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li {...p} className="[&>p]:m-0" />
  ),
  blockquote: (p: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      {...p}
      className="border-l-2 border-(--indox-accent) pl-3 text-(--indox-muted) italic"
    />
  ),
  hr: (p: React.HTMLAttributes<HTMLHRElement>) => (
    <hr {...p} className="my-4 border-(--indox-border)" />
  ),
  table: (p: React.HTMLAttributes<HTMLTableElement>) => (
    <table {...p} className="w-full border-collapse text-left text-[13px]" />
  ),
  th: (p: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th {...p} className="border-b border-(--indox-border) px-3 py-1.5 font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-(--indox-dim)" />
  ),
  td: (p: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td {...p} className="border-b border-(--indox-border) px-3 py-2 font-mono text-[12px] text-(--indox-muted)" />
  ),
  // No `code` override — the @streamdown/code plugin renders block code
  // via its own component, and overriding `code` here would bypass it.
  // Inline-only styling lives in globals.css scoped to `.message-body`.
};

type Role = UIMessage["role"];

export function Message({ from, children }: { from: Role; children: ReactNode }) {
  const isUser = from === "user";
  return (
    <div
      className={cn(
        "flex w-full max-w-[95%] flex-col gap-2",
        isUser ? "ml-auto items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "flex w-full min-w-0 max-w-full flex-col gap-2 text-[14px]",
          isUser
            ? "w-fit ml-auto border border-(--indox-border) bg-(--indox-surface) px-4 py-3 text-foreground"
            : "text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Memo: Streamdown re-parses on every render. Stable string → no work when
// sibling parts (tool calls) update during streaming.
export const MessageBody = memo(
  function MessageBody({ children }: { children: string }) {
    return (
      <Streamdown
        className="message-body size-full flex flex-col gap-3 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
        plugins={plugins}
        components={components}
      >
        {children}
      </Streamdown>
    );
  },
  (prev, next) => prev.children === next.children,
);
