"use client";

import * as React from "react";
import { cn } from "../../cn";

type ComposerMention = {
  id: string;
  /** Visible name — used both for chip text and dropdown match. */
  label: string;
  /** Optional secondary text in the suggestion row (e.g. kind, path). */
  secondary?: React.ReactNode;
  /** Fallback string used for matching alongside `label`. */
  alias?: string;
};

type ComposerProps = Omit<React.ComponentProps<"div">, "onChange" | "onSubmit"> & {
  placeholder?: string;
  /** Submit handler. `mentionIds` is empty when `mentions` is not provided. */
  onSubmit: (text: string, mentionIds: string[]) => void;
  /** When set, enable `@`-triggered mention chip picker. */
  mentions?: ComposerMention[];
  /** Streaming indicator — when true and `onStop` is set, the send button
   *  switches to a stop button. */
  isLoading?: boolean;
  onStop?: () => void;
  /** Left-side slot in the bottom bar — typically `<ComposerTool>` buttons. */
  tools?: React.ReactNode;
  /** Small text under the composer (split into two flex columns via `<span>`s). */
  hint?: React.ReactNode;
  /** Send button label content. Defaults to "Send →". */
  submitLabel?: React.ReactNode;
  /** Disable wrapper width cap + outer padding for inline placement. */
  bare?: boolean;
};

// Round-trip token format used to encode mentions in submitted text. Consumers
// (renderers, persistence) match this regex to detect and re-render chips.
// Keep this regex synchronised on the render side.
const tokenFor = (label: string) => `@[${label}]`;

const chipClass =
  "mx-0.5 inline-flex items-center rounded-xs bg-brand-soft px-1.5 py-px align-middle font-mono text-[11px] text-brand";

const SendIcon = (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden
  >
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

const StopIcon = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
    <rect width="10" height="10" rx="1" />
  </svg>
);

type MentionState = {
  query: string;
  active: number;
  range: Range;
} | null;

function Composer({
  placeholder = "Ask anything…",
  onSubmit,
  mentions,
  isLoading = false,
  onStop,
  tools,
  hint,
  submitLabel,
  bare = false,
  className,
  ...props
}: ComposerProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [hasContent, setHasContent] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [mention, setMention] = React.useState<MentionState>(null);

  const mentionsEnabled = !!mentions;
  const availableForMention = React.useMemo(
    () => (mentions ?? []).filter((m) => !selectedIds.includes(m.id)),
    [mentions, selectedIds]
  );

  const suggestions = React.useMemo(() => {
    if (!mention || !mentionsEnabled) return [];
    const q = mention.query.toLowerCase();
    return availableForMention
      .filter(
        (m) =>
          !q || m.label.toLowerCase().includes(q) || (m.alias && m.alias.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [mention, mentionsEnabled, availableForMention]);

  // Walk the editor DOM and reconstruct the text the user sees, with chips
  // collapsed to `@[label]` tokens.
  const serialize = React.useCallback((): { text: string; ids: string[] } => {
    const el = editorRef.current;
    if (!el) return { text: "", ids: [] };
    let text = "";
    const ids: string[] = [];
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent ?? "";
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const elNode = node as HTMLElement;
        const mentionId = elNode.dataset.mentionId;
        const label = elNode.dataset.mentionLabel;
        if (mentionId && label) {
          text += tokenFor(label);
          ids.push(mentionId);
          return;
        }
        if (elNode.tagName === "BR") {
          text += "\n";
          return;
        }
        for (const child of Array.from(elNode.childNodes)) walk(child);
        if (elNode.tagName === "DIV" || elNode.tagName === "P") text += "\n";
      }
    };
    for (const child of Array.from(el.childNodes)) walk(child);
    return { text: text.replace(/\n+$/, ""), ids };
  }, []);

  // Reconcile React state with DOM after edits.
  const syncFromDom = React.useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const chips = Array.from(el.querySelectorAll<HTMLElement>("[data-mention-id]"));
    const ids = chips.map((c) => c.dataset.mentionId!).filter(Boolean);
    setSelectedIds((prev) =>
      prev.length === ids.length && prev.every((id, i) => id === ids[i]) ? prev : ids
    );
    setHasContent((el.textContent ?? "").trim().length > 0 || ids.length > 0);
  }, []);

  // Look at the caret and decide if the user is mid-`@mention`.
  const detectMention = React.useCallback(() => {
    if (!mentionsEnabled) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) {
      setMention(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
      setMention(null);
      return;
    }
    const text = node.textContent ?? "";
    const offset = range.startOffset;
    let at = -1;
    for (let i = offset - 1; i >= 0; i--) {
      const ch = text[i];
      if (ch === "@") {
        const prev = i === 0 ? " " : text[i - 1];
        if (/\s/.test(prev) || i === 0) at = i;
        break;
      }
      if (/\s/.test(ch)) break;
    }
    if (at === -1) {
      setMention(null);
      return;
    }
    const query = text.slice(at + 1, offset);
    const queryRange = document.createRange();
    queryRange.setStart(node, at);
    queryRange.setEnd(node, offset);
    setMention((prev) => ({
      query,
      active: prev?.query === query ? prev.active : 0,
      range: queryRange,
    }));
  }, [mentionsEnabled]);

  const onInput = React.useCallback(() => {
    syncFromDom();
    detectMention();
  }, [syncFromDom, detectMention]);

  const closeMention = () => setMention(null);

  const pickMention = (m: ComposerMention) => {
    const el = editorRef.current;
    if (!el || !mention) return;
    mention.range.deleteContents();
    const chip = document.createElement("span");
    chip.className = chipClass;
    chip.contentEditable = "false";
    chip.dataset.mentionId = m.id;
    chip.dataset.mentionLabel = m.label;
    chip.textContent = `@${m.label}`;
    const space = document.createTextNode(" ");
    mention.range.insertNode(space);
    mention.range.insertNode(chip);

    const after = document.createRange();
    after.setStartAfter(space);
    after.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(after);

    setMention(null);
    syncFromDom();
  };

  const clearEditor = () => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = "";
    setSelectedIds([]);
    setHasContent(false);
    setMention(null);
  };

  const submit = () => {
    const { text, ids } = serialize();
    if (isLoading && onStop && !text.trim() && ids.length === 0) {
      onStop();
      return;
    }
    if (!text.trim() && ids.length === 0) return;
    onSubmit(text, ids);
    clearEditor();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (mentionsEnabled && mention && suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMention((m) => (m ? { ...m, active: (m.active + 1) % suggestions.length } : m));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMention((m) =>
          m ? { ...m, active: (m.active - 1 + suggestions.length) % suggestions.length } : m
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickMention(suggestions[mention.active]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeMention();
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
      return;
    }

    if (e.key === "Backspace" && mentionsEnabled) {
      // Delete adjacent mention chips atomically when caret sits right after
      // one — browsers otherwise split the chip into raw text.
      const sel = window.getSelection();
      if (sel && sel.isCollapsed && sel.rangeCount > 0) {
        const r = sel.getRangeAt(0);
        const node = r.startContainer;
        const offset = r.startOffset;
        if (node.nodeType === Node.TEXT_NODE && offset === 0) {
          const prev = (node as Text).previousSibling as HTMLElement | null;
          if (prev && prev.dataset && prev.dataset.mentionId) {
            e.preventDefault();
            prev.remove();
            syncFromDom();
            return;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const child = (node as Element).childNodes[offset - 1] as HTMLElement | undefined;
          if (child && child.nodeType === Node.ELEMENT_NODE && child.dataset?.mentionId) {
            e.preventDefault();
            child.remove();
            syncFromDom();
            return;
          }
        }
      }
    }
  };

  // Paste plain text only — incoming HTML would carry styles and could sneak
  // nested contenteditable=false nodes into the editor.
  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  React.useEffect(() => {
    syncFromDom();
  }, [syncFromDom]);

  const showStop = isLoading && !!onStop && !hasContent;
  const effectivePlaceholder = hasContent ? "" : placeholder;
  const sendDisabled = !showStop && !hasContent;

  return (
    <div
      data-slot="composer"
      className={cn(
        bare
          ? ""
          : "bg-[linear-gradient(180deg,transparent,var(--indox-bg)_60%)] px-7 pt-[18px] pb-6",
        className
      )}
      {...props}
    >
      <div className={cn("relative", bare ? "" : "mx-auto max-w-[780px]")}>
        {mentionsEnabled && mention && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 z-10 mb-2 max-h-64 overflow-y-auto rounded-md border border-border bg-surface font-mono text-[12px] shadow-lg">
            <div className="border-b border-border px-3 py-2 text-[10.5px] uppercase tracking-[0.14em] text-ink-3">
              mentions
            </div>
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickMention(s);
                }}
                onMouseEnter={() => setMention((m) => (m ? { ...m, active: i } : m))}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left transition-colors",
                  i === mention.active ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2"
                )}
              >
                <span className="truncate">{s.label}</span>
                {s.secondary && (
                  <span className="ml-3 shrink-0 text-[10.5px] text-ink-3">{s.secondary}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div
          className="flex flex-col rounded-xl border border-border-strong bg-surface transition-colors focus-within:border-brand focus-within:shadow-[0_0_0_3px_var(--indox-accent-soft)]"
          onClick={() => editorRef.current?.focus()}
        >
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={onInput}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={() => setTimeout(closeMention, 100)}
            data-placeholder={effectivePlaceholder}
            spellCheck={false}
            className="max-h-60 min-h-[22px] overflow-y-auto whitespace-pre-wrap break-words px-5 py-4 font-sans text-[14.5px] leading-[1.5] text-ink outline-none [&:empty]:before:pointer-events-none [&:empty]:before:text-ink-3 [&:empty]:before:content-[attr(data-placeholder)]"
          />
          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
            <div className="flex items-center gap-1">{tools}</div>
            <button
              type="button"
              onClick={submit}
              aria-label={showStop ? "Stop generating" : "Send message"}
              disabled={sendDisabled}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3.5 py-[7px] font-mono text-[12px] font-medium transition-colors",
                sendDisabled
                  ? "pointer-events-none bg-surface-2 text-ink-3"
                  : showStop
                    ? "bg-surface-2 text-ink hover:bg-surface-3"
                    : "bg-ink text-background hover:bg-white"
              )}
            >
              {showStop ? <>Stop {StopIcon}</> : (submitLabel ?? <>Send {SendIcon}</>)}
            </button>
          </div>
        </div>

        {hint && (
          <div className="mt-2 flex justify-between gap-3 px-1.5 font-mono text-[10.5px] tracking-[0.02em] text-ink-3">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

export { Composer };
export type { ComposerProps, ComposerMention };
