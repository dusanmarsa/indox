"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChatContext, type ChatSource } from "./context";
import { CornerDownLeft, Square } from "lucide-react";
import { motion } from "motion/react";

// The chip token format embedded in submitted text. Picked because `@[…]` is
// rare in normal prose and trivial to round-trip with a regex on the render
// side. Keep this in sync with `MENTION_TOKEN_RE` in Area.tsx.
const tokenFor = (displayName: string) => `@[${displayName}]`;

type MentionState = {
  query: string;
  active: number;
  range: Range; // saved caret range pointing at the `@…query` text in the editor
} | null;

const chipClass =
  "inline-flex items-center align-middle font-mono text-xs text-(--indox-muted)";

const ChatInput = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [hasContent, setHasContent] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mention, setMention] = useState<MentionState>(null);
  const { append, stop, isLoading, sources } = useChatContext();

  const availableForMention = useMemo(
    () => sources.filter((s) => !selectedIds.includes(s.id)),
    [sources, selectedIds],
  );

  const suggestions = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return availableForMention
      .filter(
        (s) =>
          !q ||
          s.displayName.toLowerCase().includes(q) ||
          s.externalId.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [mention, availableForMention]);

  // Walk the editor DOM, returning the text the user "sees" with chips
  // replaced by their @[name] tokens, and the IDs of all chips in order of
  // appearance.
  const serialize = useCallback((): { text: string; ids: string[] } => {
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
        const sourceId = elNode.dataset.sourceId;
        const name = elNode.dataset.sourceName;
        if (sourceId && name) {
          text += tokenFor(name);
          ids.push(sourceId);
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

  // Read chip data-attrs out of the DOM to keep selectedIds in sync with what
  // the user can actually see.
  const syncSelectedFromDom = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const chips = Array.from(
      el.querySelectorAll<HTMLElement>("[data-source-id]"),
    );
    const ids = chips.map((c) => c.dataset.sourceId!).filter(Boolean);
    setSelectedIds((prev) =>
      prev.length === ids.length && prev.every((id, i) => id === ids[i])
        ? prev
        : ids,
    );
    setHasContent((el.textContent ?? "").trim().length > 0 || ids.length > 0);
  }, []);

  // Look at the caret position and decide whether the user is mid-mention. If
  // the text immediately before the caret contains `@<query>` with no
  // whitespace inside, surface the dropdown for that query.
  const detectMention = useCallback(() => {
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
        // `@` must start a token. Account for prior sibling being a chip — the
        // chip span sits at the boundary, so any `@` at i=0 inside this text
        // node is valid regardless of what comes before in the editor.
        if (/\s/.test(prev) || i === 0) {
          at = i;
        }
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
  }, []);

  const onInput = useCallback(() => {
    syncSelectedFromDom();
    detectMention();
  }, [syncSelectedFromDom, detectMention]);

  const closeMention = () => setMention(null);

  const pickSource = (s: ChatSource) => {
    const el = editorRef.current;
    if (!el || !mention) return;
    // Replace the `@query` range with a chip span + trailing space.
    mention.range.deleteContents();
    const chip = document.createElement("span");
    chip.className = chipClass;
    chip.contentEditable = "false";
    chip.dataset.sourceId = s.id;
    chip.dataset.sourceName = s.displayName;
    chip.textContent = `@${s.displayName}`;
    const space = document.createTextNode(" ");
    mention.range.insertNode(space);
    mention.range.insertNode(chip);

    // Move caret after the trailing space.
    const after = document.createRange();
    after.setStartAfter(space);
    after.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(after);

    setMention(null);
    syncSelectedFromDom();
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
    if (isLoading && !text.trim() && ids.length === 0) {
      stop();
      return;
    }
    if (!text.trim() && ids.length === 0) return;
    append(text, ids.length ? ids : undefined);
    clearEditor();
  };

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (mention && suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMention((m) =>
          m ? { ...m, active: (m.active + 1) % suggestions.length } : m,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMention((m) =>
          m
            ? {
                ...m,
                active:
                  (m.active - 1 + suggestions.length) % suggestions.length,
              }
            : m,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickSource(suggestions[mention.active]);
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

    if (e.key === "Backspace") {
      // If the caret is at the start of a text node sitting right after a
      // chip, delete the chip atomically. Firefox already does this; Chrome
      // and Safari sometimes split the chip into raw text instead.
      const sel = window.getSelection();
      if (sel && sel.isCollapsed && sel.rangeCount > 0) {
        const r = sel.getRangeAt(0);
        const node = r.startContainer;
        const offset = r.startOffset;
        if (node.nodeType === Node.TEXT_NODE && offset === 0) {
          const prev = (node as Text).previousSibling as HTMLElement | null;
          if (prev && prev.dataset && prev.dataset.sourceId) {
            e.preventDefault();
            prev.remove();
            syncSelectedFromDom();
            return;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const child = (node as Element).childNodes[offset - 1] as
            | HTMLElement
            | undefined;
          if (child && child.nodeType === Node.ELEMENT_NODE && child.dataset?.sourceId) {
            e.preventDefault();
            child.remove();
            syncSelectedFromDom();
            return;
          }
        }
      }
    }
  };

  // On paste, force plain text — pasted HTML would carry styles and could
  // sneak nested contenteditable=false nodes into the editor.
  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  // Reconcile selectedIds with the DOM after the sources list arrives — if a
  // chip is somehow orphaned (source removed) we want to know.
  useEffect(() => {
    syncSelectedFromDom();
  }, [syncSelectedFromDom]);

  const showStop = isLoading && !hasContent;
  const placeholder = hasContent
    ? ""
    : "ask anything — type @ to scope to a source";

  return (
    <motion.form
      className="relative max-w-4xl w-full mx-auto"
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {mention && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 max-h-64 overflow-y-auto border border-(--indox-border) bg-(--indox-surface) font-mono text-[12px] shadow-lg z-10">
          <div className="px-3 py-1.5 text-[10.5px] uppercase tracking-wider text-(--indox-dim) border-b border-(--indox-border)">
            sources
          </div>
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pickSource(s);
              }}
              onMouseEnter={() =>
                setMention((m) => (m ? { ...m, active: i } : m))
              }
              className={`flex w-full items-center justify-between px-3 py-2 text-left ${
                i === mention.active
                  ? "bg-(--indox-border) text-(--indox-fg)"
                  : "text-(--indox-muted) hover:bg-(--indox-border)"
              }`}
            >
              <span className="truncate">{s.displayName}</span>
              <span className="ml-3 shrink-0 text-[10.5px] text-(--indox-dim)">
                {s.kind}
              </span>
            </button>
          ))}
        </div>
      )}

      <div
        className="flex items-start gap-2 border border-(--indox-border) bg-(--indox-surface) px-3 py-2 focus-within:border-(--indox-muted) transition-colors"
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
          data-placeholder={placeholder}
          spellCheck={false}
          className="flex-1 min-h-7 max-h-60 overflow-y-auto p-1 font-mono text-[13px] outline-none whitespace-pre-wrap break-words [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-(--indox-dim) [&:empty]:before:pointer-events-none"
        />
        <button
          type="submit"
          aria-label={showStop ? "Stop generating" : "Send message"}
          disabled={!showStop && !hasContent}
          className="shrink-0 self-end p-1.5 text-(--indox-muted) hover:text-(--indox-fg) disabled:opacity-40 disabled:hover:text-(--indox-muted)"
        >
          {showStop ? (
            <Square className="size-3.5 fill-current" />
          ) : (
            <CornerDownLeft className="size-3.5" />
          )}
        </button>
      </div>
    </motion.form>
  );
};

export default ChatInput;
