import * as React from "react";

/**
 * Inline syntax-color spans for use inside `<CodeCard>` or `<CodeBlock>` bodies.
 * Usage:
 *   <Code.Keyword>const</Code.Keyword> <Code.String>"value"</Code.String>
 */
const Code = {
  Dim: ({ children }: { children: React.ReactNode }) => (
    <span className="text-ink-3">{children}</span>
  ),
  Muted: ({ children }: { children: React.ReactNode }) => (
    <span className="text-ink-2">{children}</span>
  ),
  Ok: ({ children }: { children: React.ReactNode }) => <span className="text-ok">{children}</span>,
  Accent: ({ children }: { children: React.ReactNode }) => (
    <span className="text-brand">{children}</span>
  ),
  Keyword: ({ children }: { children: React.ReactNode }) => (
    <span className="text-(--indox-syn-keyword)">{children}</span>
  ),
  String: ({ children }: { children: React.ReactNode }) => (
    <span className="text-(--indox-syn-string)">{children}</span>
  ),
};

export { Code };
