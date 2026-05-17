import { type ReactNode } from "react";

/** Terminal-styled code block: dot row + label, then a monospace body. */
export function CodeBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2">
        <span className="size-2 rounded-full bg-ink-3" aria-hidden />
        <span className="size-2 rounded-full bg-ink-3" aria-hidden />
        <span className="size-2 rounded-full bg-ink-3" aria-hidden />
        <span className="ml-1 font-mono text-[11px] text-ink-2">{label}</span>
      </div>
      <pre className="overflow-x-auto px-6 py-5 font-mono text-[12.5px] leading-[1.8] text-ink [tab-size:2]">
        {children}
      </pre>
    </div>
  );
}

// Inline color helpers — keep token styling co-located with the code blocks
// so the markup reads top-to-bottom.
export const C = {
  Dim: ({ children }: { children: ReactNode }) => (
    <span style={{ color: "var(--indox-dim)" }}>{children}</span>
  ),
  Muted: ({ children }: { children: ReactNode }) => (
    <span style={{ color: "var(--indox-muted)" }}>{children}</span>
  ),
  Ok: ({ children }: { children: ReactNode }) => (
    <span style={{ color: "var(--indox-ok)" }}>{children}</span>
  ),
  Accent: ({ children }: { children: ReactNode }) => (
    <span style={{ color: "var(--indox-accent)" }}>{children}</span>
  ),
};
